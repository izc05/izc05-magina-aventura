import { describe, expect, it } from 'vitest';

import {
  evaluateRedemptionScan,
  type RedemptionCredential,
  type RedemptionScanInput,
} from './redemption-credential';

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

function input(overrides: Partial<RedemptionScanInput> = {}): RedemptionScanInput {
  return {
    credential: credential(),
    scannedTokenFingerprint: 'sha256:fingerprint-1',
    partnerId: 'almazara-1',
    now: '2026-09-16T15:00:00.000Z',
    reservationStatus: 'reserved',
    ...overrides,
  };
}

describe('evaluateRedemptionScan', () => {
  it('validates an active credential for the authorized partner', () => {
    const result = evaluateRedemptionScan(input());

    expect(result).toEqual({
      valid: true,
      reasons: [],
      credentialId: 'credential-1',
      reservationId: 'reservation-1',
      rewardId: 'aove-500',
    });
  });

  it('rejects a token fingerprint mismatch without exposing token material', () => {
    const result = evaluateRedemptionScan(
      input({ scannedTokenFingerprint: 'sha256:someone-else' }),
    );

    expect(result.valid).toBe(false);
    expect(result.reasons).toEqual(['token-mismatch']);
    expect(JSON.stringify(result)).not.toContain('someone-else');
    expect(JSON.stringify(result)).not.toContain('fingerprint-1');
  });

  it('rejects a credential presented to the wrong partner', () => {
    const result = evaluateRedemptionScan(input({ partnerId: 'almazara-2' }));

    expect(result.reasons).toEqual(['wrong-partner']);
  });

  it('rejects credentials after their expiry timestamp', () => {
    const result = evaluateRedemptionScan(
      input({ now: '2026-09-19T00:00:00.000Z' }),
    );

    expect(result.reasons).toEqual(['credential-expired']);
  });

  it.each([
    ['consumed', 'credential-consumed'],
    ['revoked', 'credential-revoked'],
    ['expired', 'credential-expired'],
  ] as const)('rejects a %s credential', (status, reason) => {
    const result = evaluateRedemptionScan(
      input({ credential: credential({ status }) }),
    );

    expect(result.reasons).toEqual([reason]);
  });

  it.each(['redeemed', 'cancelled', 'expired'] as const)(
    'rejects a %s reservation',
    (reservationStatus) => {
      const result = evaluateRedemptionScan(input({ reservationStatus }));

      expect(result.reasons).toEqual(['reservation-not-active']);
    },
  );

  it('returns multiple failures in canonical order', () => {
    const result = evaluateRedemptionScan(
      input({
        credential: credential({ status: 'revoked' }),
        scannedTokenFingerprint: 'sha256:wrong',
        partnerId: 'almazara-2',
        reservationStatus: 'cancelled',
      }),
    );

    expect(result.reasons).toEqual([
      'token-mismatch',
      'wrong-partner',
      'credential-revoked',
      'reservation-not-active',
    ]);
  });

  it('rejects malformed clock or credential timestamps as invalid-time', () => {
    expect(evaluateRedemptionScan(input({ now: 'bad-time' })).reasons).toEqual([
      'invalid-time',
    ]);
    expect(
      evaluateRedemptionScan(
        input({ credential: credential({ expiresAt: 'bad-time' }) }),
      ).reasons,
    ).toEqual(['invalid-time']);
  });
});
