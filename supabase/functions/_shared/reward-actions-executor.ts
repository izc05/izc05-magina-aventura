import type { RewardActionCommand } from './reward-actions-core';

export type RewardActionRpcName =
  | 'purchase_digital_reward'
  | 'reserve_physical_reward';

export type RewardActionRpcParams = Record<string, unknown>;

export interface RewardActionExecutionDependencies {
  callRpc: (
    name: RewardActionRpcName,
    params: RewardActionRpcParams,
  ) => Promise<unknown>;
  resolvePhysicalReservationExpiry: (rewardId: string) => Promise<string>;
}

function assertValidTimestamp(value: string): void {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new Error('invalid physical reservation expiry');
  }
}

export async function executeRewardActionCommand(
  command: RewardActionCommand,
  dependencies: RewardActionExecutionDependencies,
): Promise<unknown> {
  if (command.kind === 'purchase-digital') {
    return dependencies.callRpc('purchase_digital_reward', {
      p_user_id: command.userId,
      p_reward_id: command.rewardId,
      p_idempotency_key: command.idempotencyKey,
    });
  }

  const expiresAt = await dependencies.resolvePhysicalReservationExpiry(
    command.rewardId,
  );
  assertValidTimestamp(expiresAt);

  return dependencies.callRpc('reserve_physical_reward', {
    p_user_id: command.userId,
    p_reward_id: command.rewardId,
    p_pickup_location_id: command.pickupLocationId,
    p_expires_at: expiresAt,
    p_idempotency_key: command.idempotencyKey,
  });
}
