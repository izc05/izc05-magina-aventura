import type { RewardActionHttpDependencies } from './reward-actions-http';
import {
  executeRewardActionCommand,
  type RewardActionRpcName,
  type RewardActionRpcParams,
} from './reward-actions-executor';
import { resolveRewardReservationExpiry } from './reward-reservation-expiry';

export interface RewardPhysicalReservationPolicy {
  rewardMetadata: unknown;
  partnerMetadata: unknown;
}

export interface RewardActionBackend {
  authenticateAccessToken: (token: string) => Promise<string | null>;
  loadPhysicalReservationPolicy: (
    rewardId: string,
  ) => Promise<RewardPhysicalReservationPolicy>;
  callRpc: (
    name: RewardActionRpcName,
    params: RewardActionRpcParams,
  ) => Promise<unknown>;
}

export interface RewardActionRuntimeConfig {
  platformDefaultTtlMinutes: number;
  now: () => string;
}

export function createRewardActionRuntimeDependencies(
  backend: RewardActionBackend,
  config: RewardActionRuntimeConfig,
): RewardActionHttpDependencies {
  return {
    authenticateAccessToken: backend.authenticateAccessToken,
    executeCommand: (command) =>
      executeRewardActionCommand(command, {
        callRpc: backend.callRpc,
        resolvePhysicalReservationExpiry: async (rewardId) => {
          const policy = await backend.loadPhysicalReservationPolicy(rewardId);
          return resolveRewardReservationExpiry({
            now: config.now(),
            rewardMetadata: policy.rewardMetadata,
            partnerMetadata: policy.partnerMetadata,
            platformDefaultTtlMinutes: config.platformDefaultTtlMinutes,
          });
        },
      }),
  };
}
