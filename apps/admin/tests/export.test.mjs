import test from 'node:test';
import assert from 'node:assert/strict';
import { toCsv } from '../src/core/export.mjs';

test('toCsv escapes commas quotes and newlines', () => {
  const csv = toCsv([{ action: 'route.publish', note: 'Hola, "mundo"\nOK' }]);
  assert.equal(csv, 'action,note\r\nroute.publish,"Hola, ""mundo""\nOK"\r\n');
});

test('toCsv serializes nested values as JSON', () => {
  const csv = toCsv([{ before: { status: 'draft' } }]);
  assert.equal(csv, 'before\r\n"{""status"":""draft""}"\r\n');
});
