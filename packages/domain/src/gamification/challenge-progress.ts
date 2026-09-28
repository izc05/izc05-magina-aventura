import {
  aggregateAdventureStats,
  type AdventureAggregateStats,
  type VerifiedAdventureStatInput,
} from './adventure-stats';

export interface SeasonDefinition {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

export type ChallengeScope = 'daily' | 'weekly' | 'municipal' | 'season';

export type ChallengeMetric =
  | 'completedActivities'
  | 'distanceMeters'
  | 'ascentMeters'
  | 'discoveriesUnlocked'
  | 'checkpointsReached'
  | 'distinctRoutes'
  | 'distinctMunicipalities';

export interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  scope: ChallengeScope;
  metric: ChallengeMetric;
  target: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  municipalityId: string | null;
  seasonId: string | null;
}

export interface ChallengeProgressProjection {
  challengeId: string;
  title: string;
  description: string;
  scope: ChallengeScope;
  metric: ChallengeMetric;
  current: number;
  target: number;
  percentage: number;
  completed: boolean;
  sourceKey: string;
}

function timestamp(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validWindow(startsAt: string, endsAt: string): [number, number] | null {
  const start = timestamp(startsAt);
  const end = timestamp(endsAt);

  if (start === null || end === null || end <= start) {
    return null;
  }

  return [start, end];
}

function activeAt(atMs: number, startsAt: string, endsAt: string): boolean {
  const window = validWindow(startsAt, endsAt);
  return window !== null && window[0] <= atMs && atMs < window[1];
}

export function resolveActiveSeason(
  at: string,
  seasons: SeasonDefinition[],
): SeasonDefinition | null {
  const atMs = timestamp(at);
  if (atMs === null) {
    return null;
  }

  const candidates = seasons.filter(
    (season) => season.active && activeAt(atMs, season.startsAt, season.endsAt),
  );

  candidates.sort((left, right) => {
    const leftStart = timestamp(left.startsAt) ?? Number.NEGATIVE_INFINITY;
    const rightStart = timestamp(right.startsAt) ?? Number.NEGATIVE_INFINITY;

    if (leftStart !== rightStart) {
      return rightStart - leftStart;
    }

    return left.id.localeCompare(right.id);
  });

  return candidates[0] ?? null;
}

function normalizedTarget(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

function seasonForChallenge(
  challenge: ChallengeDefinition,
  seasons: SeasonDefinition[],
  asOfMs: number,
): SeasonDefinition | null {
  if (challenge.scope !== 'season') {
    return null;
  }

  if (challenge.seasonId === null) {
    return null;
  }

  return (
    seasons.find(
      (season) =>
        season.id === challenge.seasonId &&
        season.active &&
        activeAt(asOfMs, season.startsAt, season.endsAt),
    ) ?? null
  );
}

function activitiesForChallenge(
  activities: VerifiedAdventureStatInput[],
  challenge: ChallengeDefinition,
  asOfMs: number,
  season: SeasonDefinition | null,
): VerifiedAdventureStatInput[] {
  const challengeWindow = validWindow(challenge.startsAt, challenge.endsAt);
  if (challengeWindow === null) {
    return [];
  }

  let effectiveStart = challengeWindow[0];
  let effectiveEnd = challengeWindow[1];

  if (season !== null) {
    const seasonWindow = validWindow(season.startsAt, season.endsAt);
    if (seasonWindow === null) {
      return [];
    }
    effectiveStart = Math.max(effectiveStart, seasonWindow[0]);
    effectiveEnd = Math.min(effectiveEnd, seasonWindow[1]);
  }

  return activities.filter((activity) => {
    const verifiedAt = timestamp(activity.verifiedAt);
    if (
      verifiedAt === null ||
      verifiedAt < effectiveStart ||
      verifiedAt >= effectiveEnd ||
      verifiedAt > asOfMs
    ) {
      return false;
    }

    if (
      challenge.scope === 'municipal' &&
      activity.municipalityId !== challenge.municipalityId
    ) {
      return false;
    }

    return true;
  });
}

function metricValue(
  stats: AdventureAggregateStats,
  metric: ChallengeMetric,
): number {
  return stats[metric];
}

export function projectActiveChallengeProgress(
  activities: VerifiedAdventureStatInput[],
  challenges: ChallengeDefinition[],
  seasons: SeasonDefinition[],
  asOf: string,
  completedChallengeIds: string[] = [],
): ChallengeProgressProjection[] {
  const asOfMs = timestamp(asOf);
  if (asOfMs === null) {
    return [];
  }

  const completedIds = new Set(completedChallengeIds);
  const projections: ChallengeProgressProjection[] = [];

  for (const challenge of challenges) {
    if (
      !challenge.active ||
      completedIds.has(challenge.id) ||
      !activeAt(asOfMs, challenge.startsAt, challenge.endsAt)
    ) {
      continue;
    }

    if (challenge.scope === 'municipal' && challenge.municipalityId === null) {
      continue;
    }

    const season = seasonForChallenge(challenge, seasons, asOfMs);
    if (challenge.scope === 'season' && season === null) {
      continue;
    }

    const stats = aggregateAdventureStats(
      activitiesForChallenge(activities, challenge, asOfMs, season),
    );
    const current = metricValue(stats, challenge.metric);
    const target = normalizedTarget(challenge.target);
    const percentage = Math.min(100, Math.floor((current / target) * 100));

    projections.push({
      challengeId: challenge.id,
      title: challenge.title,
      description: challenge.description,
      scope: challenge.scope,
      metric: challenge.metric,
      current,
      target,
      percentage,
      completed: current >= target,
      sourceKey: `challenge:${challenge.id}:completion`,
    });
  }

  return projections.sort((left, right) =>
    left.challengeId.localeCompare(right.challengeId),
  );
}
