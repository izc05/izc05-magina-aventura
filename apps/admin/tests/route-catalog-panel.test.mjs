import assert from 'node:assert/strict';
import test from 'node:test';
import {
  catalogPanelBadge,
  routeCatalogPanelHtml,
} from '../src/core/route-catalog-panel.mjs';

const snapshot = {
  catalog_profile: {
    canonical_catalog_id: 'ma-junta-010',
    source_snapshot_version: '2026-09-16-v1',
    verification_state: 'official_verified',
    route_kind: 'circular',
    distance_km: 8.72,
    duration_minutes_min: 180,
    duration_minutes_max: 180,
    official_difficulty: 'moderate',
    elevation_gain_m: null,
    elevation_loss_m: null,
    elevation_min_m: null,
    elevation_max_m: null,
    family_profile: {
      editorialSuitability: 'review_required',
      minimumAge: null,
      strollerViability: 'unknown',
      factors: [],
    },
    source_checked_at: '2026-09-16T00:00:00Z',
  },
  municipalities: [
    { slug: 'bedmar-y-garciez', name: 'Bedmar y Garcíez', is_primary: true },
  ],
  catalog_restrictions: [
    {
      external_restriction_id: 'restriction-las-vinas-temporary-closure-2026',
      severity: 'blocking',
      status: 'active',
      reason: 'Cierre temporal oficial.',
      checked_at: '2026-09-16T00:00:00Z',
    },
  ],
  catalog_pois: [],
  catalog_track_leads: [],
  catalog_import: {
    snapshot_version: '2026-09-16-v1',
    manifest_sha256: 'sha256:8bee55ff570f087c5f87d163288d6da48f434d56abcdd1e2772f2a407a6d8441',
  },
};

test('catalog badge summarizes imported official state', () => {
  assert.equal(catalogPanelBadge(snapshot), 'Oficial · 1 cierre');
  assert.equal(catalogPanelBadge({}), 'Sin catálogo');
});

test('catalog panel renders official facts without converting unknown metrics to zero', () => {
  const html = routeCatalogPanelHtml(snapshot);
  assert.match(html, /Catálogo oficial/);
  assert.match(html, /8\.72 km/);
  assert.match(html, /3 h/);
  assert.match(html, /Moderada/);
  assert.match(html, /Circular/);
  assert.match(html, /Bedmar y Garcíez/);
  assert.match(html, /Pendiente/);
  assert.doesNotMatch(html, />0 m</);
});

test('catalog panel highlights active official blockers as read-only evidence', () => {
  const html = routeCatalogPanelHtml(snapshot);
  assert.match(html, /Restricción oficial activa/);
  assert.match(html, /Cierre temporal oficial/);
  assert.match(html, /data-catalog-restriction="blocking"/);
});

test('catalog panel explains missing geometry leads and POIs without inventing data', () => {
  const html = routeCatalogPanelHtml(snapshot);
  assert.match(html, /No hay pistas de track oficiales registradas todavía/);
  assert.match(html, /No hay POI canónicos importados todavía/);
});
