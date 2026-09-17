import { describe, expect, it } from 'vitest';

import {
  buildPhysicalRewardReleasePlan,
  type PhysicalRewardReleaseInput,
} from './physical-reward-release';

function input(
  overrides: Partial<PhysicalRewardReleaseInput> = {},
): PhysicalRewardReleaseInput {
  return {
    userId: 'user-1',
    reservationId: 'reservation-1',
    rewardId: 'aove-500',
    credentialId: 'credential-1',
    reservedOlives: 3_500,
    reason: 'cancelled',
    reservationStatus: 'reserved',
    occurredAt: '2026-09-16T16:00:00.000Z',
    ...overrides,
  };
}

describe('buildPhysicalRewardReleasePlan', () => {
  it('cancels an active reservation by releasing olives, stock and revoking the credential', () => {
    const result = buildPhysicalRewardReleasePlan(input());

    expect(result.approved).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.oliveMovement).toEqual({
      userId: 'user-1',
      type: 'release',
      amount: 3_500,
      sourceKey: 'reservation:reservation-1:release:cancelled',
      reservationId: 'reservation-1',
      occurredAt: '2026-09-16T16:00:00.000Z',
    });
    expect(result.stockRelease).toEqual({
      reservationId: 'reservation-1',
      rewardId: 'aove-500',
      quantity: 1,
      sourceKey: 'reservation:reservation-1:stock-release:cancelled',
    });
    expect(result.credentialUpdate).toEqual({
      credentialId: 'credential-1',
      status: 'revoked',
      occurredAt: '2026-09-16T16:00:00.000Z',
      sourceKey: 'reservation:reservation-1:credential:cancelled',
    });
  });

  it('expires an active reservation and marks the credential expired', () => {
    const result = buildPhysicalRewardReleasePlan(input({ reason: 'expired' }));

    expect(result.approved).toBe(true);
    expect(result.credentialUpdate?.status).toBe('expired');
    expect(result.oliveMovement?.sourceKey).toBe(
      'reservation:reservation-1:release:expired',
    );
  });

  it.each(['redeemed', 'cancelled', 'expired'] as const)(
    'does not release a terminal %s reservation twice',
    (reservationStatus) => {
      const result = buildPhysicalRewardReleasePlan(input({ reservationStatus }));

      expect(result.approved).toBe(false);
      expect(result.reasons).toEqual(['reservation-not-active']);
      expect(result.oliveMovement).toBeNull();
      expect(result.stockRelease).toBeNull();
      expect(result.credentialUpdate).toBeNull();
    },
  );

  it('uses stable source keys for retries while the state transition is being committed', () => {
    const first = buildPhysicalRewardReleasePlan(input());
    const second = buildPhysicalRewardReleasePlan(input());

    expect(second.oliveMovement?.sourceKey).toBe(first.oliveMovement?.sourceKey);
    expect(second.stockRelease?.sourceKey).toBe(first.stockRelease?.sourceKey);
    expect(second.credentialUpdate?.sourceKey).toBe(first.credentialUpdate?.sourceKey);
  });

  it('rejects malformed identities, amount and timestamp', () => {
    expect(buildPhysicalRewardReleasePlan(input({ userId: ' ' })).reasons).toEqual([
      'invalid-user-id',
    ]);
    expect(
      buildPhysicalRewardReleasePlan(input({ reservationId: ' ' })).reasons,
    ).toEqual(['invalid-reservation-id']);
    expect(buildPhysicalRewardReleasePlan(input({ rewardId: ' ' })).reasons).toEqual([
      'invalid-reward-id',
    ]);
    expect(
      buildPhysicalRewardReleasePlan(input({ credentialId: ' ' })).reasons,
    ).toEqual(['invalid-credential-id']);
    expect(
      buildPhysicalRewardReleasePlan(input({ reservedOlives: 0 })).reasons,
    ).toEqual(['invalid-reserved-olives']);
    expect(
      buildPhysicalRewardReleasePlan(input({ occurredAt: 'bad-time' })).reasons,
    ).toEqual(['invalid-occurred-at']);
  });
});
