import { describe, expect, it } from 'vitest';

import { handleRewardActionHttpRequest } from '../../../../../supabase/functions/_shared/reward-actions-http';
import {
  createRewardActionRuntimeDependencies,
  type RewardActionBackend,
} from '../../../../../supabase/functions/_shared/reward-actions-runtime';

const userId = '50000000-0000-4000-8000-000000000001';
const rewardId = '50000000-0000-4000-8000-000000000010';
const pickupLocationId = '50000000-0000-4000-8000-000000000011';

describe('createRewardActionRuntimeDependencies', () => {
  it('composes an authenticated physical reservation with server-side expiry policy', async () => {
    const policyReads: string[] = [];
    const rpcCalls: Array<{ name: string; params: Record<string, unknown> }> = [];
    const backend: RewardActionBackend = {
      authenticateAccessToken: async () => userId,
      loadPhysicalReservationPolicy: async (inputRewardId) => {
        policyReads.push(inputRewardId);
        return {
          rewardMetadata: { reservationTtlMinutes: 90 },
          partnerMetadata: { reservationTtlMinutes: 240 },
        };
      },
      callRpc: async (name, params) => {
        rpcCalls.push({ name, params });
        return { status: 'reserved' };
      },
    };

    const result = await handleRewardActionHttpRequest(
      {
        method: 'POST',
        pathname: '/functions/v1/rewards-actions/physical-reservations',
        authorization: 'Bearer access-token',
        body: {
          rewardId,
          pickupLocationId,
          idempotencyKey: 'reserve-mobile-0010',
        },
      },
      createRewardActionRuntimeDependencies(backend, {
        platformDefaultTtlMinutes: 1440,
        now: () => '2026-09-17T00:00:00.000Z',
      }),
    );

    expect(policyReads).toEqual([rewardId]);
    expect(rpcCalls).toEqual([
      {
        name: 'reserve_physical_reward',
        params: {
          p_user_id: userId,
          p_reward_id: rewardId,
          p_pickup_location_id: pickupLocationId,
          p_expires_at: '2026-09-17T01:30:00.000Z',
          p_idempotency_key: 'reserve-mobile-0010',
        },
      },
    ]);
    expect(result).toEqual({ status: 200, body: { status: 'reserved' } });
  });

  it('does not read physical reservation policy for digital purchases', async () => {
    const policyReads: string[] = [];
    const backend: RewardActionBackend = {
      authenticateAccessToken: async () => userId,
      loadPhysicalReservationPolicy: async (inputRewardId) => {
        policyReads.push(inputRewardId);
        return { rewardMetadata: {}, partnerMetadata: {} };
      },
      callRpc: async () => ({ status: 'purchased' }),
    };

    const result = await handleRewardActionHttpRequest(
      {
        method: 'POST',
        pathname: '/functions/v1/rewards-actions/digital-purchases',
        authorization: 'Bearer access-token',
        body: {
          rewardId,
          idempotencyKey: 'purchase-mobile-0010',
        },
      },
      createRewardActionRuntimeDependencies(backend, {
        platformDefaultTtlMinutes: 1440,
        now: () => '2026-09-17T00:00:00.000Z',
      }),
    );

    expect(policyReads).toEqual([]);
    expect(result).toEqual({ status: 200, body: { status: 'purchased' } });
  });
});
