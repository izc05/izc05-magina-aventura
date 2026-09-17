import { describe, expect, it } from 'vitest';

import type { RewardCatalogItem, RewardEligibilityDecision } from './reward-catalog';
import {
  buildPhysicalRewardReservationPlan,
  type PhysicalRewardReservationInput,
} from './physical-reward-reservation';

function item(overrides: Partial<RewardCatalogItem> = {}): RewardCatalogItem {
  return {
    id: 'aove-500',
    name: 'AOVE Sierra Mágina 500 ml',
    kind: 'physical',
    rarity: 'rare',
    priceOlives: 3_500,
    active: true,
    startsAt: null,
    endsAt: null,
    minLevel: null,
    minStage: null,
    requiredBadgeSlugs: [],
    requiredChallengeIds: [],
    stockAvailable: 12,
    perUserLimit: 1,
    repeatable: true,
    ...overrides,
  };
}

const eligible: RewardEligibilityDecision = { eligible: true, reasons: [] };

function input(overrides: Partial<PhysicalRewardReservationInput> = {}): PhysicalRewardReservationInput {
  return {
    userId: 'user-1',
    reservationId: 'reservation-1',
    item: item(),
    eligibility: eligible,
    alreadyCommittedReservationIds: [],
    occurredAt: '2026-09-16T14:00:00.000Z',
    ...overrides,
  };
}

describe('buildPhysicalRewardReservationPlan', () => {
  it('reserves olives and one stock unit for an approved physical reward', () => {
    const result = buildPhysicalRewardReservationPlan(input());

    expect(result.status).toBe('approved');
    expect(result.approved).toBe(true);
    expect(result.oliveMovement).toEqual({
      userId: 'user-1',
      type: 'reserve',
      amount: 3_500,
      sourceKey: 'reservation:reservation-1:olives',
      reservationId: 'reservation-1',
      occurredAt: '2026-09-16T14:00:00.000Z',
    });
    expect(result.stockReservation).toEqual({
      rewardId: 'aove-500',
      reservationId: 'reservation-1',
      quantity: 1,
      sourceKey: 'reservation:reservation-1:stock',
    });
  });

  it('rejects digital rewards because they do not use reservation/QR delivery', () => {
    const result = buildPhysicalRewardReservationPlan(
      input({ item: item({ kind: 'digital' }) }),
    );

    expect(result.status).toBe('rejected');
    expect(result.reasons).toEqual(['digital-reward-not-reservable']);
    expect(result.oliveMovement).toBeNull();
    expect(result.stockReservation).toBeNull();
  });

  it('propagates catalogue eligibility failures', () => {
    const result = buildPhysicalRewardReservationPlan(
      input({
        eligibility: {
          eligible: false,
          reasons: ['insufficient-olives', 'out-of-stock'],
        },
      }),
    );

    expect(result.status).toBe('rejected');
    expect(result.reasons).toEqual(['insufficient-olives', 'out-of-stock']);
  });

  it('treats a committed reservation id as an idempotent no-op', () => {
    const result = buildPhysicalRewardReservationPlan(
      input({ alreadyCommittedReservationIds: ['reservation-1'] }),
    );

    expect(result.status).toBe('already-committed');
    expect(result.approved).toBe(false);
    expect(result.oliveMovement).toBeNull();
    expect(result.stockReservation).toBeNull();
  });

  it('uses stable source keys for retries', () => {
    const first = buildPhysicalRewardReservationPlan(input());
    const second = buildPhysicalRewardReservationPlan(input());

    expect(second.oliveMovement?.sourceKey).toBe(first.oliveMovement?.sourceKey);
    expect(second.stockReservation?.sourceKey).toBe(first.stockReservation?.sourceKey);
  });

  it('rejects malformed identity, timestamp and non-positive prices', () => {
    expect(buildPhysicalRewardReservationPlan(input({ userId: ' ' })).reasons).toEqual([
      'invalid-user-id',
    ]);
    expect(
      buildPhysicalRewardReservationPlan(input({ reservationId: ' ' })).reasons,
    ).toEqual(['invalid-reservation-id']);
    expect(
      buildPhysicalRewardReservationPlan(input({ occurredAt: 'not-a-date' })).reasons,
    ).toEqual(['invalid-occurred-at']);
    expect(
      buildPhysicalRewardReservationPlan(input({ item: item({ priceOlives: 0 }) })).reasons,
    ).toEqual(['invalid-price']);
  });
});
