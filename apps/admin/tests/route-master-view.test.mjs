import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROUTE_MASTER_TABS,
  routeDisplayCode,
  routeReadinessPresentation,
  routeMasterTabModels,
  routeMasterHeaderHtml,
  routeMasterShellHtml,
  routeListRowHtml
} from '../src/core/route-master-view.mjs';

const snapshot = {
  route: {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    route_code: 'MAG-BED-001',
    slug: 'sendero-las-vinas',
    title: 'Sendero Las Viñas',
    municipality: 'Bedmar y Garcíez',
    municipality_name: 'Bedmar y Garcíez',
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
  validation: {
    editorial_status: 'verified',
    track_status: 'verified',
    field_status: 'planned',
    media_status: 'partial',
    safety_status: 'pending',
    notes: 'Revisar seguridad antes de publicar'
  },
  access_points: [{ id: 'a1', kind: 'start', name: 'Inicio Las Viñas' }],
  sources: [
    { id: 's1', official: true, label: 'Ayuntamiento', url: 'https://example.test/ayuntamiento', source_type: 'official', checked_at: '2026-09-16T10:00:00Z', notes: 'Ficha municipal' },
    { id: 's2', official: false, label: 'Trabajo de campo', url: 'https://example.test/campo', source_type: 'field', checked_at: null, notes: '' }
  ],
  track_source: {
    format: 'gpx',
    source_kind: 'official',
    original_filename: 'las-vinas.gpx',
    source_url: 'https://example.test/las-vinas.gpx',
    validated_at: '2026-09-16T11:00:00Z'
  },
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

test('track map tab embeds import and visual editor without asking for route UUID', () => {
  const html = routeMasterShellHtml(snapshot, 'track');
  assert.match(html, /data-route-master-panel="track"/);
  assert.match(html, /data-route-track-import-form/);
  assert.match(html, /accept="\.gpx,\.kml/);
  assert.match(html, /name="source_kind"/);
  assert.match(html, /data-route-master-track-editor/);
  assert.match(html, /las-vinas\.gpx/);
  assert.match(html, /GPX/);
  assert.doesNotMatch(html, /Ruta UUID/);
  assert.doesNotMatch(html, /aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/);
});

test('sources validation tab renders publication gate, provenance and editable controls', () => {
  const html = routeMasterShellHtml(snapshot, 'sources');
  assert.match(html, /data-route-master-panel="sources"/);
  assert.match(html, /Gate de publicación/);
  assert.match(html, /Falta revisión de seguridad/);
  assert.match(html, /Ayuntamiento/);
  assert.match(html, /Trabajo de campo/);
  assert.match(html, /Procedencia del track/);
  assert.match(html, /GPX/);
  assert.match(html, /data-route-source-form/);
  assert.match(html, /name="source_type"/);
  assert.match(html, /data-route-validation-form/);
  for (const name of ['editorial_status','track_status','field_status','media_status','safety_status']) {
    assert.match(html, new RegExp(`name="${name}"`));
  }
  assert.doesNotMatch(html, /aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/);
});

test('route list row opens by slug and never exposes the technical UUID', () => {
  const html = routeListRowHtml({
    ...snapshot.route,
    version: snapshot.content
  });
  assert.match(html, /Sendero Las Viñas/);
  assert.match(html, /MAG-BED-001/);
  assert.match(html, /Bedmar y Garcíez/);
  assert.match(html, /data-route-open="sendero-las-vinas"/);
  assert.match(html, />Abrir ficha</);
  assert.doesNotMatch(html, /aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/);
});
