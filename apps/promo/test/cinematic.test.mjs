import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp, sceneState, layerTransform } from '../cinematic.js';

test('clamp keeps cinematic progress inside its bounds', () => {
  assert.equal(clamp(-1), 0);
  assert.equal(clamp(0.45), 0.45);
  assert.equal(clamp(2), 1);
});

test('sceneState activates one of six scenes and bounds local progress', () => {
  const state = sceneState(0.44, 2, 6);
  assert.ok(state.local >= 0 && state.local <= 1);
  assert.ok(state.visibility >= 0 && state.visibility <= 1);
  assert.equal(typeof state.active, 'boolean');
});

test('the cinematic journey starts and ends at full scene visibility', () => {
  assert.equal(sceneState(0, 0, 6).visibility, 1);
  assert.equal(sceneState(1, 5, 6).visibility, 1);
});

test('compact layer travel is smaller than desktop travel', () => {
  const desktop = layerTransform(0.9, 0.5, false);
  const compact = layerTransform(0.9, 0.5, true);
  assert.ok(Math.abs(compact.translateY) <= Math.abs(desktop.translateY) * 0.6 + 0.01);
  assert.ok(compact.scale <= desktop.scale);
});
