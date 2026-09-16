import { describe, expect, it } from 'vitest';

import type { LevelDefinition } from '../gamification/level-progression';
import type { ChallengeProgressProjection } from '../gamification/challenge-progress';
import {
  projectProgressionOliveGrants,
  type OliveGrantRounding,
} from './olive-grants';

function level(
  value: number,
  rewardOlives: number,
  name = `Nivel ${value}`,
): LevelDefinition {
  return {
    level: value,
    name,
    minXp: value * 100,
    rewardOlives,
    active: true,
  };
}

function completedChallenge(
  challengeId: string,
  title = challengeId,
): ChallengeProgressProjection {
  return {
    challengeId,
    title,
    description: `${challengeId} description`,
    scope: 'weekly',
    metric: 'distanceMeters',
    current: 10_000,
    target: 10_000,
    percentage: 100,
    completed: true,
    sourceKey: `challenge:${challengeId}:completion`,
  };
}

function projection(
  crossedLevels: LevelDefinition[],
  completedChallenges: ChallengeProgressProjection[],
) {
  return { crossedLevels, completedChallenges };
}

describe('projectProgressionOliveGrants', () => {
  it('projects level and challenge olive grants with ledger-compatible source identity', () => {
    const result = projectProgressionOliveGrants({
      userId: 'user-1',
      projection: projection(
        [level(2, 5, 'Brote fuerte')],
        [completedChallenge('week-10k', '10 km semanales')],
      ),
      challengeRewards: [{ challengeId: 'week-10k', rewardOlives: 7 }],
      multiplier: 1,
      rounding: 'floor',
      alreadyGrantedSourceKeys: [],
    });

    expect(result).toEqual([
      {
        userId: 'user-1',
        amount: 7,
        reason: 'Reto completado: 10 km semanales',
        sourceType: 'challenge',
        sourceId: 'week-10k',
        sourceKey: 'olive:challenge:week-10k',
      },
      {
        userId: 'user-1',
        amount: 5,
        reason: 'Nivel alcanzado: Brote fuerte',
        sourceType: 'level',
        sourceId: '2',
        sourceKey: 'olive:level:2',
      },
    ]);
  });

  it.each<[OliveGrantRounding, number]>([
    ['floor', 3],
    ['nearest', 4],
    ['ceil', 4],
  ])('applies configured multiplier with %s rounding', (rounding, amount) => {
    const [grant] = projectProgressionOliveGrants({
      userId: 'user-1',
      projection: projection([level(2, 3)], []),
      challengeRewards: [],
      multiplier: 1.25,
      rounding,
      alreadyGrantedSourceKeys: [],
    });

    expect(grant?.amount).toBe(amount);
  });

  it('does not re-emit grants whose stable source key is already in the ledger', () => {
    const result = projectProgressionOliveGrants({
      userId: 'user-1',
      projection: projection(
        [level(2, 5)],
        [completedChallenge('week-10k')],
      ),
      challengeRewards: [{ challengeId: 'week-10k', rewardOlives: 7 }],
      multiplier: 1,
      rounding: 'floor',
      alreadyGrantedSourceKeys: [
        'olive:level:2',
        'olive:challenge:week-10k',
      ],
    });

    expect(result).toEqual([]);
  });

  it('suppresses duplicate projected sources and ignores non-positive or invalid rewards', () => {
    const result = projectProgressionOliveGrants({
      userId: 'user-1',
      projection: projection(
        [level(3, 4), level(3, 4), level(4, -8), level(5, Number.NaN)],
        [
          completedChallenge('eligible'),
          completedChallenge('eligible'),
          completedChallenge('zero'),
          completedChallenge('unknown'),
        ],
      ),
      challengeRewards: [
        { challengeId: 'eligible', rewardOlives: 6 },
        { challengeId: 'zero', rewardOlives: 0 },
      ],
      multiplier: 1,
      rounding: 'floor',
      alreadyGrantedSourceKeys: [],
    });

    expect(result.map((grant) => grant.sourceKey)).toEqual([
      'olive:challenge:eligible',
      'olive:level:3',
    ]);
  });

  it('emits no grants when multiplier is non-positive or non-finite', () => {
    for (const multiplier of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(
        projectProgressionOliveGrants({
          userId: 'user-1',
          projection: projection([level(2, 5)], []),
          challengeRewards: [],
          multiplier,
          rounding: 'floor',
          alreadyGrantedSourceKeys: [],
        }),
      ).toEqual([]);
    }
  });
});
