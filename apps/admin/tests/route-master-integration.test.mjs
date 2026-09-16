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

test('route master wires source and validation forms to protected RPCs and refreshes the snapshot', async () => {
  const text = await source();
  assert.match(text, /\[data-route-source-form\]/);
  assert.match(text, /\[data-route-validation-form\]/);
  assert.match(text, /admin_add_route_source/);
  assert.match(text, /admin_update_route_validation/);
  assert.match(text, /source_label/);
  assert.match(text, /source_official/);
  assert.match(text, /validation_notes/);
  assert.match(text, /admin_route_master_snapshot/);
  assert.match(text, /renderRouteMaster/);
});
