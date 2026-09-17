import type { VerifiedProgressionCycleProjection } from '../gamification/progression-cycle';

export type OliveGrantRounding = 'floor' | 'nearest' | 'ceil';

export interface ChallengeOliveReward {
  challengeId: string;
  rewardOlives: number;
}

export interface OliveGrantCandidate {
  userId: string;
  amount: number;
  reason: string;
  sourceType: 'level' | 'challenge';
  sourceId: string;
  sourceKey: string;
}

export interface ProgressionOliveGrantInput {
  userId: string;
  projection: Pick<
    VerifiedProgressionCycleProjection,
    'crossedLevels' | 'completedChallenges'
  >;
  challengeRewards: ChallengeOliveReward[];
  multiplier: number;
  rounding: OliveGrantRounding;
  alreadyGrantedSourceKeys: string[];
}

function normalizedReward(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function validMultiplier(value: number): number | null {
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

function roundedAmount(
  baseAmount: number,
  multiplier: number,
  rounding: OliveGrantRounding,
): number {
  const multiplied = baseAmount * multiplier;

  if (!Number.isFinite(multiplied) || multiplied <= 0) {
    return 0;
  }

  switch (rounding) {
    case 'ceil':
      return Math.ceil(multiplied);
    case 'nearest':
      return Math.round(multiplied);
    case 'floor':
      return Math.floor(multiplied);
  }
}

export function projectProgressionOliveGrants(
  input: ProgressionOliveGrantInput,
): OliveGrantCandidate[] {
  const multiplier = validMultiplier(input.multiplier);
  if (multiplier === null) {
    return [];
  }

  const alreadyGranted = new Set(input.alreadyGrantedSourceKeys);
  const emitted = new Set<string>();
  const grants: OliveGrantCandidate[] = [];

  const challengeRewards = new Map<string, number>();
  for (const reward of input.challengeRewards) {
    if (!challengeRewards.has(reward.challengeId)) {
      challengeRewards.set(
        reward.challengeId,
        normalizedReward(reward.rewardOlives),
      );
    }
  }

  const pushGrant = (
    sourceType: OliveGrantCandidate['sourceType'],
    sourceId: string,
    reason: string,
    baseAmount: number,
  ) => {
    const sourceKey = `olive:${sourceType}:${sourceId}`;
    if (alreadyGranted.has(sourceKey) || emitted.has(sourceKey)) {
      return;
    }

    const amount = roundedAmount(
      normalizedReward(baseAmount),
      multiplier,
      input.rounding,
    );
    if (amount <= 0) {
      return;
    }

    emitted.add(sourceKey);
    grants.push({
      userId: input.userId,
      amount,
      reason,
      sourceType,
      sourceId,
      sourceKey,
    });
  };

  for (const level of input.projection.crossedLevels) {
    pushGrant(
      'level',
      String(level.level),
      `Nivel alcanzado: ${level.name}`,
      level.rewardOlives,
    );
  }

  for (const challenge of input.projection.completedChallenges) {
    const rewardOlives = challengeRewards.get(challenge.challengeId);
    if (rewardOlives === undefined) {
      continue;
    }

    pushGrant(
      'challenge',
      challenge.challengeId,
      `Reto completado: ${challenge.title}`,
      rewardOlives,
    );
  }

  return grants.sort((left, right) => left.sourceKey.localeCompare(right.sourceKey));
}
