export type RewardValidationCheck =
  | 'activity-verification'
  | 'route-integrity'
  | 'location-integrity'
  | 'account-eligibility'
  | 'abuse-screen';

export type RewardValidationStatus =
  | 'approved'
  | 'rejected'
  | 'already-committed';

export type RewardValidationReason =
  | 'invalid-user-id'
  | 'invalid-activity-id'
  | 'invalid-verified-at'
  | 'activity-already-committed'
  | `required-check-failed:${RewardValidationCheck}`;

export interface RewardValidationPolicy {
  requiredChecks: RewardValidationCheck[];
}

export interface RewardValidationInput {
  userId: string;
  activityId: string;
  verifiedAt: string;
  evidence: Partial<Record<RewardValidationCheck, boolean>>;
  policy: RewardValidationPolicy;
  alreadyCommittedActivityIds: string[];
}

export interface RewardValidationDecision {
  status: RewardValidationStatus;
  approved: boolean;
  validationKey: string;
  failedChecks: RewardValidationCheck[];
  reasons: RewardValidationReason[];
}

const CHECK_ORDER: RewardValidationCheck[] = [
  'activity-verification',
  'route-integrity',
  'location-integrity',
  'account-eligibility',
  'abuse-screen',
];

function validationKey(activityId: string): string {
  const normalized = activityId.trim();
  return `reward-validation:${normalized.length > 0 ? normalized : 'invalid-activity'}`;
}

function rejected(
  key: string,
  reason: RewardValidationReason,
): RewardValidationDecision {
  return {
    status: 'rejected',
    approved: false,
    validationKey: key,
    failedChecks: [],
    reasons: [reason],
  };
}

export function evaluateRewardValidation(
  input: RewardValidationInput,
): RewardValidationDecision {
  const key = validationKey(input.activityId);

  if (input.userId.trim().length === 0) {
    return rejected(key, 'invalid-user-id');
  }

  if (input.activityId.trim().length === 0) {
    return rejected(key, 'invalid-activity-id');
  }

  if (!Number.isFinite(Date.parse(input.verifiedAt))) {
    return rejected(key, 'invalid-verified-at');
  }

  if (input.alreadyCommittedActivityIds.includes(input.activityId)) {
    return {
      status: 'already-committed',
      approved: false,
      validationKey: key,
      failedChecks: [],
      reasons: ['activity-already-committed'],
    };
  }

  const requested = new Set(input.policy.requiredChecks);
  const requiredChecks = CHECK_ORDER.filter((check) => requested.has(check));
  const failedChecks = requiredChecks.filter(
    (check) => input.evidence[check] !== true,
  );

  if (failedChecks.length > 0) {
    return {
      status: 'rejected',
      approved: false,
      validationKey: key,
      failedChecks,
      reasons: failedChecks.map(
        (check) => `required-check-failed:${check}` as const,
      ),
    };
  }

  return {
    status: 'approved',
    approved: true,
    validationKey: key,
    failedChecks: [],
    reasons: [],
  };
}
