import { describe, expect, it } from 'vitest';

import type {
  ActivityXpAwardHistory,
  ActivityXpPolicy,
  VerifiedActivityXpInput,
} from './activity-xp';
import type { VerifiedAdventureStatInput } from './adventure-stats';
import type { BadgeDefinition } from './badge-eligibility';
import type {
  ChallengeDefinition,
  SeasonDefinition,
} from './challenge-progress';
import type { LevelDefinition } from './level-progression';
import type {
  RankingParticipantInput,
  RankingScorePolicy,
} from './ranking';
import {
  projectVerifiedProgressionCycle,
  type VerifiedProgressionCycleInput,
} from './progression-cycle';

const currentXpActivity: VerifiedActivityXpInput = {
  activityId: 'activity-current',
  routeId: 'route-bedmar',
  municipalityId: 'bedmar',
  verifiedAt: '2026-09-16T10:00:00.000Z',
  distanceMeters: 5_000,
  ascentMeters: 500,
  newDiscoveryCount: 2,
};

const currentStatActivity: VerifiedAdventureStatInput = {
  activityId: 'activity-current',
  routeId: 'route-bedmar',
  municipalityId: 'bedmar',
  verifiedAt: '2026-09-16T10:00:00.000Z',
  distanceMeters: 5_000,
  ascentMeters: 500,
  discoveriesUnlocked: 2,
  checkpointsReached: 3,
};

const xpPolicy: ActivityXpPolicy = {
  baseVerifiedXp: 100,
  distanceUnitMeters: 1_000,
  xpPerDistanceUnit: 10,
  ascentUnitMeters: 100,
  xpPerAscentUnit: 5,
  xpPerNewDiscovery: 20,
  firstRouteBonusXp: 50,
  firstMunicipalityBonusXp: 30,
  repeatRouteWindowHours: 24,
  maxRewardedSameRouteInWindow: 2,
};

const levels: LevelDefinition[] = [
  { level: 1, name: 'Brote', minXp: 0, rewardOlives: 0, active: true },
  { level: 2, name: 'Sendero', minXp: 200, rewardOlives: 10, active: true },
  { level: 3, name: 'Cumbre', minXp: 500, rewardOlives: 20, active: true },
];

const badges: BadgeDefinition[] = [
  {
    slug: 'primer-5k',
    name: 'Primer 5K',
    description: 'Completa cinco kilómetros verificados.',
    active: true,
    criteria: [{ metric: 'distanceMeters', minimum: 5_000 }],
  },
];

const challenges: ChallengeDefinition[] = [
  {
    id: 'daily-5k',
    title: '5K del día',
    description: 'Recorre cinco kilómetros hoy.',
    scope: 'daily',
    metric: 'distanceMeters',
    target: 5_000,
    startsAt: '2026-09-16T00:00:00.000Z',
    endsAt: '2026-09-17T00:00:00.000Z',
    active: true,
    municipalityId: null,
    seasonId: null,
  },
];

const seasons: SeasonDefinition[] = [
  {
    id: 'autumn-2026',
    name: 'Otoño 2026',
    startsAt: '2026-09-01T00:00:00.000Z',
    endsAt: '2026-12-01T00:00:00.000Z',
    active: true,
  },
];

const peerActivities: RankingParticipantInput[] = [
  {
    userId: 'peer',
    activities: [
      {
        activityId: 'peer-activity',
        routeId: 'route-peer',
        municipalityId: 'jodar',
        verifiedAt: '2026-09-16T09:00:00.000Z',
        distanceMeters: 2_000,
        ascentMeters: 100,
        discoveriesUnlocked: 0,
        checkpointsReached: 1,
      },
    ],
  },
];

const rankingPolicies: Record<'senderista' | 'explorador' | 'magina', RankingScorePolicy> = {
  senderista: {
    kind: 'senderista',
    weights: { distanceMeters: 0.001, ascentMeters: 0.01 },
    maxCountedSameRoute: 2,
  },
  explorador: {
    kind: 'explorador',
    weights: { discoveriesUnlocked: 10, checkpointsReached: 1 },
    maxCountedSameRoute: 2,
  },
  magina: {
    kind: 'magina',
    weights: {
      distanceMeters: 0.0005,
      discoveriesUnlocked: 5,
      distinctRoutes: 5,
      distinctMunicipalities: 5,
    },
    maxCountedSameRoute: 2,
  },
};

