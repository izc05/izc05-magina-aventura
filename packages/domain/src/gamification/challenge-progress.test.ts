import { describe, expect, it } from 'vitest';

import type { VerifiedAdventureStatInput } from './adventure-stats';
import {
  projectActiveChallengeProgress,
  resolveActiveSeason,
  type ChallengeDefinition,
  type SeasonDefinition,
} from './challenge-progress';

const seasons: SeasonDefinition[] = [
  {
    id: 'season-autumn',
    name: 'Otoño en Mágina',
    startsAt: '2026-09-01T00:00:00.000Z',
    endsAt: '2026-12-01T00:00:00.000Z',
    active: true,
  },
  {
    id: 'season-hidden',
    name: 'Oculta',
    startsAt: '2026-09-01T00:00:00.000Z',
    endsAt: '2026-12-01T00:00:00.000Z',
    active: false,
  },
];

function activity(
  activityId: string,
  verifiedAt: string,
  overrides: Partial<VerifiedAdventureStatInput> = {},
): VerifiedAdventureStatInput {
  return {
    activityId,
    routeId: `route-${activityId}`,
    municipalityId: 'bedmar',
    verifiedAt,
    distanceMeters: 5_000,
    ascentMeters: 300,
    discoveriesUnlocked: 2,
    checkpointsReached: 3,
    ...overrides,
  };
}

function challenge(
  id: string,
  overrides: Partial<ChallengeDefinition> = {},
): ChallengeDefinition {
  return {
    id,
    title: id,
    description: `${id} description`,
    scope: 'weekly',
    metric: 'distanceMeters',
    target: 10_000,
    startsAt: '2026-09-14T00:00:00.000Z',
    endsAt: '2026-09-21T00:00:00.000Z',
    active: true,
    municipalityId: null,
    seasonId: null,
    ...overrides,
  };
}

describe('resolveActiveSeason', () => {
  it('uses inclusive start and exclusive end and ignores inactive seasons', () => {
    expect(resolveActiveSeason('2026-09-01T00:00:00.000Z', seasons)?.id).toBe(
      'season-autumn',
    );
    expect(resolveActiveSeason('2026-12-01T00:00:00.000Z', seasons)).toBeNull();
  });

  it('resolves overlaps deterministically by latest start then id', () => {
    const overlapping: SeasonDefinition[] = [
      ...seasons,
      {
        id: 'season-b',
        name: 'B',
        startsAt: '2026-09-10T00:00:00.000Z',
        endsAt: '2026-10-01T00:00:00.000Z',
        active: true,
      },
      {
        id: 'season-a',
        name: 'A',
        startsAt: '2026-09-10T00:00:00.000Z',
        endsAt: '2026-10-01T00:00:00.000Z',
        active: true,
      },
    ];

    expect(resolveActiveSeason('2026-09-16T10:00:00.000Z', overlapping)?.id).toBe(
      'season-a',
    );
  });
});

describe('projectActiveChallengeProgress', () => {
  const activities = [
    activity('a1', '2026-09-15T08:00:00.000Z'),
    activity('a2', '2026-09-16T08:00:00.000Z', {
      municipalityId: 'jodar',
      distanceMeters: 7_000,
      discoveriesUnlocked: 4,
    }),
    activity('a2', '2026-09-16T08:00:00.000Z', {
      municipalityId: 'jodar',
      distanceMeters: 7_000,
      discoveriesUnlocked: 4,
    }),
    activity('outside', '2026-09-22T08:00:00.000Z', { distanceMeters: 99_000 }),
  ];

  it('projects weekly progress only from unique activities inside the configured window', () => {
    const [projection] = projectActiveChallengeProgress(
      activities,
      [challenge('weekly-distance')],
      seasons,
      '2026-09-16T10:00:00.000Z',
      [],
    );

    expect(projection).toMatchObject({
      challengeId: 'weekly-distance',
      current: 12_000,
      target: 10_000,
      percentage: 100,
      completed: true,
      sourceKey: 'challenge:weekly-distance:completion',
    });
  });

  it('supports exact daily challenge windows supplied by configuration', () => {
    const [projection] = projectActiveChallengeProgress(
      activities,
      [
        challenge('daily-activities', {
          scope: 'daily',
          metric: 'completedActivities',
          target: 1,
          startsAt: '2026-09-16T00:00:00.000Z',
          endsAt: '2026-09-17T00:00:00.000Z',
        }),
      ],
      seasons,
      '2026-09-16T10:00:00.000Z',
      [],
    );

    expect(projection.current).toBe(1);
    expect(projection.completed).toBe(true);
  });

  it('restricts municipal challenges to their configured municipality', () => {
    const [projection] = projectActiveChallengeProgress(
      activities,
      [
        challenge('bedmar-distance', {
          scope: 'municipal',
          municipalityId: 'bedmar',
          target: 6_000,
        }),
      ],
      seasons,
      '2026-09-16T10:00:00.000Z',
      [],
    );

    expect(projection.current).toBe(5_000);
    expect(projection.completed).toBe(false);
    expect(projection.percentage).toBe(83);
  });

  it('binds season challenges to the matching active season', () => {
    const [projection] = projectActiveChallengeProgress(
      activities,
      [
        challenge('autumn-discoveries', {
          scope: 'season',
          metric: 'discoveriesUnlocked',
          target: 6,
          startsAt: '2026-09-01T00:00:00.000Z',
          endsAt: '2026-12-01T00:00:00.000Z',
          seasonId: 'season-autumn',
        }),
      ],
      seasons,
      '2026-09-16T10:00:00.000Z',
      [],
    );

    expect(projection.current).toBe(6);
    expect(projection.completed).toBe(true);
  });

  it('skips invalid municipal/season bindings, inactive definitions and already completed challenges', () => {
    const result = projectActiveChallengeProgress(
      activities,
      [
        challenge('invalid-municipal', { scope: 'municipal', municipalityId: null }),
        challenge('invalid-season', { scope: 'season', seasonId: 'missing-season' }),
        challenge('inactive', { active: false }),
        challenge('done'),
      ],
      seasons,
      '2026-09-16T10:00:00.000Z',
      ['done'],
    );

    expect(result).toEqual([]);
  });

  it('normalizes non-positive targets and returns deterministic challenge ordering', () => {
    const result = projectActiveChallengeProgress(
      [],
      [challenge('zeta', { target: -3 }), challenge('alpha', { target: 0 })],
      seasons,
      '2026-09-16T10:00:00.000Z',
      [],
    );

    expect(result.map((item) => item.challengeId)).toEqual(['alpha', 'zeta']);
    expect(result.every((item) => item.target === 1)).toBe(true);
    expect(result.every((item) => item.percentage === 0)).toBe(true);
  });
});
