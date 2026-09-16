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
  discoveries: [],
  media: [
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      title: 'Panorámica de Las Viñas',
      object_key: 'routes/bedmar/las-vinas/hero.webp',
      mime_type: 'image/webp',
      alt_text: 'Vista panorámica de Sierra Mágina desde el sendero',
      archived: false,
      kind: 'hero',
      sort_order: 0
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      title: 'Paso de piedra',
      object_key: 'routes/bedmar/las-vinas/paso.webp',
      mime_type: 'image/webp',
      alt_text: null,
      archived: true,
      kind: 'safety',
      sort_order: 20
    }
  ],
  safety: [],
  sources: [],
  access_points: [],
  readiness: { ready: false, reasons: [] }
};

test('media tab renders only selected-route media as human-facing editable cards', () => {
  const html = routeMasterShellHtml(snapshot, 'media');
  assert.match(html, /data-route-master-panel="media"/);
  assert.match(html, /data-route-media-form/);
  assert.match(html, /data-media-index="0"/);
  assert.match(html, /Panorámica de Las Viñas/);
  assert.match(html, /Paso de piedra/);
  assert.match(html, /Vista panorámica de Sierra Mágina desde el sendero/);
  assert.match(html, /name="title"/);
  assert.match(html, /name="alt_text"/);
  assert.match(html, /name="kind"/);
  assert.match(html, /name="sort_order"/);
  assert.match(html, /name="archived"/);
  for (const kind of ['hero', 'gallery', 'safety', 'discovery']) {
    assert.match(html, new RegExp(`<option value="${kind}"`));
  }
  assert.doesNotMatch(html, /Media UUID/);
  assert.doesNotMatch(html, /bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/);
  assert.doesNotMatch(html, /cccccccc-cccc-cccc-cccc-cccccccccccc/);
  assert.doesNotMatch(html, /routes\/bedmar\/las-vinas\/hero\.webp/);
});