function input(
  overrides: Partial<VerifiedProgressionCycleInput> = {},
): VerifiedProgressionCycleInput {
  return {
    userId: 'current-user',
    activityXp: currentXpActivity,
    activityStats: currentStatActivity,
    previousActivities: [],
    xpAwardHistory: [],
    previousTotalXp: 90,
    xpPolicy,
    levels,
    badges,
    unlockedBadgeSlugs: [],
    challenges,
    completedChallengeIds: [],
    seasons,
    rankingParticipants: peerActivities,
    rankingPolicies,
    rankingScopes: ['weekly', 'monthly', 'season', 'all-time'],
    ...overrides,
  };
}

describe('projectVerifiedProgressionCycle', () => {
  it('projects XP, level, badge, challenge and all configured rankings from one verified activity', () => {
    const result = projectVerifiedProgressionCycle(input());

    expect(result.xpAward).toMatchObject({
      eligible: true,
      totalXp: 295,
      sourceKey: 'activity:activity-current:verified-xp',
    });
    expect(result.previousLevelProgress.currentLevel?.level).toBe(1);
    expect(result.nextLevelProgress.totalXp).toBe(385);
    expect(result.nextLevelProgress.currentLevel?.level).toBe(2);
    expect(result.crossedLevels.map((level) => level.level)).toEqual([2]);

    expect(result.aggregateStats).toMatchObject({
      completedActivities: 1,
      distanceMeters: 5_000,
      ascentMeters: 500,
      discoveriesUnlocked: 2,
      checkpointsReached: 3,
      distinctRoutes: 1,
      distinctMunicipalities: 1,
    });

    expect(result.newBadges.map((badge) => badge.slug)).toEqual(['primer-5k']);
    expect(result.completedChallenges.map((challenge) => challenge.challengeId)).toEqual([
      'daily-5k',
    ]);

    expect(result.rankings).toHaveLength(12);
    expect(
      result.rankings.every((ranking) =>
        ranking.entries.some((entry) => entry.userId === 'current-user'),
      ),
    ).toBe(true);

    const weeklySenderista = result.rankings.find(
      (ranking) => ranking.kind === 'senderista' && ranking.scope === 'weekly',
    );
    expect(weeklySenderista?.entries[0]?.userId).toBe('current-user');
  });

  it('is idempotent on retry: no duplicate XP/stats/badge/challenge and ranking score is unchanged', () => {
    const history: ActivityXpAwardHistory[] = [
      {
        activityId: currentXpActivity.activityId,
        routeId: currentXpActivity.routeId,
        municipalityId: currentXpActivity.municipalityId,
        verifiedAt: currentXpActivity.verifiedAt,
      },
    ];

    const result = projectVerifiedProgressionCycle(
      input({
        previousActivities: [currentStatActivity],
        xpAwardHistory: history,
        previousTotalXp: 385,
        unlockedBadgeSlugs: ['primer-5k'],
        completedChallengeIds: ['daily-5k'],
      }),
    );

    expect(result.xpAward).toMatchObject({
      eligible: false,
      rejectionReason: 'duplicate-activity',
      totalXp: 0,
    });
    expect(result.nextLevelProgress.totalXp).toBe(385);
    expect(result.crossedLevels).toEqual([]);
    expect(result.aggregateStats.completedActivities).toBe(1);
    expect(result.aggregateStats.distanceMeters).toBe(5_000);
    expect(result.newBadges).toEqual([]);
    expect(result.challengeProgress).toEqual([]);
    expect(result.completedChallenges).toEqual([]);

    const weeklySenderista = result.rankings.find(
      (ranking) => ranking.kind === 'senderista' && ranking.scope === 'weekly',
    );
    const currentEntry = weeklySenderista?.entries.find(
      (entry) => entry.userId === 'current-user',
    );
    expect(currentEntry?.stats.completedActivities).toBe(1);
    expect(currentEntry?.stats.distanceMeters).toBe(5_000);
    expect(currentEntry?.score).toBe(10);
  });
});
