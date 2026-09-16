import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sourceUrl = new URL('../route-admin-tools.mjs', import.meta.url);

test('route master reward form versions the latest route content and refreshes human rewards', async () => {
  const text = await readFile(sourceUrl, 'utf8');
  assert.match(text, /data-route-rewards-slug/);
  assert.match(text, /dataset\.routeRewardsSlug/);
  assert.match(text, /table\(['"]routes['"]/);
  assert.match(text, /slug=eq\.\$\{encodeURIComponent\(slug\)\}/);
  assert.match(text, /\[data-route-rewards-form\]/);
  assert.match(text, /admin_route_master_snapshot/);
  assert.match(text, /rewardContentPayload/);
  assert.match(text, /content_payload/);
  assert.match(text, /reward_xp:/);
  assert.match(text, /reward_olives:/);
  assert.match(text, /admin_update_route_content_v2/);
  assert.match(text, /target_route_id:\s*route\.id/);
  assert.match(text, /data-route-reward-total/);
  assert.doesNotMatch(text, /name=["']route_id["']/);
});
