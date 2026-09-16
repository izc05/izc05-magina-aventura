import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const js = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

test('uses a compact viewport motion branch for the hero', () => {
  assert.match(js, /max-width:\s*900px/);
  assert.match(js, /compactViewport\.matches/);
});
