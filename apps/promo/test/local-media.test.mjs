import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('serves all nine cinematic frames from unique local WebP scene assets', () => {
  const frames = [...html.matchAll(/data-scene-frame="([1-9])"[^>]*style="[^"]*--scene-image:url\('assets\/scenes\/scene-(0[1-9])\.webp'\)/g)];
  assert.equal(frames.length, 9, `expected 9 locally served cinematic frames, found ${frames.length}`);
  const sceneAssets = new Set(frames.map((match) => match[2]));
  assert.equal(sceneAssets.size, 9, `expected 9 unique local scene assets, found ${sceneAssets.size}`);
});

test('keeps remote Commons URLs out of runtime scene-image declarations', () => {
  assert.doesNotMatch(html, /--scene-image(?:-mobile)?:url\('https:\/\/commons\.wikimedia\.org/);
  assert.doesNotMatch(html, /rel="preconnect" href="https:\/\/commons\.wikimedia\.org"/);
  assert.doesNotMatch(html, /rel="preconnect" href="https:\/\/upload\.wikimedia\.org"/);
});
