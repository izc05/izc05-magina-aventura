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
  content: {
    version: 4,
    description: 'Ruta de prueba',
    safety_notes: [],
    distance_km: 7.4,
    elevation_gain_m: 320,
    elevation_loss_m: 320,
    elevation_min_m: 560,
    elevation_max_m: 920,
    duration_minutes: 180,
    difficulty: 'moderate',
    route_kind: 'circular',
    access_notes: '',
    parking_notes: '',
    water_notes: '',
    shade_notes: '',
    coverage_notes: '',
    recommended_seasons: ['spring'],
    editorial_sections: {},
    offline_available: true,
    reward_xp: 450,
    reward_olives: 30
  },
  discoveries: [
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Mirador del olivar',
      category: 'landscape',
      reward_xp: 75,
      reward_olives: 5,
      active: true
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      name: 'Fuente histórica',
      category: 'heritage',
      reward_xp: 35,
      reward_olives: 7,
      active: true
    }
  ],
  media: [],
  safety: [],
  sources: [],
  checkpoints: [],
  readiness: { ready: false, reasons: [] }
};

test('rewards tab explains route and discovery rewards and edits the base reward without technical ids', () => {
  const html = routeMasterShellHtml(snapshot, 'rewards');
  assert.match(html, /data-route-master-panel="rewards"/);
  assert.match(html, /Recompensa de la ruta/);
  assert.match(html, /data-route-rewards-form/);
  assert.match(html, /name="reward_xp"/);
  assert.match(html, /name="reward_olives"/);
  assert.match(html, /value="450"/);
  assert.match(html, /value="30"/);
  assert.match(html, /Mirador del olivar/);
  assert.match(html, /Fuente histórica/);
  assert.match(html, /560 XP/);
  assert.match(html, /42 aceitunas/);
  assert.match(html, /href="#gamification"/);
  assert.match(html, /Guardar recompensa base/);
  assert.doesNotMatch(html, /aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/);
  assert.doesNotMatch(html, /bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/);
  assert.doesNotMatch(html, /cccccccc-cccc-cccc-cccc-cccccccccccc/);
});
