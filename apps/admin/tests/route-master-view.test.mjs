import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROUTE_MASTER_TABS,
  routeDisplayCode,
  routeReadinessPresentation,
  routeMasterTabModels,
  routeMasterHeaderHtml,
  routeMasterShellHtml
} from '../src/core/route-master-view.mjs';

const snapshot = {
  route: {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    route_code: 'MAG-BED-001',
    slug: 'sendero-las-vinas',
    title: 'Sendero Las Viñas',
    municipality: 'Bedmar y Garcíez',
    status: 'review'
  },
  content: {
    distance_km: 7.4,
    elevation_gain_m: 320,
    elevation_loss_m: 320,
    duration_minutes: 180,
    difficulty: 'moderate',
    route_kind: 'circular',
    reward_xp: 450,
    reward_olives: 30
  },
  geometry: { version: 2, coordinates: [[-3.4, 37.9], [-3.39, 37.91]] },
  validation: { editorial_status: 'verified', track_status: 'verified', safety_status: 'reviewed' },
  access_points: [{ id: 'a1', kind: 'start', name: 'Inicio Las Viñas' }],
  sources: [{ id: 's1', official: true, label: 'Ayuntamiento' }, { id: 's2', official: false, label: 'Trabajo de campo' }],
  track_source: { format: 'gpx', source_kind: 'official', original_filename: 'las-vinas.gpx' },
  checkpoints: [{ id: 'c1' }, { id: 'c2' }],
  discoveries: [{ id: 'd1' }],
  media: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }],
  safety: [],
  readiness: {
    ready: false,
    reasons: ['Falta revisión de seguridad'],
    has_content: true,
    has_geometry: true,
    has_official_source: true,
    track_verified: true,
    editorial_verified: true,
    safety_reviewed: false,
    blocking_incidents: 0
  }
};

test('routeDisplayCode uses friendly code or slug and never exposes UUID as the label', () => {
  assert.equal(routeDisplayCode(snapshot.route), 'MAG-BED-001');
  assert.equal(routeDisplayCode({ ...snapshot.route, route_code: null }), 'sendero-las-vinas');
  assert.notEqual(routeDisplayCode(snapshot.route), snapshot.route.id);
});

test('routeReadinessPresentation explains why a route cannot be published', () => {
  assert.deepEqual(routeReadinessPresentation(snapshot.readiness), {
    ready: false,
    label: 'Pendiente de validación',
    tone: 'warning',
    reasons: ['Falta revisión de seguridad']
  });

  assert.deepEqual(routeReadinessPresentation({ ready: true, reasons: [] }), {
    ready: true,
    label: 'Lista para publicar',
    tone: 'success',
    reasons: []
  });
});

test('route master exposes the agreed tabs in a stable order with useful counts', () => {
  assert.deepEqual(ROUTE_MASTER_TABS.map((tab) => tab.id), [
    'summary','track','content','discoveries','media','safety','rewards','sources'
  ]);

  const tabs = routeMasterTabModels(snapshot);
  assert.equal(tabs.find((tab) => tab.id === 'track').badge, '2 checkpoints');
  assert.equal(tabs.find((tab) => tab.id === 'discoveries').badge, '1');
  assert.equal(tabs.find((tab) => tab.id === 'media').badge, '3');
  assert.equal(tabs.find((tab) => tab.id === 'sources').badge, '2');
});

test('route master header is human-facing and keeps UUID out of the visible HTML', () => {
  const html = routeMasterHeaderHtml(snapshot);
  assert.match(html, /Sendero Las Viñas/);
  assert.match(html, /Bedmar y Garcíez/);
  assert.match(html, /MAG-BED-001/);
  assert.match(html, /Pendiente de validación/);
  assert.match(html, /Falta revisión de seguridad/);
  assert.doesNotMatch(html, /aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/);
});

test('route master shell renders tabs and practical summary without exposing UUID', () => {
  const html = routeMasterShellHtml(snapshot, 'summary');
  assert.match(html, /data-route-master-tab="summary"/);
  assert.match(html, /data-route-master-tab="track"/);
  assert.match(html, /7\.4 km/);
  assert.match(html, /320 m/);
  assert.match(html, /3 h/);
  assert.match(html, /Circular/);
  assert.match(html, /450 XP/);
  assert.match(html, /30 aceitunas/);
  assert.match(html, /Inicio Las Viñas/);
  assert.doesNotMatch(html, /aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/);
});
