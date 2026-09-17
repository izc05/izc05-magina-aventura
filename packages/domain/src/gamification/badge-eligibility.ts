import type { AdventureAggregateStats } from './adventure-stats';

export type BadgeMetric =
  | 'completedActivities'
  | 'distanceMeters'
  | 'ascentMeters'
  | 'discoveriesUnlocked'
  | 'checkpointsReached'
  | 'distinctRoutes'
  | 'distinctMunicipalities';

export interface BadgeCriterion {
  metric: BadgeMetric;
  minimum: number;
}

export interface BadgeDefinition {
  slug: string;
  name: string;
  description: string;
  active: boolean;
  criteria: BadgeCriterion[];
}

export interface EarnedBadgeCandidate {
  slug: string;
  name: string;
  description: string;
  sourceKey: string;
}

function normalizedMinimum(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function criterionPasses(
  stats: AdventureAggregateStats,
  criterion: BadgeCriterion,
): boolean {
  return stats[criterion.metric] >= normalizedMinimum(criterion.minimum);
}

export function evaluateBadgeEligibility(
  stats: AdventureAggregateStats,
  definitions: BadgeDefinition[],
  alreadyUnlockedSlugs: string[] = [],
): EarnedBadgeCandidate[] {
  const unlocked = new Set(alreadyUnlockedSlugs);
  const candidates: EarnedBadgeCandidate[] = [];

  for (const definition of definitions) {
    if (
      !definition.active ||
      unlocked.has(definition.slug) ||
      definition.criteria.length === 0
    ) {
      continue;
    }

    if (!definition.criteria.every((criterion) => criterionPasses(stats, criterion))) {
      continue;
    }

    candidates.push({
      slug: definition.slug,
      name: definition.name,
      description: definition.description,
      sourceKey: `badge:${definition.slug}:aggregate-stats`,
    });
  }

  return candidates.sort((left, right) => left.slug.localeCompare(right.slug));
}
