export interface VerifiedActivityXpInput {
  activityId: string;
  routeId: string;
  municipalityId: string | null;
  verifiedAt: string;
  distanceMeters: number;
  ascentMeters: number;
  newDiscoveryCount: number;
}

export interface ActivityXpPolicy {
  baseVerifiedXp: number;
  distanceUnitMeters: number;
  xpPerDistanceUnit: number;
  ascentUnitMeters: number;
  xpPerAscentUnit: number;
  xpPerNewDiscovery: number;
  firstRouteBonusXp: number;
  firstMunicipalityBonusXp: number;
  repeatRouteWindowHours: number;
  maxRewardedSameRouteInWindow: number;
}

export interface ActivityXpAwardHistory {
  activityId: string;
  routeId: string;
  municipalityId: string | null;
  verifiedAt: string;
}

export type ActivityXpRejectionReason =
  | 'duplicate-activity'
  | 'repeat-route-limit';

export interface ActivityXpBreakdown {
  base: number;
  distance: number;
  ascent: number;
  discoveries: number;
  firstRouteBonus: number;
  firstMunicipalityBonus: number;
}

export interface ActivityXpCalculation {
  eligible: boolean;
  rejectionReason: ActivityXpRejectionReason | null;
  sourceKey: string;
  breakdown: ActivityXpBreakdown;
  totalXp: number;
}

const EMPTY_BREAKDOWN: ActivityXpBreakdown = {
  base: 0,
  distance: 0,
  ascent: 0,
  discoveries: 0,
  firstRouteBonus: 0,
  firstMunicipalityBonus: 0,
};

function nonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function positiveUnit(value: number): number | null {
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

function units(value: number, unitSize: number): number {
  const normalizedUnit = positiveUnit(unitSize);
  if (normalizedUnit === null) {
    return 0;
  }

  const normalizedValue = Math.max(0, Number.isFinite(value) ? value : 0);
  return Math.floor(normalizedValue / normalizedUnit);
}

function rejected(
  sourceKey: string,
  reason: ActivityXpRejectionReason,
): ActivityXpCalculation {
  return {
    eligible: false,
    rejectionReason: reason,
    sourceKey,
    breakdown: { ...EMPTY_BREAKDOWN },
    totalXp: 0,
  };
}

function isInsideRepeatWindow(
  priorVerifiedAt: string,
  currentVerifiedAt: string,
  windowHours: number,
): boolean {
  const priorTime = Date.parse(priorVerifiedAt);
  const currentTime = Date.parse(currentVerifiedAt);

  if (!Number.isFinite(priorTime) || !Number.isFinite(currentTime)) {
    return false;
  }

  if (priorTime > currentTime) {
    return false;
  }

  const windowMs = Math.max(0, windowHours) * 60 * 60 * 1000;
  return currentTime - priorTime <= windowMs;
}

export function calculateVerifiedActivityXp(
  input: VerifiedActivityXpInput,
  policy: ActivityXpPolicy,
  history: ActivityXpAwardHistory[],
): ActivityXpCalculation {
  const sourceKey = `activity:${input.activityId}:verified-xp`;

  if (history.some((entry) => entry.activityId === input.activityId)) {
    return rejected(sourceKey, 'duplicate-activity');
  }

  const sameRouteInsideWindow = history.filter(
    (entry) =>
      entry.routeId === input.routeId &&
      isInsideRepeatWindow(
        entry.verifiedAt,
        input.verifiedAt,
        policy.repeatRouteWindowHours,
      ),
  ).length;

  const repeatLimit = nonNegativeInteger(
    policy.maxRewardedSameRouteInWindow,
  );

  if (sameRouteInsideWindow >= repeatLimit) {
    return rejected(sourceKey, 'repeat-route-limit');
  }

  const firstRoute = !history.some((entry) => entry.routeId === input.routeId);
  const firstMunicipality =
    input.municipalityId !== null &&
    !history.some((entry) => entry.municipalityId === input.municipalityId);

  const breakdown: ActivityXpBreakdown = {
    base: nonNegativeInteger(policy.baseVerifiedXp),
    distance:
      units(input.distanceMeters, policy.distanceUnitMeters) *
      nonNegativeInteger(policy.xpPerDistanceUnit),
    ascent:
      units(input.ascentMeters, policy.ascentUnitMeters) *
      nonNegativeInteger(policy.xpPerAscentUnit),
    discoveries:
      nonNegativeInteger(input.newDiscoveryCount) *
      nonNegativeInteger(policy.xpPerNewDiscovery),
    firstRouteBonus: firstRoute
      ? nonNegativeInteger(policy.firstRouteBonusXp)
      : 0,
    firstMunicipalityBonus: firstMunicipality
      ? nonNegativeInteger(policy.firstMunicipalityBonusXp)
      : 0,
  };

  const totalXp = Object.values(breakdown).reduce(
    (total, component) => total + component,
    0,
  );

  return {
    eligible: true,
    rejectionReason: null,
    sourceKey,
    breakdown,
    totalXp,
  };
}
