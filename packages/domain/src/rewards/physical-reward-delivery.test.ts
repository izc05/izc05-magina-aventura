import { describe, expect, it } from 'vitest';

import type {
  RedemptionCredential,
  RedemptionScanDecision,
} from './redemption-credential';
import {
  confirmPhysicalRewardDelivery,
  type PhysicalRewardDeliveryInput,
} from './physical-reward-delivery';

function credential(
  overrides: Partial<RedemptionCredential> = {},
): RedemptionCredential {
  return {
    credentialId: 'credential-1',
    reservationId: 'reservation-1',
    rewardId: 'aove-500',
    partnerId: 'almazara-1',
    tokenFingerprint: 'sha256:fingerprint-1',
    status: 'active',
    issuedAt: '2026-09-16T14:00:00.000Z',
    expiresAt: '2026-09-18T14:00:00.000Z',
    ...overrides,
  };
}

function scanDecision(
  overrides: Partial<RedemptionScanDecision> = {},
): RedemptionScanDecision {
  return {
    valid: true,
    reasons: [],
    credentialId: 'credential-1',
    reservationId: 'reservation-1',
    rewardId: 'aove-500',
    ...overrides,
  };
}

function input(overrides: Partial<PhysicalRewardDeliveryInput> = {}): PhysicalRewardDeliveryInput {
  return {
    userId: 'user-1',
    redemptionId: 'redemption-1',
    operatorId: 'operator-1',
    scanDecision: scanDecision(),
    credential: credential(),
    reservedOlives: 3_500,
    alreadyCommittedRedemptionIds: [],
    redeemedAt: '2026-09-16T15:05:00.000Z',
    ...overrides,
  };
}

describe('confirmPhysicalRewardDelivery', () => {
  it('turns a valid scan into one atomic set of delivery candidates', () => {
    const result = confirmPhysicalRewardDelivery(input());

    expect(result.status).toBe('approved');
    expect(result.approved).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.oliveMovement).toEqual({
      userId: 'user-1',
      type: 'spend',
      amount: 3_500,
      sourceKey: 'redemption:redemption-1:olives',
      reservationId: 'reservation-1',
      occurredAt: '2026-09-16T15:05:00.000Z',
    });
    expect(result.credentialConsumption).toEqual({
      credentialId: 'credential-1',
      status: 'consumed',
      consumedAt: '2026-09-16T15:05:00.000Z',
      sourceKey: 'redemption:redemption-1:credential',
    });
    expect(result.stockFinalization).toEqual({
      reservationId: 'reservation-1',
      rewardId: 'aove-500',
      quantity: 1,
      sourceKey: 'redemption:redemption-1:stock',
    });
    expect(result.redemption).toEqual({
      redemptionId: 'redemption-1',
      reservationId: 'reservation-1',
      credentialId: 'credential-1',
      rewardId: 'aove-500',
      partnerId: 'almazara-1',
      operatorId: 'operator-1',
      redeemedAt: '2026-09-16T15:05:00.000Z',
      sourceKey: 'redemption:redemption-1:record',
    });
  });

  it('does not spend anything when the QR scan is invalid', () => {
    const result = confirmPhysicalRewardDelivery(
      input({
        scanDecision: scanDecision({ valid: false, reasons: ['wrong-partner'] }),
      }),
    );

    expect(result.status).toBe('rejected');
    expect(result.reasons).toEqual(['wrong-partner']);
    expect(result.oliveMovement).toBeNull();
    expect(result.credentialConsumption).toBeNull();
    expect(result.stockFinalization).toBeNull();
    expect(result.redemption).toBeNull();
  });

  it('rejects a scan decision that does not match the credential identity', () => {
    const result = confirmPhysicalRewardDelivery(
      input({ scanDecision: scanDecision({ reservationId: 'reservation-2' }) }),
    );

    expect(result.reasons).toEqual(['scan-credential-mismatch']);
    expect(result.oliveMovement).toBeNull();
  });

  it('treats a previously committed redemption as an idempotent no-op', () => {
    const result = confirmPhysicalRewardDelivery(
      input({ alreadyCommittedRedemptionIds: ['redemption-1'] }),
    );

    expect(result.status).toBe('already-committed');
    expect(result.approved).toBe(false);
    expect(result.oliveMovement).toBeNull();
    expect(result.redemption).toBeNull();
  });

  it('uses stable candidate keys for retries of the same redemption identity', () => {
    const first = confirmPhysicalRewardDelivery(input());
    const second = confirmPhysicalRewardDelivery(input());

    expect(second.oliveMovement?.sourceKey).toBe(first.oliveMovement?.sourceKey);
    expect(second.credentialConsumption?.sourceKey).toBe(
      first.credentialConsumption?.sourceKey,
    );
    expect(second.stockFinalization?.sourceKey).toBe(
      first.stockFinalization?.sourceKey,
    );
    expect(second.redemption?.sourceKey).toBe(first.redemption?.sourceKey);
  });

  it('rejects malformed user, redemption, operator, time and reserved amount', () => {
    expect(confirmPhysicalRewardDelivery(input({ userId: ' ' })).reasons).toEqual([
      'invalid-user-id',
    ]);
    expect(
      confirmPhysicalRewardDelivery(input({ redemptionId: ' ' })).reasons,
    ).toEqual(['invalid-redemption-id']);
    expect(
      confirmPhysicalRewardDelivery(input({ operatorId: ' ' })).reasons,
    ).toEqual(['invalid-operator-id']);
    expect(
      confirmPhysicalRewardDelivery(input({ redeemedAt: 'bad-time' })).reasons,
    ).toEqual(['invalid-redeemed-at']);
    expect(
      confirmPhysicalRewardDelivery(input({ reservedOlives: 0 })).reasons,
    ).toEqual(['invalid-reserved-olives']);
  });
});
