import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRedemptionToken } from '../src/core/qr.mjs';

test('normalizeRedemptionToken accepts a raw opaque token', () => {
  assert.equal(normalizeRedemptionToken('  AbC-123_xYz  '), 'AbC-123_xYz');
});

test('normalizeRedemptionToken extracts token from an https redemption URL', () => {
  assert.equal(
    normalizeRedemptionToken('https://maginaaventura.example/redeem?token=opaque-123'),
    'opaque-123'
  );
});

test('normalizeRedemptionToken extracts token from custom app scheme', () => {
  assert.equal(
    normalizeRedemptionToken('maginaaventura://redeem?token=opaque-456'),
    'opaque-456'
  );
});

test('normalizeRedemptionToken rejects empty or malformed QR values', () => {
  assert.throws(() => normalizeRedemptionToken(''), /vacío/i);
  assert.throws(() => normalizeRedemptionToken('https://example.com/redeem'), /token/i);
});
