import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const moduleUrl = new URL('../lookup-tools.mjs', import.meta.url);
const indexUrl = new URL('../index.html', import.meta.url);

async function source() {
  return readFile(moduleUrl, 'utf8');
}

test('admin shell loads the human lookup enhancer', async () => {
  const html = await readFile(indexUrl, 'utf8');
  assert.match(html, /<script[^>]+src=["']\.\/lookup-tools\.mjs["']/);
});

test('lookup enhancer replaces route and municipality ids with human selectors while preserving field names', async () => {
  const text = await source();
  assert.match(text, /routeOptions/);
  assert.match(text, /municipalityOptions/);
  assert.match(text, /table\(['"]routes['"]/);
  assert.match(text, /table\(['"]municipalities['"]/);
  assert.match(text, /name=["']route_id["']/);
  assert.match(text, /name=["']municipality_id["']/);
  assert.match(text, /Ruta/);
  assert.match(text, /Municipio/);
  assert.doesNotMatch(text, /Ruta UUID/);
  assert.doesNotMatch(text, /Municipio UUID/);
});

test('lookup enhancer converts notification route and municipality audiences to selectors', async () => {
  const text = await source();
  assert.match(text, /notification-create/);
  assert.match(text, /audience_ref/);
  assert.match(text, /audience\.value\s*===\s*['"]route['"]/);
  assert.match(text, /audience\.value\s*===\s*['"]municipality['"]/);
  assert.match(text, /super_admin/);
  assert.match(text, /route_manager/);
  assert.doesNotMatch(text, /UUID o rol/);
});

test('lookup enhancer covers global safety and community channel route scopes', async () => {
  const text = await source();
  assert.match(text, /route-closure-create/);
  assert.match(text, /chat-channel-create/);
  assert.match(text, /checkpoint-create/);
  assert.match(text, /discovery-create/);
});
