function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[char]);
}

function numberOrPending(value, suffix = '') {
  if (value === null || value === undefined || value === '') return 'Pendiente';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'Pendiente';
  return `${numeric}${suffix}`;
}

function difficultyLabel(value) {
  return ({
    easy: 'Fácil',
    moderate: 'Moderada',
    hard: 'Difícil',
    expert: 'Experta',
  })[value] ?? 'Pendiente';
}

function routeKindLabel(value) {
  return ({
    circular: 'Circular',
    linear: 'Lineal',
    out_and_back: 'Ida y vuelta',
  })[value] ?? 'Pendiente';
}

function durationLabel(minimum, maximum) {
  const min = Number(minimum);
  const max = Number(maximum);
  if (!Number.isFinite(min) || min <= 0) return 'Pendiente';
  const format = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest} min`;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  };
  if (!Number.isFinite(max) || max <= 0 || max === min) return format(min);
  return `${format(min)} – ${format(max)}`;
}

function dateLabel(value) {
  if (!value) return 'Sin revisar';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('es-ES');
}

function familyFacts(profile = {}) {
  const factors = Array.isArray(profile?.family_profile?.factors)
    ? profile.family_profile.factors
    : [];
  if (!factors.length) return '<p class="muted">Perfil familiar pendiente de revisión.</p>';
  return `<ul class="catalog-fact-list">${factors.map((factor) => `<li><strong>${esc(factor.code ?? 'Dato familiar')}</strong><span>${esc(factor.text ?? '')}</span></li>`).join('')}</ul>`;
}

function restrictionsHtml(snapshot = {}) {
  const restrictions = Array.isArray(snapshot.catalog_restrictions)
    ? snapshot.catalog_restrictions
    : [];
  if (!restrictions.length) return '<p class="muted">No hay restricciones canónicas importadas.</p>';

  return restrictions.map((restriction) => {
    const activeBlocking = restriction.status === 'active' && restriction.severity === 'blocking';
    return `<article class="catalog-restriction${activeBlocking ? ' is-blocking' : ''}" data-catalog-restriction="${esc(restriction.severity ?? 'info')}">
      <div><strong>${activeBlocking ? 'Restricción oficial activa' : 'Restricción importada'}</strong><small>${esc(dateLabel(restriction.checked_at))}</small></div>
      <p>${esc(restriction.reason ?? '')}</p>
    </article>`;
  }).join('');
}

function municipalitiesHtml(snapshot = {}) {
  const municipalities = Array.isArray(snapshot.municipalities) ? snapshot.municipalities : [];
  if (!municipalities.length) return '<span class="muted">Pendiente</span>';
  return municipalities.map((municipality) => `<span class="catalog-municipality${municipality.is_primary ? ' is-primary' : ''}">${esc(municipality.name ?? municipality.slug ?? 'Municipio')}</span>`).join('');
}

function trackLeadsHtml(snapshot = {}) {
  const leads = Array.isArray(snapshot.catalog_track_leads) ? snapshot.catalog_track_leads : [];
  if (!leads.length) return '<p class="muted">No hay pistas de track oficiales registradas todavía.</p>';
  return `<div class="catalog-track-leads">${leads.map((lead) => `<article><strong>${esc(String(lead.format ?? 'track').toUpperCase())}</strong><span>${esc(lead.status ?? 'discovered')}</span>${lead.source_url ? `<a href="${esc(lead.source_url)}" target="_blank" rel="noopener noreferrer">Abrir fuente ↗</a>` : ''}</article>`).join('')}</div>`;
}

function poisHtml(snapshot = {}) {
  const pois = Array.isArray(snapshot.catalog_pois) ? snapshot.catalog_pois : [];
  if (!pois.length) return '<p class="muted">No hay POI canónicos importados todavía.</p>';
  return `<div class="catalog-poi-list">${pois.map((poi) => `<article><strong>${esc(poi.name ?? 'POI')}</strong><span>${esc(poi.category ?? 'otro')}</span><small>${poi.longitude == null || poi.latitude == null ? 'Coordenadas pendientes' : `${esc(poi.latitude)}, ${esc(poi.longitude)}`}</small></article>`).join('')}</div>`;
}

export function catalogPanelBadge(snapshot = {}) {
  const profile = snapshot.catalog_profile;
  if (!profile) return 'Sin catálogo';
  const blockers = (Array.isArray(snapshot.catalog_restrictions) ? snapshot.catalog_restrictions : [])
    .filter((item) => item.status === 'active' && item.severity === 'blocking').length;
  const verified = profile.verification_state === 'official_verified' ? 'Oficial' : 'Importado';
  return blockers ? `${verified} · ${blockers} ${blockers === 1 ? 'cierre' : 'cierres'}` : verified;
}

export function routeCatalogPanelHtml(snapshot = {}) {
  const profile = snapshot.catalog_profile;
  if (!profile) {
    return `<section class="route-master-panel route-catalog-panel" data-route-master-panel="catalog">
      <div class="empty">Esta ruta todavía no está vinculada a un catálogo canónico.</div>
    </section>`;
  }

  const imported = snapshot.catalog_import ?? {};
  const hash = String(imported.manifest_sha256 ?? '');
  const shortHash = hash.startsWith('sha256:') ? `${hash.slice(7, 19)}…` : '—';

  return `<section class="route-master-panel route-catalog-panel" data-route-master-panel="catalog">
    <div class="route-panel-heading">
      <div>
        <p class="route-panel-kicker">Datos importados · solo lectura</p>
        <h3>Catálogo oficial</h3>
        <p class="muted">Estos datos conservan la evidencia del catálogo. Editar la versión operativa no modifica esta fotografía importada.</p>
      </div>
      <span class="status">${esc(catalogPanelBadge(snapshot))}</span>
    </div>

    <div class="catalog-identity-grid">
      <article><span>ID canónico</span><strong>${esc(profile.canonical_catalog_id ?? '—')}</strong></article>
      <article><span>Snapshot</span><strong>${esc(profile.source_snapshot_version ?? '—')}</strong></article>
      <article><span>Comprobado</span><strong>${esc(dateLabel(profile.source_checked_at))}</strong></article>
      <article><span>Integridad</span><strong>${esc(shortHash)}</strong></article>
    </div>

    <div class="route-master-metrics catalog-metrics">
      <div><span>Distancia oficial</span><strong>${esc(numberOrPending(profile.distance_km, ' km'))}</strong></div>
      <div><span>Desnivel +</span><strong>${esc(numberOrPending(profile.elevation_gain_m, ' m'))}</strong></div>
      <div><span>Desnivel −</span><strong>${esc(numberOrPending(profile.elevation_loss_m, ' m'))}</strong></div>
      <div><span>Duración</span><strong>${esc(durationLabel(profile.duration_minutes_min, profile.duration_minutes_max))}</strong></div>
      <div><span>Dificultad oficial</span><strong>${esc(difficultyLabel(profile.official_difficulty))}</strong></div>
      <div><span>Tipo</span><strong>${esc(routeKindLabel(profile.route_kind))}</strong></div>
    </div>

    <div class="catalog-section-grid">
      <article class="catalog-card">
        <h4>Municipios</h4>
        <div class="catalog-municipalities">${municipalitiesHtml(snapshot)}</div>
      </article>
      <article class="catalog-card">
        <h4>Perfil familiar</h4>
        ${familyFacts(profile)}
      </article>
    </div>

    <article class="catalog-card catalog-restrictions-card">
      <h4>Restricciones y cierres</h4>
      ${restrictionsHtml(snapshot)}
    </article>

    <div class="catalog-section-grid">
      <article class="catalog-card">
        <h4>Pistas de track</h4>
        ${trackLeadsHtml(snapshot)}
      </article>
      <article class="catalog-card">
        <h4>POI canónicos</h4>
        ${poisHtml(snapshot)}
      </article>
    </div>
  </section>`;
}
