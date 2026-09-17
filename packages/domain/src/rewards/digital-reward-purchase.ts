import type { OliveMovement } from '../economy/olive-wallet';
import type {
  RewardCatalogItem,
  RewardEligibilityDecision,
} from './reward-catalog';

export interface DigitalRewardPurchaseInput {
  userId: string;
  purchaseId: string;
  item: RewardCatalogItem;
  eligibility: RewardEligibilityDecision;
  alreadyOwnedRewardIds: string[];
  alreadyCommittedPurchaseIds: string[];
  occurredAt: string;
}

export interface DigitalRewardEntitlementCandidate {
  userId: string;
  rewardId: string;
  sourceKey: string;
  grantedAt: string;
}

export interface DigitalRewardPurchasePlan {
  approved: boolean;
  status: 'approved' | 'rejected' | 'already-committed';
  reasons: string[];
  walletMovement: OliveMovement | null;
  entitlement: DigitalRewardEntitlementCandidate | null;
}

function rejected(reason: string | string[]): DigitalRewardPurchasePlan {
  return {
    approved: false,
    status: 'rejected',
    reasons: Array.isArray(reason) ? [...reason] : [reason],
    walletMovement: null,
    entitlement: null,
  };
}

function alreadyCommitted(): DigitalRewardPurchasePlan {
  return {
    approved: false,
    status: 'already-committed',
    reasons: [],
    walletMovement: null,
    entitlement: null,
  };
}

export function buildDigitalRewardPurchasePlan(
  input: DigitalRewardPurchaseInput,
): DigitalRewardPurchasePlan {
  const userId = input.userId.trim();
  const purchaseId = input.purchaseId.trim();

  if (userId.length === 0) {
    return rejected('invalid-user-id');
  }

  if (purchaseId.length === 0) {
    return rejected('invalid-purchase-id');
  }

  if (!Number.isFinite(Date.parse(input.occurredAt))) {
    return rejected('invalid-occurred-at');
  }

  if (input.alreadyCommittedPurchaseIds.includes(purchaseId)) {
    return alreadyCommitted();
  }

  if (input.item.kind !== 'digital') {
    return rejected('not-digital-reward');
  }

  if (!input.eligibility.eligible) {
    return rejected(input.eligibility.reasons);
  }

  if (
    !input.item.repeatable &&
    input.alreadyOwnedRewardIds.includes(input.item.id)
  ) {
    return rejected('already-owned');
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
    walletMovement: {
      userId,
      type: 'spend',
      amount: input.item.priceOlives,
      sourceKey: `purchase:${purchaseId}:spend`,
      reservationId: null,
      occurredAt: input.occurredAt,
    },
    entitlement: {
      userId,
      rewardId: input.item.id,
      sourceKey: `purchase:${purchaseId}:entitlement`,
      grantedAt: input.occurredAt,
    },
  };
}
