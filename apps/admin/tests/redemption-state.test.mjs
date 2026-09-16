import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionRedemption } from '../src/core/redemptions.mjs';

test('reserved redemption can be redeemed, expired or cancelled', () => {
  assert.equal(canTransitionRedemption('reserved', 'redeemed'), true);
  assert.equal(canTransitionRedemption('reserved', 'expired'), true);
  assert.equal(canTransitionRedemption('reserved', 'cancelled'), true);
});

test('terminal redemption states cannot be reused', () => {
  for (const state of ['redeemed', 'expired', 'cancelled']) {
    assert.equal(canTransitionRedemption(state, 'redeemed'), false);
    assert.equal(canTransitionRedemption(state, 'reserved'), false);
  }
});
