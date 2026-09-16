import type { OliveMovement } from '../economy/olive-wallet';
import type {
  RewardCatalogItem,
  RewardEligibilityDecision,
} from './reward-catalog';

export type PhysicalRewardKind = 'coupon' | 'experience' | 'physical';

export interface StockReservationCandidate {
  rewardId: string;
  reservationId: string;
  quantity: 1;
  sourceKey: string;
}

export interface PhysicalRewardReservationInput {
  userId: string;
  reservationId: string;
  item: RewardCatalogItem;
  eligibility: RewardEligibilityDecision;
  alreadyCommittedReservationIds: string[];
  occurredAt: string;
}

export interface PhysicalRewardReservationPlan {
  approved: boolean;
  status: 'approved' | 'rejected' | 'already-committed';
  reasons: string[];
  oliveMovement: OliveMovement | null;
  stockReservation: StockReservationCandidate | null;
}

function rejected(reason: string | string[]): PhysicalRewardReservationPlan {
  return {
    approved: false,
    status: 'rejected',
    reasons: Array.isArray(reason) ? [...reason] : [reason],
    oliveMovement: null,
    stockReservation: null,
  };
}

export function buildPhysicalRewardReservationPlan(
  input: PhysicalRewardReservationInput,
): PhysicalRewardReservationPlan {
  const userId = input.userId.trim();
  const reservationId = input.reservationId.trim();

  if (userId.length === 0) {
    return rejected('invalid-user-id');
  }

  if (reservationId.length === 0) {
    return rejected('invalid-reservation-id');
  }

  if (!Number.isFinite(Date.parse(input.occurredAt))) {
    return rejected('invalid-occurred-at');
  }

  if (input.alreadyCommittedReservationIds.includes(reservationId)) {
    return {
      approved: false,
      status: 'already-committed',
      reasons: [],
      oliveMovement: null,
      stockReservation: null,
    };
  }

  if (input.item.kind === 'digital') {
    return rejected('digital-reward-not-reservable');
  }

  if (!input.eligibility.eligible) {
    return rejected(input.eligibility.reasons);
  }

  if (
    !Number.isFinite(input.item.priceOlives) ||
    !Number.isInteger(input.item.priceOlives) ||
    input.item.priceOlives <= 0
  ) {
    return rejected('invalid-price');
  }

  return {
    approved: true,
    status: 'approved',
    reasons: [],
    oliveMovement: {
      userId,
      type: 'reserve',
      amount: input.item.priceOlives,
      sourceKey: `reservation:${reservationId}:olives`,
      reservationId,
      occurredAt: input.occurredAt,
    },
    stockReservation: {
      rewardId: input.item.id,
      reservationId,
      quantity: 1,
      sourceKey: `reservation:${reservationId}:stock`,
    },
  };
}
