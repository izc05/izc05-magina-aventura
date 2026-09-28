import { describe, expect, it } from 'vitest';

import {
  aggregateAdventureStats,
  type VerifiedAdventureStatInput,
} from './adventure-stats';

function activity(
  activityId: string,
  overrides: Partial<VerifiedAdventureStatInput> = {},
): VerifiedAdventureStatInput {
  return {
    activityId,
    routeId: `route-${activityId}`,
    municipalityId: `municipality-${activityId}`,
    verifiedAt: '2026-09-16T10:00:00.000Z',
    distanceMeters: 5000,
    ascentMeters: 400,
    discoveriesUnlocked: 3,
    checkpointsReached: 4,
    ...overrides,
  };
}

describe('aggregateAdventureStats', () => {
  it('sums physical and exploration metrics across verified activities', () => {
    const result = aggregateAdventureStats([
      activity('a1'),
      activity('a2', {
        distanceMeters: 3200,
        ascentMeters: 250,
        discoveriesUnlocked: 2,
        checkpointsReached: 3,
      }),
    ]);

    expect(result).toMatchObject({
      completedActivities: 2,
      distanceMeters: 8200,
      ascentMeters: 650,
      discoveriesUnlocked: 5,
      checkpointsReached: 7,
    });
  });

  it('counts only the first occurrence of a duplicate activity id', () => {
    const result = aggregateAdventureStats([
      activity('a1'),
      activity('a1', {
        routeId: 'route-replayed',
        municipalityId: 'municipality-replayed',
        distanceMeters: 99999,
        ascentMeters: 9999,
        discoveriesUnlocked: 99,
        checkpointsReached: 99,
      }),
    ]);

    expect(result.completedActivities).toBe(1);
    expect(result.distanceMeters).toBe(5000);
    expect(result.ascentMeters).toBe(400);
    expect(result.routeIds).toEqual(['route-a1']);
    expect(result.municipalityIds).toEqual(['municipality-a1']);
  });

  it('clamps negative and non-finite metrics to zero', () => {
    const result = aggregateAdventureStats([
      activity('a1', {
        distanceMeters: -100,
        ascentMeters: Number.NaN,
        discoveriesUnlocked: Number.POSITIVE_INFINITY,
        checkpointsReached: -5,
      }),
    ]);

    expect(result.distanceMeters).toBe(0);
    expect(result.ascentMeters).toBe(0);
    expect(result.discoveriesUnlocked).toBe(0);
    expect(result.checkpointsReached).toBe(0);
  });

  it('deduplicates and sorts route and municipality ids deterministically', () => {
    const result = aggregateAdventureStats([
      activity('a1', {
        routeId: 'route-zeta',
        municipalityId: 'jimena',
      }),
      activity('a2', {
        routeId: 'route-alpha',
        municipalityId: null,
      }),
      activity('a3', {
        routeId: 'route-zeta',
        municipalityId: 'bedmar',
      }),
      activity('a4', {
        routeId: 'route-beta',
        municipalityId: 'jimena',
      }),
    ]);

    expect(result.routeIds).toEqual([
      'route-alpha',
      'route-beta',
      'route-zeta',
    ]);
    expect(result.municipalityIds).toEqual(['bedmar', 'jimena']);
    expect(result.distinctRoutes).toBe(3);
    expect(result.distinctMunicipalities).toBe(2);
  });

  it('returns an all-zero projection for empty input', () => {
    expect(aggregateAdventureStats([])).toEqual({
      completedActivities: 0,
      distanceMeters: 0,
      ascentMeters: 0,
      discoveriesUnlocked: 0,
      checkpointsReached: 0,
      distinctRoutes: 0,
      distinctMunicipalities: 0,
      routeIds: [],
      municipalityIds: [],
    });
  });

  it('does not mutate the caller activity array or records', () => {
    const first = activity('a1', {
      routeId: 'route-zeta',
      municipalityId: 'jimena',
    });
    const second = activity('a2', {
      routeId: 'route-alpha',
      municipalityId: 'bedmar',
    });
    const input = [first, second];
    const snapshot = JSON.parse(JSON.stringify(input));

    aggregateAdventureStats(input);

    expect(input).toEqual(snapshot);
    expect(input[0]).toBe(first);
    expect(input[1]).toBe(second);
  });
});
