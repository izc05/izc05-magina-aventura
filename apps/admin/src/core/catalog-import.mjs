const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;
const ROUTE_KINDS = new Set(['circular', 'linear', 'out_and_back']);
const DIFFICULTIES = new Set(['easy', 'moderate', 'hard', 'expert']);
const VERIFICATION_STATES = new Set([
  'official_verified',
  'cross_checked',
  'community_unverified',
  'editorial_derived',
  'stale',
  'unknown',
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function duplicateValues(items, key) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of items) {
    const value = item?.[key];
    if (!nonEmpty(value)) continue;
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

export function validateCatalogManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return { valid: false, errors: ['El manifest debe ser un objeto.'] };
  }

  for (const field of ['catalog', 'snapshot_version', 'source_commit']) {
    if (!nonEmpty(manifest[field])) errors.push(`Falta ${field}.`);
  }

  if (!SHA256_PATTERN.test(String(manifest.manifest_sha256 ?? ''))) {
    errors.push('manifest_sha256 no tiene formato SHA-256 válido.');
  }

  for (const field of ['routes', 'sources', 'restrictions', 'pois', 'track_leads']) {
    if (!Array.isArray(manifest[field])) errors.push(`${field} debe ser un array.`);
  }

  const routes = asArray(manifest.routes);
  const sources = asArray(manifest.sources);
  const restrictions = asArray(manifest.restrictions);
  const pois = asArray(manifest.pois);
  const trackLeads = asArray(manifest.track_leads);

  for (const duplicate of duplicateValues(routes, 'id')) {
    errors.push(`ID de ruta duplicado: ${duplicate}.`);
  }
  for (const duplicate of duplicateValues(routes, 'code')) {
    errors.push(`Código de ruta duplicado: ${duplicate}.`);
  }
  for (const duplicate of duplicateValues(routes, 'slug')) {
    errors.push(`Slug de ruta duplicado: ${duplicate}.`);
  }
  for (const duplicate of duplicateValues(sources, 'id')) {
    errors.push(`ID de fuente duplicado: ${duplicate}.`);
  }

  const sourceIds = new Set(sources.map((source) => source?.id).filter(nonEmpty));
  const routeIds = new Set(routes.map((route) => route?.id).filter(nonEmpty));

  for (const route of routes) {
    if (!nonEmpty(route?.id) || !nonEmpty(route?.code) || !nonEmpty(route?.slug) || !nonEmpty(route?.name)) {
      errors.push('Hay una ruta con identidad incompleta.');
      continue;
    }

    if (!nonEmpty(route.primary_municipality)) {
      errors.push(`La ruta ${route.id} no tiene municipio principal.`);
    }

    if (!Array.isArray(route.municipalities) || !route.municipalities.includes(route.primary_municipality)) {
      errors.push(`El municipio principal de ${route.id} no está incluido en municipalities.`);
    }

    if (route.route_kind != null && !ROUTE_KINDS.has(route.route_kind)) {
      errors.push(`route_kind inválido en ${route.id}: ${route.route_kind}.`);
    }

    if (route.official_difficulty != null && !DIFFICULTIES.has(route.official_difficulty)) {
      errors.push(`Dificultad inválida en ${route.id}: ${route.official_difficulty}.`);
    }

    if (!VERIFICATION_STATES.has(route.verification_state)) {
      errors.push(`Estado de verificación inválido en ${route.id}.`);
    }

    if (!Array.isArray(route.source_ids)) {
      errors.push(`source_ids debe ser un array en ${route.id}.`);
    } else {
      for (const sourceId of route.source_ids) {
        if (!sourceIds.has(sourceId)) {
          errors.push(`La ruta ${route.id} referencia una fuente inexistente: ${sourceId}.`);
        }
      }
    }
  }

  for (const restriction of restrictions) {
    if (!routeIds.has(restriction?.route_id)) {
      errors.push(`La restricción ${restriction?.id ?? 'sin-id'} referencia una ruta inexistente: ${restriction?.route_id}.`);
    }
    for (const sourceId of asArray(restriction?.source_ids)) {
      if (!sourceIds.has(sourceId)) {
        errors.push(`La restricción ${restriction?.id ?? 'sin-id'} referencia una fuente inexistente: ${sourceId}.`);
      }
    }
  }

  for (const poi of pois) {
    if (!routeIds.has(poi?.route_id)) {
      errors.push(`El POI ${poi?.id ?? 'sin-id'} referencia una ruta inexistente: ${poi?.route_id}.`);
    }
    for (const sourceId of asArray(poi?.source_ids)) {
      if (!sourceIds.has(sourceId)) {
        errors.push(`El POI ${poi?.id ?? 'sin-id'} referencia una fuente inexistente: ${sourceId}.`);
      }
    }
  }

  for (const lead of trackLeads) {
    if (!routeIds.has(lead?.route_id)) {
      errors.push(`La pista de track referencia una ruta inexistente: ${lead?.route_id}.`);
    }
    if (nonEmpty(lead?.external_source_id) && !sourceIds.has(lead.external_source_id)) {
      errors.push(`La pista de track referencia una fuente inexistente: ${lead.external_source_id}.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function catalogImportSummary(manifest) {
  return {
    routes: asArray(manifest?.routes).length,
    sources: asArray(manifest?.sources).length,
    restrictions: asArray(manifest?.restrictions).length,
    pois: asArray(manifest?.pois).length,
    trackLeads: asArray(manifest?.track_leads).length,
  };
}

export async function computeCatalogManifestHash(manifest) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('SHA-256 no disponible en este entorno.');
  }

  const canonical = JSON.stringify({ ...manifest, manifest_sha256: '' });
  const bytes = new TextEncoder().encode(canonical);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `sha256:${hex}`;
}

export async function importCatalogManifest(api, manifest) {
  const validation = validateCatalogManifest(manifest);
  if (!validation.valid) {
    throw new Error(`Manifest inválido: ${validation.errors.join('; ')}`);
  }

  const computedHash = await computeCatalogManifestHash(manifest);
  if (computedHash !== manifest.manifest_sha256) {
    throw new Error(`Manifest inválido: SHA-256 no coincide (${computedHash}).`);
  }

  if (!api || typeof api.rpc !== 'function') {
    throw new Error('API de Admin sin soporte RPC.');
  }

  return api.rpc('admin_ingest_catalog_manifest', { payload: manifest });
}
