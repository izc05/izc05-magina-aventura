import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const js = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

test('uses a compact viewport motion branch for the hero', () => {
  assert.match(js, /max-width:\s*900px/);
  assert.match(js, /compactViewport\.matches/);
});

test('drives cinematic parallax through CSS custom properties', () => {
  assert.match(js, /--scroll-shift-y/);
  assert.match(js, /--scroll-scale/);
});

test('preserves reduced-motion support while rendering the scene sequence', () => {
  assert.match(js, /prefers-reduced-motion:\s*reduce/);
  assert.match(js, /reduceMotion/);
});

test('serves smaller cinematic photography to compact viewports', () => {
  const mobileSources = html.match(/--scene-image-mobile:/g) ?? [];
  assert.equal(mobileSources.length, 9, `expected 9 mobile scene sources, found ${mobileSources.length}`);
  assert.match(css, /var\(--scene-image-mobile/);
  assert.match(js, /compactViewport\.matches\s*\?\s*'--scene-image-mobile'/);
});
