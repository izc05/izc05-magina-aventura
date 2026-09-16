import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sourceUrl = new URL('../route-admin-tools.mjs', import.meta.url);

async function source() {
  return readFile(sourceUrl, 'utf8');
}

test('route admin integrates the master snapshot and human-facing rows', async () => {
  const text = await source();
  assert.match(text, /routeListRowHtml/);
  assert.match(text, /routeMasterShellHtml/);
  assert.match(text, /admin_route_master_snapshot/);
  assert.match(text, /data-route-open/);
  assert.doesNotMatch(text, /route-technical-id/);
});

test('route master navigation does not put route UUID into visible data attributes', async () => {
  const text = await source();
  assert.match(text, /routeBySlug/);
  assert.doesNotMatch(text, /data-route-open=\\?"\$\{esc\(route\.id\)\}/);
});
