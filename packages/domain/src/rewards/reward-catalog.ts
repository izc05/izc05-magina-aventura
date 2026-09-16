import type { OliveTreeStageId } from '../olive-tree/olive-tree-progression';

export type RewardKind = 'digital' | 'coupon' | 'experience' | 'physical';
export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface RewardCatalogItem {
  id: string;
  name: string;
  kind: RewardKind;
  rarity: RewardRarity;
  priceOlives: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  minLevel: number | null;
  minStage: OliveTreeStageId | null;
  requiredBadgeSlugs: string[];
  requiredChallengeIds: string[];
  stockAvailable: number | null;
  perUserLimit: number | null;
  repeatable: boolean;
}

export interface RewardEligibilityInput {
  item: RewardCatalogItem;
  now: string;
  walletAvailable: number;
  level: number;
  stage: OliveTreeStageId | null;
  badgeSlugs: string[];
  completedChallengeIds: string[];
  previousRedemptions: number;
}

export interface RewardEligibilityDecision {
  eligible: boolean;
  reasons: string[];
}

const STAGE_ORDER: OliveTreeStageId[] = [
  'sprout',
  'sapling',
  'young',
  'developing',
  'strong',
  'adult',
  'mature',
  'centenary',
  'monumental',
  'legend',
];

function nonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function timestamp(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function stageMeets(
  current: OliveTreeStageId | null,
  minimum: OliveTreeStageId,
): boolean {
  if (current === null) {
    return false;
  }

  return STAGE_ORDER.indexOf(current) >= STAGE_ORDER.indexOf(minimum);
}

export function evaluateRewardEligibility(
  input: RewardEligibilityInput,
): RewardEligibilityDecision {
  const reasons: string[] = [];
  const now = Date.parse(input.now);
  const startsAt = timestamp(input.item.startsAt);
  const endsAt = timestamp(input.item.endsAt);
  const price = nonNegativeInteger(input.item.priceOlives);
  const available = nonNegativeInteger(input.walletAvailable);
  const level = nonNegativeInteger(input.level);
  const previousRedemptions = nonNegativeInteger(input.previousRedemptions);

  if (!input.item.active) {
    reasons.push('inactive');
  }

  if (
    input.item.startsAt !== null &&
    (startsAt === null || !Number.isFinite(now) || now < startsAt)
  ) {
    reasons.push('not-started');
  }

  if (
    input.item.endsAt !== null &&
    (endsAt === null || !Number.isFinite(now) || now > endsAt)
  ) {
    reasons.push('expired');
  }

  if (available < price) {
    reasons.push('insufficient-olives');
  }

  if (
    input.item.minLevel !== null &&
    level < nonNegativeInteger(input.item.minLevel)
  ) {
    reasons.push('level-required');
  }

  if (
    input.item.minStage !== null &&
    !stageMeets(input.stage, input.item.minStage)
  ) {
    reasons.push('stage-required');
  }

  const badges = new Set(input.badgeSlugs);
  if (input.item.requiredBadgeSlugs.some((slug) => !badges.has(slug))) {
    reasons.push('badge-required');
  }

  const challenges = new Set(input.completedChallengeIds);
  if (
    input.item.requiredChallengeIds.some(
      (challengeId) => !challenges.has(challengeId),
    )
  ) {
    reasons.push('challenge-required');
  }

  if (
    input.item.stockAvailable !== null &&
    nonNegativeInteger(input.item.stockAvailable) <= 0
  ) {
    reasons.push('out-of-stock');
  }

  const explicitLimit =
    input.item.perUserLimit === null
      ? null
      : nonNegativeInteger(input.item.perUserLimit);
  const limitReached =
    (!input.item.repeatable && previousRedemptions >= 1) ||
    (explicitLimit !== null && previousRedemptions >= explicitLimit);

  if (limitReached) {
    reasons.push('user-limit-reached');
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}
