import { describe, expect, it } from 'vitest';

import type { VerifiedAdventureStatInput } from './adventure-stats';
import type { SeasonDefinition } from './challenge-progress';
import {
  buildRanking,
  resolveRankingWindow,
  type RankingParticipantInput,
  type RankingScorePolicy,
} from './ranking';

const seasons: SeasonDefinition[] = [
  {
    id: 'autumn-2026',
    name: 'Otoño 2026',
    startsAt: '2026-09-01T00:00:00.000Z',
    endsAt: '2026-12-01T00:00:00.000Z',
    active: true,
  },
];

function activity(
  activityId: string,
  routeId: string,
  verifiedAt: string,
  overrides: Partial<VerifiedAdventureStatInput> = {},
): VerifiedAdventureStatInput {
  return {
    activityId,
    routeId,
    municipalityId: 'bedmar',
    verifiedAt,
    distanceMeters: 5_000,
    ascentMeters: 100,
    discoveriesUnlocked: 1,
    checkpointsReached: 2,
    ...overrides,
  };
}

const participants: RankingParticipantInput[] = [
  {
    userId: 'alice',
    activities: [
      activity('alice-old', 'route-old', '2026-09-05T08:00:00.000Z', {
        municipalityId: 'jodar',
        distanceMeters: 4_000,
        ascentMeters: 100,
        discoveriesUnlocked: 5,
      }),
      activity('alice-week', 'route-a', '2026-09-15T08:00:00.000Z', {
        distanceMeters: 10_000,
        ascentMeters: 500,
        discoveriesUnlocked: 1,
        checkpointsReached: 3,
      }),
      activity('alice-future', 'route-future', '2026-09-18T08:00:00.000Z', {
        distanceMeters: 100_000,
      }),
    ],
  },
  {
    userId: 'bob',
    activities: [
      activity('bob-week', 'route-b', '2026-09-16T08:00:00.000Z', {
        distanceMeters: 6_000,
        ascentMeters: 100,
        discoveriesUnlocked: 8,
        checkpointsReached: 8,
      }),
    ],
  },
  { userId: 'inactive', activities: [] },
];

const senderista: RankingScorePolicy = {
  kind: 'senderista',
  weights: {
    distanceMeters: 0.001,
    ascentMeters: 0.1,
  },
  maxCountedSameRoute: null,
};

const explorador: RankingScorePolicy = {
  kind: 'explorador',
  weights: {
    discoveriesUnlocked: 10,
    checkpointsReached: 1,
    distinctMunicipalities: 20,
  },
  maxCountedSameRoute: null,
};

const magina: RankingScorePolicy = {
  kind: 'magina',
  weights: {
    distanceMeters: 0.0005,
    discoveriesUnlocked: 5,
    distinctRoutes: 10,
    distinctMunicipalities: 20,
  },
  maxCountedSameRoute: null,
};

describe('resolveRankingWindow', () => {
  it('resolves ISO weekly and UTC monthly windows', () => {
    expect(resolveRankingWindow('weekly', '2026-09-16T10:00:00.000Z', seasons)).toEqual({
      scope: 'weekly',
      startsAt: '2026-09-14T00:00:00.000Z',
      endsAt: '2026-09-21T00:00:00.000Z',
      seasonId: null,
    });

    expect(resolveRankingWindow('monthly', '2026-09-16T10:00:00.000Z', seasons)).toEqual({
      scope: 'monthly',
      startsAt: '2026-09-01T00:00:00.000Z',
      endsAt: '2026-10-01T00:00:00.000Z',
      seasonId: null,
    });
  });

  it('uses the active configured season and represents all-time without boundaries', () => {
    expect(resolveRankingWindow('season', '2026-09-16T10:00:00.000Z', seasons)).toEqual({
      scope: 'season',
      startsAt: '2026-09-01T00:00:00.000Z',
      endsAt: '2026-12-01T00:00:00.000Z',
      seasonId: 'autumn-2026',
    });

    expect(resolveRankingWindow('all-time', '2026-09-16T10:00:00.000Z', seasons)).toEqual({
      scope: 'all-time',
      startsAt: null,
      endsAt: null,
      seasonId: null,
    });
  });

  it('returns null for invalid time or season scope without an active season', () => {
    expect(resolveRankingWindow('weekly', 'not-a-date', seasons)).toBeNull();
    expect(resolveRankingWindow('season', '2027-01-01T00:00:00.000Z', seasons)).toBeNull();
  });
});

