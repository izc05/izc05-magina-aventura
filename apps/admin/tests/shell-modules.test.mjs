import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const REQUIRED_MODULES = [
  './app.mjs',
  './enhancements.mjs',
  './people-community.mjs',
  './visual-tools.mjs',
  './settings-tools.mjs',
  './chat-tools.mjs',
  './dashboard-user-tools.mjs',
  './gamification-tools.mjs',
  './route-content-tools.mjs',
  './media-tools.mjs',
  './notification-tools.mjs',
  './map-asset-tools.mjs',
  './reward-tools.mjs',
  './audit-tools.mjs',
  './safety-tools.mjs'
];

test('admin shell loads every operational module', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  for (const modulePath of REQUIRED_MODULES) {
    assert.match(html, new RegExp(`<script[^>]+src=["']${modulePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`), `missing ${modulePath}`);
  }
});
