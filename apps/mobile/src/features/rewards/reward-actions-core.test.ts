import { describe, expect, it } from 'vitest';

import { parseRewardActionCommand } from '../../../../../supabase/functions/_shared/reward-actions-core';

const userId = '50000000-0000-4000-8000-000000000001';
const rewardId = '50000000-0000-4000-8000-000000000010';
const pickupLocationId = '50000000-0000-4000-8000-000000000011';

describe('parseRewardActionCommand', () => {
  it('builds a digital purchase using the authenticated user, never a client user id', () => {
    const result = parseRewardActionCommand({
      method: 'POST',
      pathname: '/digital-purchases',
      authenticatedUserId: userId,
      body: {
        rewardId,
        idempotencyKey: 'purchase-mobile-0001',
      },
    });

    expect(result).toEqual({
      ok: true,
      command: {
        kind: 'purchase-digital',
        userId,
        rewardId,
        idempotencyKey: 'purchase-mobile-0001',
      },
    });
  });

  it('builds a physical reservation without trusting a client-selected expiry', () => {
    const result = parseRewardActionCommand({
      method: 'POST',
      pathname: '/physical-reservations',
      authenticatedUserId: userId,
      body: {
        rewardId,
        pickupLocationId,
        idempotencyKey: 'reserve-mobile-0001',
      },
    });

    expect(result).toEqual({
      ok: true,
      command: {
        kind: 'reserve-physical',
        userId,
        rewardId,
        pickupLocationId,
        idempotencyKey: 'reserve-mobile-0001',
      },
    });
  });

  it('rejects user-id spoofing and expiry injection from the client', () => {
    const spoofed = parseRewardActionCommand({
      method: 'POST',
      pathname: '/digital-purchases',
      authenticatedUserId: userId,
      body: {
        userId: '50000000-0000-4000-8000-000000000099',
        rewardId,
        idempotencyKey: 'purchase-mobile-0002',
      },
    });
    const expiryInjected = parseRewardActionCommand({
      method: 'POST',
      pathname: '/physical-reservations',
      authenticatedUserId: userId,
      body: {
        rewardId,
        pickupLocationId,
        expiresAt: '2099-01-01T00:00:00Z',
        idempotencyKey: 'reserve-mobile-0002',
      },
    });

    expect(spoofed).toEqual({
      ok: false,
      status: 400,
      code: 'forbidden-client-field',
    });
    expect(expiryInjected).toEqual({
      ok: false,
      status: 400,
      code: 'forbidden-client-field',
    });
  });

  it('rejects missing auth, malformed uuids, weak idempotency keys and unknown routes', () => {
    expect(
      parseRewardActionCommand({
        method: 'POST',
        pathname: '/digital-purchases',
        authenticatedUserId: '',
        body: { rewardId, idempotencyKey: 'purchase-mobile-0003' },
      }),
    ).toEqual({ ok: false, status: 401, code: 'authentication-required' });

    expect(
      parseRewardActionCommand({
        method: 'POST',
        pathname: '/digital-purchases',
        authenticatedUserId: userId,
        body: { rewardId: 'not-a-uuid', idempotencyKey: 'purchase-mobile-0004' },
      }),
    ).toEqual({ ok: false, status: 400, code: 'invalid-reward-id' });

    expect(
      parseRewardActionCommand({
        method: 'POST',
        pathname: '/digital-purchases',
        authenticatedUserId: userId,
        body: { rewardId, idempotencyKey: 'short' },
      }),
    ).toEqual({ ok: false, status: 400, code: 'invalid-idempotency-key' });

    expect(
      parseRewardActionCommand({
        method: 'GET',
        pathname: '/digital-purchases',
        authenticatedUserId: userId,
        body: {},
      }),
    ).toEqual({ ok: false, status: 405, code: 'method-not-allowed' });

    expect(
      parseRewardActionCommand({
        method: 'POST',
        pathname: '/unknown',
        authenticatedUserId: userId,
        body: {},
      }),
    ).toEqual({ ok: false, status: 404, code: 'route-not-found' });
  });
});
