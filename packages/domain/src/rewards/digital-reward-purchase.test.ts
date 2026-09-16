import { describe, expect, it } from 'vitest';

import type { RewardCatalogItem, RewardEligibilityDecision } from './reward-catalog';
import {
  buildDigitalRewardPurchasePlan,
  type DigitalRewardPurchaseInput,
} from './digital-reward-purchase';

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

const eligible: RewardEligibilityDecision = { eligible: true, reasons: [] };

function input(overrides: Partial<DigitalRewardPurchaseInput> = {}): DigitalRewardPurchaseInput {
  return {
    userId: 'user-1',
    purchaseId: 'purchase-1',
    item: item(),
    eligibility: eligible,
    alreadyOwnedRewardIds: [],
    alreadyCommittedPurchaseIds: [],
    occurredAt: '2026-09-16T13:00:00.000Z',
    ...overrides,
  };
}

describe('buildDigitalRewardPurchasePlan', () => {
  it('emits one spend movement and one entitlement for an approved purchase', () => {
    const result = buildDigitalRewardPurchasePlan(input());

    expect(result.status).toBe('approved');
    expect(result.approved).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.walletMovement).toEqual({
      userId: 'user-1',
      type: 'spend',
      amount: 600,
      sourceKey: 'purchase:purchase-1:spend',
      reservationId: null,
      occurredAt: '2026-09-16T13:00:00.000Z',
    });
    expect(result.entitlement).toEqual({
      userId: 'user-1',
      rewardId: 'background-cuadros',
      sourceKey: 'purchase:purchase-1:entitlement',
      grantedAt: '2026-09-16T13:00:00.000Z',
    });
  });

  it('rejects non-digital rewards', () => {
    const result = buildDigitalRewardPurchasePlan(
      input({ item: item({ kind: 'physical' }) }),
    );

    expect(result.status).toBe('rejected');
    expect(result.reasons).toEqual(['not-digital-reward']);
    expect(result.walletMovement).toBeNull();
    expect(result.entitlement).toBeNull();
  });

  it('propagates catalogue eligibility failures without spending olives', () => {
    const result = buildDigitalRewardPurchasePlan(
      input({
        eligibility: {
          eligible: false,
          reasons: ['insufficient-olives', 'level-required'],
        },
      }),
    );

    expect(result.status).toBe('rejected');
    expect(result.reasons).toEqual(['insufficient-olives', 'level-required']);
    expect(result.walletMovement).toBeNull();
  });

  it('rejects a non-repeatable reward that the user already owns', () => {
    const result = buildDigitalRewardPurchasePlan(
      input({ alreadyOwnedRewardIds: ['background-cuadros'] }),
    );

    expect(result.status).toBe('rejected');
    expect(result.reasons).toEqual(['already-owned']);
  });

  it('treats an already committed purchase as an idempotent no-op', () => {
    const result = buildDigitalRewardPurchasePlan(
      input({ alreadyCommittedPurchaseIds: ['purchase-1'] }),
    );

    expect(result.status).toBe('already-committed');
    expect(result.approved).toBe(false);
    expect(result.walletMovement).toBeNull();
    expect(result.entitlement).toBeNull();
  });

  it('uses stable source keys for retries of the same purchase identity', () => {
    const first = buildDigitalRewardPurchasePlan(input());
    const second = buildDigitalRewardPurchasePlan(input());

    expect(second.walletMovement?.sourceKey).toBe(first.walletMovement?.sourceKey);
    expect(second.entitlement?.sourceKey).toBe(first.entitlement?.sourceKey);
  });

  it('rejects malformed identity, timestamp and non-positive prices', () => {
    expect(buildDigitalRewardPurchasePlan(input({ userId: ' ' })).reasons).toEqual([
      'invalid-user-id',
    ]);
    expect(buildDigitalRewardPurchasePlan(input({ purchaseId: ' ' })).reasons).toEqual([
      'invalid-purchase-id',
    ]);
    expect(
      buildDigitalRewardPurchasePlan(input({ occurredAt: 'not-a-date' })).reasons,
    ).toEqual(['invalid-occurred-at']);
    expect(
      buildDigitalRewardPurchasePlan(input({ item: item({ priceOlives: 0 }) })).reasons,
    ).toEqual(['invalid-price']);
  });
});
