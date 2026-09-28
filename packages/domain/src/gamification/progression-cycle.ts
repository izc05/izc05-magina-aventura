import {
  calculateVerifiedActivityXp,
  type ActivityXpAwardHistory,
  type ActivityXpCalculation,
  type ActivityXpPolicy,
  type VerifiedActivityXpInput,
} from './activity-xp';
import {
  aggregateAdventureStats,
  type AdventureAggregateStats,
  type VerifiedAdventureStatInput,
} from './adventure-stats';
import {
  evaluateBadgeEligibility,
  type BadgeDefinition,
  type EarnedBadgeCandidate,
} from './badge-eligibility';
import {
  projectActiveChallengeProgress,
  type ChallengeDefinition,
  type ChallengeProgressProjection,
  type SeasonDefinition,
} from './challenge-progress';
import {
  levelsCrossed,
  projectLevelProgress,
  type LevelDefinition,
  type LevelProgressProjection,
} from './level-progression';
import {
  buildRanking,
  type RankingEntry,
  type RankingKind,
  type RankingParticipantInput,
  type RankingScope,
  type RankingScorePolicy,
} from './ranking';

export interface ProgressionRankingPolicies {
  senderista: RankingScorePolicy;
  explorador: RankingScorePolicy;
  magina: RankingScorePolicy;
}

export interface VerifiedProgressionCycleInput {
  userId: string;
  activityXp: VerifiedActivityXpInput;
  activityStats: VerifiedAdventureStatInput;
  previousActivities: VerifiedAdventureStatInput[];
  xpAwardHistory: ActivityXpAwardHistory[];
  previousTotalXp: number;
  xpPolicy: ActivityXpPolicy;
  levels: LevelDefinition[];
  badges: BadgeDefinition[];
  unlockedBadgeSlugs: string[];
  challenges: ChallengeDefinition[];
  completedChallengeIds: string[];
  seasons: SeasonDefinition[];
  rankingParticipants: RankingParticipantInput[];
  rankingPolicies: ProgressionRankingPolicies;
  rankingScopes: RankingScope[];
}

export interface ProgressionRankingProjection {
  kind: RankingKind;
  scope: RankingScope;
  entries: RankingEntry[];
}

export interface VerifiedProgressionCycleProjection {
  xpAward: ActivityXpCalculation;
  previousLevelProgress: LevelProgressProjection;
  nextLevelProgress: LevelProgressProjection;
  crossedLevels: LevelDefinition[];
  aggregateStats: AdventureAggregateStats;
  newBadges: EarnedBadgeCandidate[];
  challengeProgress: ChallengeProgressProjection[];
  completedChallenges: ChallengeProgressProjection[];
  rankings: ProgressionRankingProjection[];
}

const RANKING_KINDS: RankingKind[] = ['senderista', 'explorador', 'magina'];
const RANKING_SCOPE_ORDER: RankingScope[] = [
  'weekly',
  'monthly',
  'season',
  'all-time',
];

function normalizedScopes(scopes: RankingScope[]): RankingScope[] {
  const requested = new Set(scopes);
  return RANKING_SCOPE_ORDER.filter((scope) => requested.has(scope));
}

function currentUserRankingParticipants(
  input: VerifiedProgressionCycleInput,
  currentActivities: VerifiedAdventureStatInput[],
): RankingParticipantInput[] {
  return [
    ...input.rankingParticipants.filter(
      (participant) => participant.userId !== input.userId,
    ),
    {
      userId: input.userId,
      activities: currentActivities,
    },
  ];
}

export function projectVerifiedProgressionCycle(
  input: VerifiedProgressionCycleInput,
): VerifiedProgressionCycleProjection {
  const xpAward = calculateVerifiedActivityXp(
    input.activityXp,
    input.xpPolicy,
    input.xpAwardHistory,
  );

  const previousLevelProgress = projectLevelProgress(
    input.previousTotalXp,
    input.levels,
  );
  const nextTotalXp = previousLevelProgress.totalXp + xpAward.totalXp;
  const nextLevelProgress = projectLevelProgress(nextTotalXp, input.levels);
  const crossedLevels = levelsCrossed(
    previousLevelProgress.totalXp,
    nextLevelProgress.totalXp,
    input.levels,
  );

  const allActivities = [...input.previousActivities, input.activityStats];
  const aggregateStats = aggregateAdventureStats(allActivities);
  const newBadges = evaluateBadgeEligibility(
    aggregateStats,
    input.badges,
    input.unlockedBadgeSlugs,
  );

  const challengeProgress = projectActiveChallengeProgress(
    allActivities,
    input.challenges,
    input.seasons,
    input.activityXp.verifiedAt,
    input.completedChallengeIds,
  );
  const completedChallenges = challengeProgress.filter(
    (challenge) => challenge.completed,
  );

  const participants = currentUserRankingParticipants(input, allActivities);
  const rankings: ProgressionRankingProjection[] = [];

  for (const kind of RANKING_KINDS) {
    for (const scope of normalizedScopes(input.rankingScopes)) {
      rankings.push({
        kind,
        scope,
        entries: buildRanking(
          participants,
          kind,
          scope,
          input.rankingPolicies[kind],
          input.activityXp.verifiedAt,
          input.seasons,
        ),
      });
    }
  }

  return {
    xpAward,
    previousLevelProgress,
    nextLevelProgress,
    crossedLevels,
    aggregateStats,
    newBadges,
    challengeProgress,
    completedChallenges,
    rankings,
  };
}
