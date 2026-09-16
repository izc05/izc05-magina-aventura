import test from 'node:test';
import assert from 'node:assert/strict';
import { routeMasterShellHtml } from '../src/core/route-master-view.mjs';

const snapshot = {
  route: {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    route_code: 'MAG-BED-001',
    slug: 'sendero-las-vinas',
    title: 'Sendero Las Viñas',
    municipality: 'Bedmar y Garcíez',
    status: 'review'
  },
  content: { reward_xp: 450, reward_olives: 30 },
  checkpoints: [],
  discoveries: [
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Adelfal de Cuadros',
      category: 'flora',
      trigger_radius_m: 35,
      reward_xp: 60,
      reward_olives: 12,
      active: true
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      name: 'Torreón de Cuadros',
      category: 'heritage',
      trigger_radius_m: 30,
      reward_xp: 80,
      reward_olives: 15,
      active: false
    }
  ],
  sources: [],
  media: [],
  safety: [],
  access_points: [],
  readiness: { ready: false, reasons: [] }
};

test('discoveries tab renders editable human-facing cards without UUIDs', () => {
  const html = routeMasterShellHtml(snapshot, 'discoveries');
  assert.match(html, /data-route-master-panel="discoveries"/);
  assert.match(html, /data-route-discovery-form/);
  assert.match(html, /data-discovery-index="0"/);
  assert.match(html, /data-discovery-index="1"/);
  assert.match(html, /Adelfal de Cuadros/);
  assert.match(html, /Torreón de Cuadros/);
  assert.match(html, /Añade y mueve puntos desde Track \/ Mapa/);
  for (const name of ['name','category','trigger_radius_m','reward_xp','reward_olives','active']) {
    assert.match(html, new RegExp(`name="${name}"`));
  }
  for (const category of ['flora','fauna','heritage','olive','tradition','landscape']) {
    assert.match(html, new RegExp(`<option value="${category}"`));
  }
  assert.doesNotMatch(html, /aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/);
  assert.doesNotMatch(html, /bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/);
  assert.doesNotMatch(html, /cccccccc-cccc-cccc-cccc-cccccccccccc/);
});
