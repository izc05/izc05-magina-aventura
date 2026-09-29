import {
  aggregateAdventureStats,
  type AdventureAggregateStats,
  type VerifiedAdventureStatInput,
} from './adventure-stats';
import {
  resolveActiveSeason,
  type SeasonDefinition,
} from './challenge-progress';

export type RankingScope = 'weekly' | 'monthly' | 'season' | 'all-time';
export type RankingKind = 'senderista' | 'explorador' | 'magina';
export type RankingMetric =
  | 'completedActivities'
  | 'distanceMeters'
  | 'ascentMeters'
  | 'discoveriesUnlocked'
  | 'checkpointsReached'
  | 'distinctRoutes'
  | 'distinctMunicipalities';

export interface RankingScorePolicy {
  kind: RankingKind;
  weights: Partial<Record<RankingMetric, number>>;
  maxCountedSameRoute: number | null;
}

export interface RankingParticipantInput {
  userId: string;
  activities: VerifiedAdventureStatInput[];
}

export interface RankingWindow {
  scope: RankingScope;
  startsAt: string | null;
  endsAt: string | null;
  seasonId: string | null;
}

export interface RankingEntry {
  userId: string;
  rank: number;
  score: number;
  stats: AdventureAggregateStats;
}

const RANKING_METRICS: RankingMetric[] = [
  'completedActivities',
  'distanceMeters',
  'ascentMeters',
  'discoveriesUnlocked',
  'checkpointsReached',
  'distinctRoutes',
  'distinctMunicipalities',
];

function timestamp(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function resolveRankingWindow(
  scope: RankingScope,
  asOf: string,
  seasons: SeasonDefinition[],
): RankingWindow | null {
  const asOfMs = timestamp(asOf);
  if (asOfMs === null) {
    return null;
  }

  const date = new Date(asOfMs);

  if (scope === 'all-time') {
    return {
      scope,
      startsAt: null,
      endsAt: null,
      seasonId: null,
    };
  }

  if (scope === 'season') {
    const season = resolveActiveSeason(asOf, seasons);
    if (season === null) {
      return null;
    }

    return {
      scope,
      startsAt: season.startsAt,
      endsAt: season.endsAt,
      seasonId: season.id,
    };
  }

  if (scope === 'monthly') {
    const startsAt = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
    const endsAt = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);

    return {
      scope,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      seasonId: null,
    };
  }

  const utcDayStart = startOfUtcDay(date);
  const day = date.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  const startsAt = utcDayStart - daysSinceMonday * 24 * 60 * 60 * 1000;
  const endsAt = startsAt + 7 * 24 * 60 * 60 * 1000;

  return {
    scope,
    startsAt: new Date(startsAt).toISOString(),
    endsAt: new Date(endsAt).toISOString(),
    seasonId: null,
  };
}

function uniqueActivities(
  activities: VerifiedAdventureStatInput[],
): VerifiedAdventureStatInput[] {
  const sorted = [...activities].sort((left, right) => {
    const leftTime = timestamp(left.verifiedAt) ?? Number.POSITIVE_INFINITY;
    const rightTime = timestamp(right.verifiedAt) ?? Number.POSITIVE_INFINITY;

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.activityId.localeCompare(right.activityId);
  });

  const seen = new Set<string>();
  const result: VerifiedAdventureStatInput[] = [];

  for (const activity of sorted) {
    if (seen.has(activity.activityId)) {
      continue;
    }

    seen.add(activity.activityId);
    result.push(activity);
  }

  return result;
}

function normalizeRouteCap(value: number | null): number | null {
  if (value === null) {
    return null;
  }

  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

function activitiesForRanking(
  activities: VerifiedAdventureStatInput[],
  window: RankingWindow,
  asOfMs: number,
  maxCountedSameRoute: number | null,
): VerifiedAdventureStatInput[] {
  const startsAt = window.startsAt === null ? null : timestamp(window.startsAt);
  const endsAt = window.endsAt === null ? null : timestamp(window.endsAt);
  const routeCap = normalizeRouteCap(maxCountedSameRoute);
  const routeCounts = new Map<string, number>();
  const result: VerifiedAdventureStatInput[] = [];

  for (const activity of uniqueActivities(activities)) {
    const verifiedAt = timestamp(activity.verifiedAt);
    if (verifiedAt === null || verifiedAt > asOfMs) {
      continue;
    }

    if (startsAt !== null && verifiedAt < startsAt) {
      continue;
    }

    if (endsAt !== null && verifiedAt >= endsAt) {
      continue;
    }

    if (routeCap !== null) {
      const count = routeCounts.get(activity.routeId) ?? 0;
      if (count >= routeCap) {
        continue;
      }
      routeCounts.set(activity.routeId, count + 1);
    }

    result.push(activity);
  }

  return result;
}

function normalizeWeight(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return value;
}

function calculateScore(
  stats: AdventureAggregateStats,
  policy: RankingScorePolicy,
): number {
  const total = RANKING_METRICS.reduce((sum, metric) => {
    return sum + stats[metric] * normalizeWeight(policy.weights[metric]);
  }, 0);

  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.floor(total);
}

export function buildRanking(
  participants: RankingParticipantInput[],
  kind: RankingKind,
  scope: RankingScope,
  policy: RankingScorePolicy,
  asOf: string,
  seasons: SeasonDefinition[],
): RankingEntry[] {
  if (policy.kind !== kind) {
    return [];
  }

  const asOfMs = timestamp(asOf);
  const window = resolveRankingWindow(scope, asOf, seasons);
  if (asOfMs === null || window === null) {
    return [];
  }

  const unranked = participants
    .map((participant) => {
      const scopedActivities = activitiesForRanking(
        participant.activities,
        window,
        asOfMs,
        policy.maxCountedSameRoute,
      );
      const stats = aggregateAdventureStats(scopedActivities);

      if (stats.completedActivities === 0) {
        return null;
      }

      return {
        userId: participant.userId,
        rank: 0,
        score: calculateScore(stats, policy),
        stats,
      } satisfies RankingEntry;
    })
    .filter((entry): entry is RankingEntry => entry !== null)
    .sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }

      return left.userId.localeCompare(right.userId);
    });

  let previousScore: number | null = null;
  let previousRank = 0;

  return unranked.map((entry, index) => {
    const rank = previousScore === entry.score ? previousRank : index + 1;
    previousScore = entry.score;
    previousRank = rank;

    return {
      ...entry,
      rank,
    };
  });
}
