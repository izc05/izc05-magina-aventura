import type { OliveMovement } from '../economy/olive-wallet';

export type ReservationReleaseReason = 'cancelled' | 'expired';

export interface StockReleaseCandidate {
  reservationId: string;
  rewardId: string;
  quantity: 1;
  sourceKey: string;
}

export interface CredentialTerminalCandidate {
  credentialId: string;
  status: 'revoked' | 'expired';
  occurredAt: string;
  sourceKey: string;
}

export interface PhysicalRewardReleaseInput {
  userId: string;
  reservationId: string;
  rewardId: string;
  credentialId: string;
  reservedOlives: number;
  reason: ReservationReleaseReason;
  reservationStatus: 'reserved' | 'redeemed' | 'cancelled' | 'expired';
  occurredAt: string;
}

export interface PhysicalRewardReleasePlan {
  approved: boolean;
  reasons: string[];
  oliveMovement: OliveMovement | null;
  stockRelease: StockReleaseCandidate | null;
  credentialUpdate: CredentialTerminalCandidate | null;
}

function rejected(reason: string): PhysicalRewardReleasePlan {
  return {
    approved: false,
    reasons: [reason],
    oliveMovement: null,
    stockRelease: null,
    credentialUpdate: null,
  };
}

function positiveInteger(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && value > 0;
}

export function buildPhysicalRewardReleasePlan(
  input: PhysicalRewardReleaseInput,
): PhysicalRewardReleasePlan {
  const userId = input.userId.trim();
  const reservationId = input.reservationId.trim();
  const rewardId = input.rewardId.trim();
  const credentialId = input.credentialId.trim();

  if (userId.length === 0) {
    return rejected('invalid-user-id');
  }

  if (reservationId.length === 0) {
    return rejected('invalid-reservation-id');
  }

  if (rewardId.length === 0) {
    return rejected('invalid-reward-id');
  }

  if (credentialId.length === 0) {
    return rejected('invalid-credential-id');
  }

  if (!positiveInteger(input.reservedOlives)) {
    return rejected('invalid-reserved-olives');
  }

  if (!Number.isFinite(Date.parse(input.occurredAt))) {
    return rejected('invalid-occurred-at');
  }

  if (input.reservationStatus !== 'reserved') {
    return rejected('reservation-not-active');
  }

  const sourcePrefix = `reservation:${reservationId}`;

  return {
    approved: true,
    reasons: [],
    oliveMovement: {
      userId,
      type: 'release',
      amount: input.reservedOlives,
      sourceKey: `${sourcePrefix}:release:${input.reason}`,
      reservationId,
      occurredAt: input.occurredAt,
    },
    stockRelease: {
      reservationId,
      rewardId,
      quantity: 1,
      sourceKey: `${sourcePrefix}:stock-release:${input.reason}`,
    },
    credentialUpdate: {
      credentialId,
      status: input.reason === 'cancelled' ? 'revoked' : 'expired',
      occurredAt: input.occurredAt,
      sourceKey: `${sourcePrefix}:credential:${input.reason}`,
    },
  };
}
