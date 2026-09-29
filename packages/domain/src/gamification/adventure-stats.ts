export interface VerifiedAdventureStatInput {
  activityId: string;
  routeId: string;
  municipalityId: string | null;
  verifiedAt: string;
  distanceMeters: number;
  ascentMeters: number;
  discoveriesUnlocked: number;
  checkpointsReached: number;
}

export interface AdventureAggregateStats {
  completedActivities: number;
  distanceMeters: number;
  ascentMeters: number;
  discoveriesUnlocked: number;
  checkpointsReached: number;
  distinctRoutes: number;
  distinctMunicipalities: number;
  routeIds: string[];
  municipalityIds: string[];
}

function normalizedMetric(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

export function aggregateAdventureStats(
  activities: VerifiedAdventureStatInput[],
): AdventureAggregateStats {
  const seenActivityIds = new Set<string>();
  const routeIds = new Set<string>();
  const municipalityIds = new Set<string>();

  let completedActivities = 0;
  let distanceMeters = 0;
  let ascentMeters = 0;
  let discoveriesUnlocked = 0;
  let checkpointsReached = 0;

  for (const activity of activities) {
    if (seenActivityIds.has(activity.activityId)) {
      continue;
    }

    seenActivityIds.add(activity.activityId);
    completedActivities += 1;
    distanceMeters += normalizedMetric(activity.distanceMeters);
    ascentMeters += normalizedMetric(activity.ascentMeters);
    discoveriesUnlocked += normalizedMetric(activity.discoveriesUnlocked);
    checkpointsReached += normalizedMetric(activity.checkpointsReached);

    routeIds.add(activity.routeId);
    if (activity.municipalityId !== null) {
      municipalityIds.add(activity.municipalityId);
    }
  }

  const sortedRouteIds = [...routeIds].sort((left, right) =>
    left.localeCompare(right),
  );
  const sortedMunicipalityIds = [...municipalityIds].sort((left, right) =>
    left.localeCompare(right),
  );

  return {
    completedActivities,
    distanceMeters,
    ascentMeters,
    discoveriesUnlocked,
    checkpointsReached,
    distinctRoutes: sortedRouteIds.length,
    distinctMunicipalities: sortedMunicipalityIds.length,
    routeIds: sortedRouteIds,
    municipalityIds: sortedMunicipalityIds,
  };
}
