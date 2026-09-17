import { describe, expect, it } from 'vitest';

import {
  executeRewardActionCommand,
  type RewardActionExecutionDependencies,
} from '../../../../../supabase/functions/_shared/reward-actions-executor';

const userId = '50000000-0000-4000-8000-000000000001';
const rewardId = '50000000-0000-4000-8000-000000000010';
const pickupLocationId = '50000000-0000-4000-8000-000000000011';

describe('executeRewardActionCommand', () => {
  it('executes a digital purchase through the protected purchase RPC', async () => {
    const calls: Array<{ name: string; params: Record<string, unknown> }> = [];
    const dependencies: RewardActionExecutionDependencies = {
      callRpc: async (name, params) => {
        calls.push({ name, params });
        return { status: 'purchased', available: 3200 };
      },
      resolvePhysicalReservationExpiry: async () => {
        throw new Error('physical expiry should not be resolved for digital rewards');
      },
    };

    const result = await executeRewardActionCommand(
      {
        kind: 'purchase-digital',
        userId,
        rewardId,
        idempotencyKey: 'purchase-mobile-0001',
      },
      dependencies,
    );

    expect(calls).toEqual([
      {
        name: 'purchase_digital_reward',
        params: {
          p_user_id: userId,
          p_reward_id: rewardId,
          p_idempotency_key: 'purchase-mobile-0001',
        },
      },
    ]);
    expect(result).toEqual({ status: 'purchased', available: 3200 });
  });

  it('resolves physical expiry on the server before reserving stock and olives', async () => {
    const calls: Array<{ name: string; params: Record<string, unknown> }> = [];
    const resolvedRewards: string[] = [];
    const expiresAt = '2026-09-18T12:00:00.000Z';
    const dependencies: RewardActionExecutionDependencies = {
      callRpc: async (name, params) => {
        calls.push({ name, params });
        return {
          status: 'reserved',
          reservationId: '50000000-0000-4000-8000-000000000020',
        };
      },
      resolvePhysicalReservationExpiry: async (inputRewardId) => {
        resolvedRewards.push(inputRewardId);
        return expiresAt;
      },
    };

    const result = await executeRewardActionCommand(
      {
        kind: 'reserve-physical',
        userId,
        rewardId,
        pickupLocationId,
        idempotencyKey: 'reserve-mobile-0001',
      },
      dependencies,
    );

    expect(resolvedRewards).toEqual([rewardId]);
    expect(calls).toEqual([
      {
        name: 'reserve_physical_reward',
        params: {
          p_user_id: userId,
          p_reward_id: rewardId,
          p_pickup_location_id: pickupLocationId,
          p_expires_at: expiresAt,
          p_idempotency_key: 'reserve-mobile-0001',
        },
      },
    ]);
    expect(result).toEqual({
      status: 'reserved',
      reservationId: '50000000-0000-4000-8000-000000000020',
    });
  });

  it('rejects an invalid server expiry before calling the reservation RPC', async () => {
    const calls: string[] = [];
    const dependencies: RewardActionExecutionDependencies = {
      callRpc: async (name) => {
        calls.push(name);
        return {};
      },
      resolvePhysicalReservationExpiry: async () => 'not-a-timestamp',
    };

    await expect(
      executeRewardActionCommand(
        {
          kind: 'reserve-physical',
          userId,
          rewardId,
          pickupLocationId,
          idempotencyKey: 'reserve-mobile-0002',
        },
        dependencies,
      ),
    ).rejects.toThrow('invalid physical reservation expiry');
    expect(calls).toEqual([]);
  });
});
