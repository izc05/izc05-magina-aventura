import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appJs = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('drives the six cinematic scenes through deterministic motion helpers', () => {
  assert.match(appJs, /sceneState\(/);
  assert.match(appJs, /layerTransform\(/);
  assert.match(appJs, /\[data-cinematic-scene\]/);
  assert.match(appJs, /\[data-scene-layer\]/);
});

test('keeps the compact viewport branch for lighter mobile motion', () => {
  assert.match(appJs, /max-width:\s*900px/);
  assert.match(appJs, /compactViewport\.matches/);
});

test('preserves reduced-motion support for the layered sequence', () => {
  assert.match(appJs, /prefers-reduced-motion:\s*reduce/);
  assert.match(appJs, /reduceMotion/);
  assert.match(appJs, /removeProperty\('--layer-x'\)/);
});

test('loads the cinematic renderer as a browser module', () => {
  assert.match(html, /<script\s+type="module"\s+src="app\.js"><\/script>/);
  assert.match(appJs, /from '\.\/cinematic\.js'/);
});
