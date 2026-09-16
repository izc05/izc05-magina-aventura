import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  catalogImportSummary,
  importCatalogManifest,
  validateCatalogManifest,
} from '../src/core/catalog-import.mjs';

const manifest = JSON.parse(
  await readFile(new URL('../../../data/catalog/sierra-magina-official-v1.json', import.meta.url), 'utf8'),
);

test('official manifest contains the verified 17-route Sierra Mágina snapshot', () => {
  const validation = validateCatalogManifest(manifest);
  assert.deepEqual(validation, { valid: true, errors: [] });
  assert.deepEqual(catalogImportSummary(manifest), {
    routes: 17,
    sources: 19,
    restrictions: 2,
    pois: 0,
    trackLeads: 0,
  });
  assert.match(manifest.manifest_sha256, /^sha256:[a-f0-9]{64}$/);
});

test('Veredón-Mojón Blanco preserves its three official municipalities', () => {
  const route = manifest.routes.find((item) => item.id === 'ma-junta-017');
  assert.deepEqual(route.municipalities, ['mancha-real', 'pegalajar', 'torres']);
  assert.equal(route.primary_municipality, 'pegalajar');
});

test('El Peralejo preserves the sourced official family fact', () => {
  const route = manifest.routes.find((item) => item.id === 'ma-junta-005');
  assert.equal(route.family_profile.factors.length, 1);
  assert.equal(route.family_profile.factors[0].code, 'official_family_friendly');
  assert.deepEqual(route.family_profile.factors[0].sourceIds, ['junta-el-peralejo']);
});

test('manifest contains exactly the two current official blocking closures', () => {
  assert.deepEqual(
    manifest.restrictions.map((item) => item.route_id).sort(),
    ['ma-junta-001', 'ma-junta-010'],
  );
  assert.ok(manifest.restrictions.every((item) => item.severity === 'blocking' && item.status === 'active'));
});

test('validator rejects duplicate identities and broken references', () => {
  const invalid = structuredClone(manifest);
  invalid.routes[1].id = invalid.routes[0].id;
  invalid.routes[2].source_ids = ['missing-source'];
  invalid.restrictions[0].route_id = 'missing-route';

  const validation = validateCatalogManifest(invalid);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes('ID de ruta duplicado')));
  assert.ok(validation.errors.some((error) => error.includes('fuente inexistente')));
  assert.ok(validation.errors.some((error) => error.includes('ruta inexistente')));
});

test('authenticated adapter validates locally before calling the RPC', async () => {
  const calls = [];
  const api = {
    async rpc(name, args) {
      calls.push({ name, args });
      return { routes: 17 };
    },
  };

  const result = await importCatalogManifest(api, manifest);
  assert.deepEqual(calls, [{ name: 'admin_ingest_catalog_manifest', args: { payload: manifest } }]);
  assert.equal(result.routes, 17);

  const invalid = structuredClone(manifest);
  invalid.manifest_sha256 = '';
  await assert.rejects(() => importCatalogManifest(api, invalid), /Manifest inválido/);
  assert.equal(calls.length, 1);
});
