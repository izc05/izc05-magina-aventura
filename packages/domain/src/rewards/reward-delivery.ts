import {
  buildOliveGrantOutboxEvents,
  type OliveGrantOutboxEvent,
} from '../integration/olive-outbox';
import type { VerifiedProgressionCycleProjection } from '../gamification/progression-cycle';
import {
  projectProgressionOliveGrants,
  type ChallengeOliveReward,
  type OliveGrantCandidate,
  type OliveGrantRounding,
} from './olive-grants';
import {
  evaluateRewardValidation,
  type RewardValidationDecision,
  type RewardValidationInput,
} from './reward-validation';

export interface RewardDeliveryPlanInput {
  validation: RewardValidationInput;
  progression: Pick<
    VerifiedProgressionCycleProjection,
    'crossedLevels' | 'completedChallenges'
  >;
  challengeRewards: ChallengeOliveReward[];
  multiplier: number;
  rounding: OliveGrantRounding;
  alreadyGrantedSourceKeys: string[];
  occurredAt: string;
  alreadyPublishedEventKeys: string[];
}

export interface RewardDeliveryPlan {
  validation: RewardValidationDecision;
  shouldPersist: boolean;
  ledgerEntries: OliveGrantCandidate[];
  outboxEvents: OliveGrantOutboxEvent[];
}

export function buildRewardDeliveryPlan(
  input: RewardDeliveryPlanInput,
): RewardDeliveryPlan {
  const validation = evaluateRewardValidation(input.validation);

  if (!validation.approved) {
    return {
      validation,
      shouldPersist: false,
      ledgerEntries: [],
      outboxEvents: [],
    };
  }

  const ledgerEntries = projectProgressionOliveGrants({
    userId: input.validation.userId,
    projection: input.progression,
    challengeRewards: input.challengeRewards,
    multiplier: input.multiplier,
    rounding: input.rounding,
    alreadyGrantedSourceKeys: input.alreadyGrantedSourceKeys,
  });

  const outboxEvents = buildOliveGrantOutboxEvents({
    grants: ledgerEntries,
    occurredAt: input.occurredAt,
    alreadyPublishedEventKeys: input.alreadyPublishedEventKeys,
  });

  return {
    validation,
    shouldPersist: ledgerEntries.length > 0,
    ledgerEntries,
    outboxEvents,
  };
}
