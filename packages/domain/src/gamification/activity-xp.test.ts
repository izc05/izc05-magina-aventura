import { describe, expect, it } from 'vitest';

import {
  calculateVerifiedActivityXp,
  type ActivityXpAwardHistory,
  type ActivityXpPolicy,
  type VerifiedActivityXpInput,
} from './activity-xp';

const policy: ActivityXpPolicy = {
  baseVerifiedXp: 100,
  distanceUnitMeters: 1000,
  xpPerDistanceUnit: 20,
  ascentUnitMeters: 100,
  xpPerAscentUnit: 10,
  xpPerNewDiscovery: 15,
  firstRouteBonusXp: 50,
  firstMunicipalityBonusXp: 30,
  repeatRouteWindowHours: 24,
  maxRewardedSameRouteInWindow: 2,
};

function activity(
  overrides: Partial<VerifiedActivityXpInput> = {},
): VerifiedActivityXpInput {
  return {
    activityId: 'activity-3',
    routeId: 'route-bedmar',
    municipalityId: 'bedmar',
    verifiedAt: '2026-09-16T10:00:00.000Z',
    distanceMeters: 2500,
    ascentMeters: 250,
    newDiscoveryCount: 2,
    ...overrides,
  };
}

function history(
  activityId: string,
  verifiedAt: string,
  overrides: Partial<ActivityXpAwardHistory> = {},
): ActivityXpAwardHistory {
  return {
    activityId,
    routeId: 'route-bedmar',
    municipalityId: 'bedmar',
    verifiedAt,
    ...overrides,
  };
}

describe('calculateVerifiedActivityXp', () => {
  it('awards configured base, distance, ascent, discovery and first-time bonuses', () => {
    const result = calculateVerifiedActivityXp(activity(), policy, []);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReason).toBeNull();
    expect(result.sourceKey).toBe('activity:activity-3:verified-xp');
    expect(result.breakdown).toEqual({
      base: 100,
      distance: 40,
      ascent: 20,
      discoveries: 30,
      firstRouteBonus: 50,
      firstMunicipalityBonus: 30,
    });
    expect(result.totalXp).toBe(270);
  });

  it('does not award first-route or first-municipality bonuses after prior rewarded history', () => {
    const result = calculateVerifiedActivityXp(activity(), policy, [
      history('activity-1', '2026-09-10T10:00:00.000Z'),
    ]);

    expect(result.eligible).toBe(true);
    expect(result.breakdown.firstRouteBonus).toBe(0);
    expect(result.breakdown.firstMunicipalityBonus).toBe(0);
    expect(result.totalXp).toBe(190);
  });

  it('rejects a duplicate activity id before calculating XP', () => {
    const result = calculateVerifiedActivityXp(activity(), policy, [
      history('activity-3', '2026-09-16T09:30:00.000Z'),
    ]);

    expect(result).toMatchObject({
      eligible: false,
      rejectionReason: 'duplicate-activity',
      totalXp: 0,
      sourceKey: 'activity:activity-3:verified-xp',
    });
  });

  it('rejects repeated completions after the configured same-route limit inside the sliding window', () => {
    const result = calculateVerifiedActivityXp(activity(), policy, [
      history('activity-1', '2026-09-15T12:00:00.000Z'),
      history('activity-2', '2026-09-16T08:00:00.000Z'),
    ]);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReason).toBe('repeat-route-limit');
    expect(result.totalXp).toBe(0);
  });

  it('allows the same route again after prior awards leave the configured sliding window', () => {
    const result = calculateVerifiedActivityXp(activity(), policy, [
      history('activity-1', '2026-09-14T08:00:00.000Z'),
      history('activity-2', '2026-09-14T10:00:00.000Z'),
    ]);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReason).toBeNull();
    expect(result.totalXp).toBe(190);
  });

  it('clamps negative activity metrics so they cannot create negative component XP', () => {
    const result = calculateVerifiedActivityXp(
      activity({
        distanceMeters: -500,
        ascentMeters: -80,
        newDiscoveryCount: -2,
      }),
      policy,
      [],
    );

    expect(result.breakdown).toEqual({
      base: 100,
      distance: 0,
      ascent: 0,
      discoveries: 0,
      firstRouteBonus: 50,
      firstMunicipalityBonus: 30,
    });
    expect(result.totalXp).toBe(180);
  });

  it('keeps a stable source key for retries of the same verified activity', () => {
    const first = calculateVerifiedActivityXp(activity(), policy, []);
    const retry = calculateVerifiedActivityXp(
      activity({ distanceMeters: 9999, ascentMeters: 999 }),
      policy,
      [],
    );

    expect(first.sourceKey).toBe(retry.sourceKey);
    expect(first.sourceKey).toBe('activity:activity-3:verified-xp');
  });
});
