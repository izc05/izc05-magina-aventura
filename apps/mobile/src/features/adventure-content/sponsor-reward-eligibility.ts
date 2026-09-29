import type {
  AdventureSessionTrust,
  SponsorRewardDefinition,
} from '@magina-aventura/contracts';

export type SponsorRewardIneligibilityReason =
  | 'qa-simulated'
  | 'physical-gps-not-validated'
  | 'inactive'
  | 'outside-validity-window'
  | 'route-not-eligible'
  | 'missing-completion-fact';

export interface SponsorRewardEligibility {
  eligible: boolean;
  reason: SponsorRewardIneligibilityReason | null;
  /**
   * Client eligibility is never equivalent to redemption authorization.
   * Production redemption still requires a server-issued one-time grant.
   */
  requiresServerAuthorization: true;
}

function rejected(
  reason: SponsorRewardIneligibilityReason,
): SponsorRewardEligibility {
  return {
    eligible: false,
    reason,
    requiresServerAuthorization: true,
  };
}

export function evaluateSponsorRewardEligibility(
  reward: SponsorRewardDefinition,
  input: {
    routeId: string;
    completedFacts: readonly string[];
    now: string;
    trust: AdventureSessionTrust;
  },
): SponsorRewardEligibility {
  if (input.trust.qaSimulated) return rejected('qa-simulated');
  if (!input.trust.physicalGpsValidated) {
    return rejected('physical-gps-not-validated');
  }
  if (!reward.active) return rejected('inactive');

  const nowMs = Date.parse(input.now);
  const validFromMs = Date.parse(reward.validFrom);
  const validUntilMs = Date.parse(reward.validUntil);

  if (
    !Number.isFinite(nowMs) ||
    nowMs < validFromMs ||
    nowMs > validUntilMs
  ) {
    return rejected('outside-validity-window');
  }

  if (!reward.eligibleRouteIds.includes(input.routeId)) {
    return rejected('route-not-eligible');
  }

  const facts = new Set(input.completedFacts);
  if (!reward.requiredCompletionFacts.every((fact) => facts.has(fact))) {
    return rejected('missing-completion-fact');
  }

  return {
    eligible: true,
    reason: null,
    requiresServerAuthorization: true,
  };
}
