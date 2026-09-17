import { describe, expect, it } from 'vitest';

import {
  evaluateRewardEligibility,
  type RewardCatalogItem,
  type RewardEligibilityInput,
} from './reward-catalog';

function item(overrides: Partial<RewardCatalogItem> = {}): RewardCatalogItem {
  return {
    id: 'background-cuadros',
    name: 'Atardecer en Cuadros',
    kind: 'digital',
    rarity: 'rare',
    priceOlives: 600,
    active: true,
    startsAt: null,
    endsAt: null,
    minLevel: null,
    minStage: null,
    requiredBadgeSlugs: [],
    requiredChallengeIds: [],
    stockAvailable: null,
    perUserLimit: null,
    repeatable: false,
    ...overrides,
  };
}

function input(overrides: Partial<RewardEligibilityInput> = {}): RewardEligibilityInput {
  return {
    item: item(),
    now: '2026-09-16T12:00:00.000Z',
    walletAvailable: 1_000,
    level: 20,
    stage: 'developing',
    badgeSlugs: [],
    completedChallengeIds: [],
    previousRedemptions: 0,
    ...overrides,
  };
}

describe('evaluateRewardEligibility', () => {
  it('approves an available reward when all requirements are met', () => {
    const result = evaluateRewardEligibility(input());

    expect(result).toEqual({ eligible: true, reasons: [] });
  });

  it('reports inactive and insufficient-balance reasons in canonical order', () => {
    const value = input({
      item: item({ active: false, priceOlives: 2_000 }),
      walletAvailable: 100,
    });

    expect(evaluateRewardEligibility(value)).toEqual({
      eligible: false,
      reasons: ['inactive', 'insufficient-olives'],
    });
  });

  it('enforces catalogue availability windows', () => {
    const notStarted = evaluateRewardEligibility(
      input({ item: item({ startsAt: '2026-09-17T00:00:00.000Z' }) }),
    );
    const expired = evaluateRewardEligibility(
      input({ item: item({ endsAt: '2026-09-15T23:59:59.000Z' }) }),
    );

    expect(notStarted.reasons).toEqual(['not-started']);
    expect(expired.reasons).toEqual(['expired']);
  });

  it('enforces minimum level and olive-tree stage', () => {
    const result = evaluateRewardEligibility(
      input({
        item: item({ minLevel: 30, minStage: 'mature' }),
        level: 20,
        stage: 'developing',
      }),
    );

    expect(result.reasons).toEqual(['level-required', 'stage-required']);
  });

  it('enforces required badges and completed challenges', () => {
    const result = evaluateRewardEligibility(
      input({
        item: item({
          requiredBadgeSlugs: ['bedmar-explorer'],
          requiredChallengeIds: ['autumn-2026'],
        }),
        badgeSlugs: [],
        completedChallengeIds: [],
      }),
    );

    expect(result.reasons).toEqual(['badge-required', 'challenge-required']);
  });

  it('enforces physical stock and explicit per-user limits', () => {
    const result = evaluateRewardEligibility(
      input({
        item: item({
          kind: 'physical',
          stockAvailable: 0,
          perUserLimit: 1,
          repeatable: true,
        }),
        previousRedemptions: 1,
      }),
    );

    expect(result.reasons).toEqual(['out-of-stock', 'user-limit-reached']);
  });

  it('treats a non-repeatable reward as limited to one redemption', () => {
    const result = evaluateRewardEligibility(
      input({ previousRedemptions: 1 }),
    );

    expect(result.reasons).toEqual(['user-limit-reached']);
  });

  it('treats higher olive-tree stages as satisfying lower stage gates', () => {
    const result = evaluateRewardEligibility(
      input({
        item: item({ minStage: 'adult' }),
        stage: 'centenary',
      }),
    );

    expect(result.eligible).toBe(true);
  });
});
