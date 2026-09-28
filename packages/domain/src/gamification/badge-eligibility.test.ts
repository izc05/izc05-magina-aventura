import { describe, expect, it } from 'vitest';

import type { AdventureAggregateStats } from './adventure-stats';
import {
  evaluateBadgeEligibility,
  type BadgeDefinition,
} from './badge-eligibility';

const stats: AdventureAggregateStats = {
  completedActivities: 8,
  distanceMeters: 42000,
  ascentMeters: 2800,
  discoveriesUnlocked: 18,
  checkpointsReached: 24,
  distinctRoutes: 6,
  distinctMunicipalities: 4,
  routeIds: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'],
  municipalityIds: ['bedmar', 'jimena', 'jodar', 'albanchez'],
};

function badge(
  slug: string,
  overrides: Partial<BadgeDefinition> = {},
): BadgeDefinition {
  return {
    slug,
    name: slug,
    description: `Badge ${slug}`,
    active: true,
    criteria: [{ metric: 'completedActivities', minimum: 5 }],
    ...overrides,
  };
}

describe('evaluateBadgeEligibility', () => {
  it('unlocks a badge exactly when its configured threshold is met', () => {
    expect(
      evaluateBadgeEligibility(stats, [
        badge('five-adventures', {
          criteria: [{ metric: 'completedActivities', minimum: 8 }],
        }),
      ]),
    ).toEqual([
      {
        slug: 'five-adventures',
        name: 'five-adventures',
        description: 'Badge five-adventures',
        sourceKey: 'badge:five-adventures:aggregate-stats',
      },
    ]);

    expect(
      evaluateBadgeEligibility(stats, [
        badge('nine-adventures', {
          criteria: [{ metric: 'completedActivities', minimum: 9 }],
        }),
      ]),
    ).toEqual([]);
  });

  it('requires all configured criteria to pass', () => {
    const definition = badge('mountain-explorer', {
      criteria: [
        { metric: 'distanceMeters', minimum: 40000 },
        { metric: 'ascentMeters', minimum: 3000 },
      ],
    });

    expect(evaluateBadgeEligibility(stats, [definition])).toEqual([]);

    definition.criteria[1] = { metric: 'ascentMeters', minimum: 2500 };

    expect(evaluateBadgeEligibility(stats, [definition])).toHaveLength(1);
  });

  it('ignores inactive badges and definitions without criteria', () => {
    expect(
      evaluateBadgeEligibility(stats, [
        badge('inactive', { active: false }),
        badge('empty', { criteria: [] }),
      ]),
    ).toEqual([]);
  });

  it('does not emit badges that were already unlocked', () => {
    expect(
      evaluateBadgeEligibility(
        stats,
        [badge('known'), badge('new')],
        ['known'],
      ).map((candidate) => candidate.slug),
    ).toEqual(['new']);
  });

  it('normalizes negative and non-finite minimum thresholds to zero', () => {
    expect(
      evaluateBadgeEligibility(stats, [
        badge('negative', {
          criteria: [{ metric: 'distinctMunicipalities', minimum: -5 }],
        }),
        badge('nan', {
          criteria: [{ metric: 'distinctRoutes', minimum: Number.NaN }],
        }),
      ]).map((candidate) => candidate.slug),
    ).toEqual(['nan', 'negative']);
  });

  it('returns newly eligible badges in deterministic slug order with stable source keys', () => {
    const result = evaluateBadgeEligibility(stats, [
      badge('zeta'),
      badge('alpha'),
      badge('middle'),
    ]);

    expect(result.map((candidate) => candidate.slug)).toEqual([
      'alpha',
      'middle',
      'zeta',
    ]);
    expect(result.map((candidate) => candidate.sourceKey)).toEqual([
      'badge:alpha:aggregate-stats',
      'badge:middle:aggregate-stats',
      'badge:zeta:aggregate-stats',
    ]);
  });

  it('does not mutate definitions, criteria or unlocked slug inputs', () => {
    const definitions = [badge('zeta'), badge('alpha')];
    const unlocked = ['existing'];
    const definitionsSnapshot = JSON.parse(JSON.stringify(definitions));
    const unlockedSnapshot = [...unlocked];

    evaluateBadgeEligibility(stats, definitions, unlocked);

    expect(definitions).toEqual(definitionsSnapshot);
    expect(unlocked).toEqual(unlockedSnapshot);
  });
});
