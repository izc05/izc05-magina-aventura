import type { OliveMovement } from '../economy/olive-wallet';
import type {
  RedemptionCredential,
  RedemptionScanDecision,
} from './redemption-credential';

export interface RedemptionRecordCandidate {
  redemptionId: string;
  reservationId: string;
  credentialId: string;
  rewardId: string;
  partnerId: string;
  operatorId: string;
  redeemedAt: string;
  sourceKey: string;
}

export interface CredentialConsumptionCandidate {
  credentialId: string;
  status: 'consumed';
  consumedAt: string;
  sourceKey: string;
}

export interface StockFinalizationCandidate {
  reservationId: string;
  rewardId: string;
  quantity: 1;
  sourceKey: string;
}

export interface PhysicalRewardDeliveryInput {
  userId: string;
  redemptionId: string;
  operatorId: string;
  scanDecision: RedemptionScanDecision;
  credential: RedemptionCredential;
  reservedOlives: number;
  alreadyCommittedRedemptionIds: string[];
  redeemedAt: string;
}

export interface PhysicalRewardDeliveryPlan {
  approved: boolean;
  status: 'approved' | 'rejected' | 'already-committed';
  reasons: string[];
  oliveMovement: OliveMovement | null;
  credentialConsumption: CredentialConsumptionCandidate | null;
  stockFinalization: StockFinalizationCandidate | null;
  redemption: RedemptionRecordCandidate | null;
}

function rejected(reason: string | string[]): PhysicalRewardDeliveryPlan {
  return {
    approved: false,
    status: 'rejected',
    reasons: Array.isArray(reason) ? [...reason] : [reason],
    oliveMovement: null,
    credentialConsumption: null,
    stockFinalization: null,
    redemption: null,
  };
}

function validPositiveInteger(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && value > 0;
}

export function confirmPhysicalRewardDelivery(
  input: PhysicalRewardDeliveryInput,
): PhysicalRewardDeliveryPlan {
  const userId = input.userId.trim();
  const redemptionId = input.redemptionId.trim();
  const operatorId = input.operatorId.trim();

  if (userId.length === 0) {
    return rejected('invalid-user-id');
  }

  if (redemptionId.length === 0) {
    return rejected('invalid-redemption-id');
  }

  if (operatorId.length === 0) {
    return rejected('invalid-operator-id');
  }

  if (!Number.isFinite(Date.parse(input.redeemedAt))) {
    return rejected('invalid-redeemed-at');
  }

  if (!validPositiveInteger(input.reservedOlives)) {
    return rejected('invalid-reserved-olives');
  }

  if (input.alreadyCommittedRedemptionIds.includes(redemptionId)) {
    return {
      approved: false,
      status: 'already-committed',
      reasons: [],
      oliveMovement: null,
      credentialConsumption: null,
      stockFinalization: null,
      redemption: null,
    };
  }

  if (!input.scanDecision.valid) {
    return rejected(input.scanDecision.reasons);
  }

  if (
    input.scanDecision.credentialId !== input.credential.credentialId ||
    input.scanDecision.reservationId !== input.credential.reservationId ||
    input.scanDecision.rewardId !== input.credential.rewardId
  ) {
    return rejected('scan-credential-mismatch');
  }

  const sourcePrefix = `redemption:${redemptionId}`;

  return {
    approved: true,
    status: 'approved',
    reasons: [],
    oliveMovement: {
      userId,
      type: 'spend',
      amount: input.reservedOlives,
      sourceKey: `${sourcePrefix}:olives`,
      reservationId: input.credential.reservationId,
      occurredAt: input.redeemedAt,
    },
    credentialConsumption: {
      credentialId: input.credential.credentialId,
      status: 'consumed',
      consumedAt: input.redeemedAt,
      sourceKey: `${sourcePrefix}:credential`,
    },
    stockFinalization: {
      reservationId: input.credential.reservationId,
      rewardId: input.credential.rewardId,
      quantity: 1,
      sourceKey: `${sourcePrefix}:stock`,
    },
    redemption: {
      redemptionId,
      reservationId: input.credential.reservationId,
      credentialId: input.credential.credentialId,
      rewardId: input.credential.rewardId,
      partnerId: input.credential.partnerId,
      operatorId,
      redeemedAt: input.redeemedAt,
      sourceKey: `${sourcePrefix}:record`,
    },
  };
}
