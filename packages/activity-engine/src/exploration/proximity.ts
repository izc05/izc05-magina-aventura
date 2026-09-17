import type { LocationSample } from '@magina-aventura/contracts';
import { distanceMeters } from '@magina-aventura/geo';

import type {
  ExplorationEvaluation,
  ExplorationPolicy,
  ExplorationState,
  ExplorationTarget,
  ExplorationTargetProgress,
} from './types';

const EMPTY_PROGRESS: ExplorationTargetProgress = {
  consecutiveSamples: 0,
  lastEvidenceAt: null,
};

export function createExplorationState(
  unlockedTargetIds: string[] = [],
): ExplorationState {
  return {
    progressByTarget: {},
    unlockedTargetIds: [...unlockedTargetIds],
  };
}

function resetProgress(): ExplorationTargetProgress {
  return { ...EMPTY_PROGRESS };
}

function evidenceGapSeconds(
  previousEvidenceAt: string | null,
  currentSampleAt: string,
): number | null {
  if (previousEvidenceAt === null) return null;

  return (Date.parse(currentSampleAt) - Date.parse(previousEvidenceAt)) / 1_000;
}

export function evaluateExplorationSample(
  state: ExplorationState,
  sample: LocationSample,
  targets: ExplorationTarget[],
  policy: ExplorationPolicy,
): ExplorationEvaluation {
  const progressByTarget = { ...state.progressByTarget };
  const unlockedTargetIds = [...state.unlockedTargetIds];
  const unlockedSet = new Set(unlockedTargetIds);
  const observations: ExplorationEvaluation['observations'] = [];

  for (const target of targets) {
    const currentProgress =
      progressByTarget[target.id] ?? resetProgress();

    if (unlockedSet.has(target.id)) {
      progressByTarget[target.id] = currentProgress;
      continue;
    }

    const distance = distanceMeters(sample, target);
    const reliable =
      sample.validForMetrics &&
      sample.accuracyMeters <= policy.maxAccuracyMeters &&
      distance <= target.triggerRadiusMeters;

    if (!reliable) {
      progressByTarget[target.id] = resetProgress();
      continue;
    }

    const gapSeconds = evidenceGapSeconds(
      currentProgress.lastEvidenceAt,
      sample.timestamp,
    );
    const continuesEvidence =
      gapSeconds === null || gapSeconds <= policy.maxEvidenceGapSeconds;

    const nextProgress: ExplorationTargetProgress = {
      consecutiveSamples: continuesEvidence
        ? currentProgress.consecutiveSamples + 1
        : 1,
      lastEvidenceAt: sample.timestamp,
    };
    progressByTarget[target.id] = nextProgress;

    if (nextProgress.consecutiveSamples >= policy.requiredConsecutiveSamples) {
      unlockedSet.add(target.id);
      unlockedTargetIds.push(target.id);
      observations.push({
        targetId: target.id,
        kind: target.kind,
        observedAt: sample.timestamp,
        sampleSequence: sample.sequence,
        distanceMeters: distance,
        accuracyMeters: sample.accuracyMeters,
      });
    }
  }

  return {
    state: {
      progressByTarget,
      unlockedTargetIds,
    },
    observations,
  };
}

export type {
  ExplorationEvaluation,
  ExplorationPolicy,
  ExplorationState,
  ExplorationTarget,
} from './types';
