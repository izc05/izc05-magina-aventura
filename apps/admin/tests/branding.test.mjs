import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.mjs', import.meta.url), 'utf8');

test('loads the official Mágina Aventura brand layer and favicon', () => {
  assert.match(index, /rel="icon" href="\.\/assets\/magina-aventura-icon\.svg"/);
  assert.match(index, /href="\.\/branding\.css"/);
});

test('shows the official full logo on login and admin shell', () => {
  const logoReferences = app.match(/\.\/assets\/magina-aventura-logo\.svg/g) ?? [];
  assert.ok(logoReferences.length >= 2, `expected official full logo on login and sidebar, found ${logoReferences.length}`);
  assert.match(app, /class="admin-brand-logo/);
  assert.doesNotMatch(app, /<p class="brand">Mágina Aventura<small>/);
});
