export type RedemptionCredentialStatus =
  | 'active'
  | 'consumed'
  | 'revoked'
  | 'expired';

export interface RedemptionCredential {
  credentialId: string;
  reservationId: string;
  rewardId: string;
  partnerId: string;
  tokenFingerprint: string;
  status: RedemptionCredentialStatus;
  issuedAt: string;
  expiresAt: string;
}

export interface RedemptionScanInput {
  credential: RedemptionCredential;
  scannedTokenFingerprint: string;
  partnerId: string;
  now: string;
  reservationStatus: 'reserved' | 'redeemed' | 'cancelled' | 'expired';
}

export interface RedemptionScanDecision {
  valid: boolean;
  reasons: string[];
  credentialId: string;
  reservationId: string;
  rewardId: string;
}

function validTimestamp(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function evaluateRedemptionScan(
  input: RedemptionScanInput,
): RedemptionScanDecision {
  const reasons: string[] = [];
  const now = validTimestamp(input.now);
  const issuedAt = validTimestamp(input.credential.issuedAt);
  const expiresAt = validTimestamp(input.credential.expiresAt);

  if (now === null || issuedAt === null || expiresAt === null || expiresAt < issuedAt) {
    reasons.push('invalid-time');
  } else {
    if (input.scannedTokenFingerprint !== input.credential.tokenFingerprint) {
      reasons.push('token-mismatch');
    }

    if (input.partnerId !== input.credential.partnerId) {
      reasons.push('wrong-partner');
    }

    if (input.credential.status === 'consumed') {
      reasons.push('credential-consumed');
    } else if (input.credential.status === 'revoked') {
      reasons.push('credential-revoked');
    } else if (input.credential.status === 'expired' || now > expiresAt) {
      reasons.push('credential-expired');
    }

    if (input.reservationStatus !== 'reserved') {
      reasons.push('reservation-not-active');
    }
  }

  return {
    valid: reasons.length === 0,
    reasons,
    credentialId: input.credential.credentialId,
    reservationId: input.credential.reservationId,
    rewardId: input.credential.rewardId,
  };
}