describe('buildRanking', () => {
  it('supports independent Senderista, Explorador and Mágina scoring policies', () => {
    const senderistaRanking = buildRanking(
      participants,
      'senderista',
      'weekly',
      senderista,
      '2026-09-16T10:00:00.000Z',
      seasons,
    );
    const exploradorRanking = buildRanking(
      participants,
      'explorador',
      'weekly',
      explorador,
      '2026-09-16T10:00:00.000Z',
      seasons,
    );
    const maginaRanking = buildRanking(
      participants,
      'magina',
      'weekly',
      magina,
      '2026-09-16T10:00:00.000Z',
      seasons,
    );

    expect(senderistaRanking.map((entry) => entry.userId)).toEqual(['alice', 'bob']);
    expect(exploradorRanking.map((entry) => entry.userId)).toEqual(['bob', 'alice']);
    expect(maginaRanking.map((entry) => entry.userId)).toEqual(['bob', 'alice']);
  });

  it('filters weekly/monthly/season scopes and excludes activities after asOf', () => {
    const weekly = buildRanking(
      participants,
      'senderista',
      'weekly',
      senderista,
      '2026-09-16T10:00:00.000Z',
      seasons,
    );
    const monthly = buildRanking(
      participants,
      'senderista',
      'monthly',
      senderista,
      '2026-09-16T10:00:00.000Z',
      seasons,
    );
    const season = buildRanking(
      participants,
      'senderista',
      'season',
      senderista,
      '2026-09-16T10:00:00.000Z',
      seasons,
    );

    expect(weekly.find((entry) => entry.userId === 'alice')?.stats.distanceMeters).toBe(10_000);
    expect(monthly.find((entry) => entry.userId === 'alice')?.stats.distanceMeters).toBe(14_000);
    expect(season.find((entry) => entry.userId === 'alice')?.stats.distanceMeters).toBe(14_000);
  });

  it('deduplicates activity ids and enforces a configurable same-route counting cap', () => {
    const repeated: RankingParticipantInput[] = [
      {
        userId: 'farmer',
        activities: [
          activity('r1', 'route-x', '2026-09-14T08:00:00.000Z'),
          activity('r1', 'route-x', '2026-09-14T08:00:00.000Z'),
          activity('r2', 'route-x', '2026-09-15T08:00:00.000Z'),
          activity('r3', 'route-x', '2026-09-16T08:00:00.000Z'),
        ],
      },
    ];

    const capped = buildRanking(
      repeated,
      'senderista',
      'weekly',
      { ...senderista, weights: { distanceMeters: 0.001 }, maxCountedSameRoute: 1 },
      '2026-09-16T10:00:00.000Z',
      seasons,
    );

    expect(capped[0]?.stats.completedActivities).toBe(1);
    expect(capped[0]?.stats.distanceMeters).toBe(5_000);
    expect(capped[0]?.score).toBe(5);
  });

  it('omits users without scoped activities and clamps invalid weights', () => {
    const result = buildRanking(
      participants,
      'senderista',
      'weekly',
      {
        kind: 'senderista',
        weights: { distanceMeters: -2, ascentMeters: Number.NaN },
        maxCountedSameRoute: null,
      },
      '2026-09-16T10:00:00.000Z',
      seasons,
    );

    expect(result.map((entry) => entry.userId)).toEqual(['alice', 'bob']);
    expect(result.every((entry) => entry.score === 0)).toBe(true);
  });

  it('shares rank for equal scores and uses user id only for stable display ordering', () => {
    const equalParticipants: RankingParticipantInput[] = [
      { userId: 'bravo', activities: [activity('b', 'r-b', '2026-09-15T08:00:00.000Z')] },
      { userId: 'alpha', activities: [activity('a', 'r-a', '2026-09-15T08:00:00.000Z')] },
      {
        userId: 'charlie',
        activities: [activity('c', 'r-c', '2026-09-15T08:00:00.000Z', { distanceMeters: 1_000 })],
      },
    ];

    const result = buildRanking(
      equalParticipants,
      'senderista',
      'weekly',
      { ...senderista, weights: { distanceMeters: 0.001 } },
      '2026-09-16T10:00:00.000Z',
      seasons,
    );

    expect(result.map(({ userId, rank, score }) => ({ userId, rank, score }))).toEqual([
      { userId: 'alpha', rank: 1, score: 5 },
      { userId: 'bravo', rank: 1, score: 5 },
      { userId: 'charlie', rank: 3, score: 1 },
    ]);
  });

  it('rejects a scoring policy for a different ranking kind', () => {
    expect(
      buildRanking(
        participants,
        'senderista',
        'weekly',
        explorador,
        '2026-09-16T10:00:00.000Z',
        seasons,
      ),
    ).toEqual([]);
  });
});
