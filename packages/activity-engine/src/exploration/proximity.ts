import type { LocationSample } from '@magina-aventura/contracts';
import { distanceMeters } from '@magina-aventura/geo';

import {
  explorationTargetKey,
  type ExplorationEvaluation,
  type ExplorationPolicy,
  type ExplorationState,
  type ExplorationTarget,
  type ExplorationTargetProgress,
} from './types';

const EMPTY_PROGRESS: ExplorationTargetProgress = {
  consecutiveSamples: 0,
  lastEvidenceAt: null,
};

export const EXPLORATION_POLICY_LIMITS = {
  maxAccuracyMeters: { min: 1, max: 100 },
  requiredConsecutiveSamples: { min: 1, max: 20 },
  maxEvidenceGapSeconds: { min: 1, max: 300 },
  triggerRadiusMeters: { min: 1, max: 1_000 },
} as const;

function assertBoundedFinite(
  name: string,
  value: number,
  limits: { min: number; max: number },
): void {
  if (!Number.isFinite(value) || value < limits.min || value > limits.max) {
    throw new Error(
      `${name} must be finite and between ${limits.min} and ${limits.max}`,
    );
  }
}

export function validateExplorationPolicy(
  policy: ExplorationPolicy,
): ExplorationPolicy {
  assertBoundedFinite(
    'maxAccuracyMeters',
    policy.maxAccuracyMeters,
    EXPLORATION_POLICY_LIMITS.maxAccuracyMeters,
  );
  assertBoundedFinite(
    'requiredConsecutiveSamples',
    policy.requiredConsecutiveSamples,
    EXPLORATION_POLICY_LIMITS.requiredConsecutiveSamples,
  );
  assertBoundedFinite(
    'maxEvidenceGapSeconds',
    policy.maxEvidenceGapSeconds,
    EXPLORATION_POLICY_LIMITS.maxEvidenceGapSeconds,
  );

  if (!Number.isInteger(policy.requiredConsecutiveSamples)) {
    throw new Error('requiredConsecutiveSamples must be an integer');
  }

  return { ...policy };
}

export function validateExplorationTargets(
  targets: ExplorationTarget[],
): ExplorationTarget[] {
  const keys = new Set<string>();

  for (const target of targets) {
    const key = explorationTargetKey(target.kind, target.id);
    if (keys.has(key)) throw new Error(`Duplicate exploration target: ${key}`);
    keys.add(key);
    if (!Number.isInteger(target.sequence) || target.sequence < 0) {
      throw new Error(`Invalid sequence for exploration target: ${key}`);
    }
    if (!Number.isFinite(target.latitude) || !Number.isFinite(target.longitude)) {
      throw new Error(`Invalid coordinates for exploration target: ${key}`);
    }
    assertBoundedFinite(
      `triggerRadiusMeters for ${key}`,
      target.triggerRadiusMeters,
      EXPLORATION_POLICY_LIMITS.triggerRadiusMeters,
    );
    for (const prerequisite of target.prerequisiteTargetKeys) {
      if (prerequisite === key) {
        throw new Error(`Target cannot depend on itself: ${key}`);
      }
    }
  }

  const knownKeys = new Set(targets.map((target) => explorationTargetKey(target.kind, target.id)));
  for (const target of targets) {
    for (const prerequisite of target.prerequisiteTargetKeys) {
      if (!knownKeys.has(prerequisite)) {
        throw new Error(`Unknown exploration prerequisite: ${prerequisite}`);
      }
    }
  }

  return targets.map((target) => ({
    ...target,
    prerequisiteTargetKeys: [...target.prerequisiteTargetKeys],
  }));
}

export function createExplorationState(
  unlockedTargetKeys: string[] = [],
  lastEvaluatedSequence = 0,
): ExplorationState {
  if (!Number.isInteger(lastEvaluatedSequence) || lastEvaluatedSequence < 0) {
    throw new Error('lastEvaluatedSequence must be a non-negative integer');
  }

  return {
    progressByTargetKey: {},
    unlockedTargetKeys: [...new Set(unlockedTargetKeys)],
    lastEvaluatedSequence,
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
  const previous = Date.parse(previousEvidenceAt);
  const current = Date.parse(currentSampleAt);
  if (!Number.isFinite(previous) || !Number.isFinite(current)) return null;
  return (current - previous) / 1_000;
}

function normalizeState(state: ExplorationState): ExplorationState {
  return {
    progressByTargetKey: { ...state.progressByTargetKey },
    unlockedTargetKeys: [...new Set(state.unlockedTargetKeys)],
    lastEvaluatedSequence: state.lastEvaluatedSequence,
  };
}

export function evaluateExplorationSample(
  inputState: ExplorationState,
  sample: LocationSample,
  inputTargets: ExplorationTarget[],
  policy: ExplorationPolicy,
): ExplorationEvaluation {
  const validatedPolicy = validateExplorationPolicy(policy);
  const targets = validateExplorationTargets(inputTargets).sort(
    (left, right) => left.sequence - right.sequence ||
      explorationTargetKey(left.kind, left.id).localeCompare(
        explorationTargetKey(right.kind, right.id),
      ),
  );
  const state = normalizeState(inputState);

  // A replayed or out-of-order sample must be a no-op, including evidence.
  if (sample.sequence <= state.lastEvaluatedSequence) {
    return { state, observations: [] };
  }

  const progressByTargetKey = { ...state.progressByTargetKey };
  const unlockedTargetKeys = [...state.unlockedTargetKeys];
  const unlockedSet = new Set(unlockedTargetKeys);
  const observations: ExplorationEvaluation['observations'] = [];

  for (const target of targets) {
    const targetKey = explorationTargetKey(target.kind, target.id);
    const currentProgress =
      progressByTargetKey[targetKey] ?? resetProgress();

    if (unlockedSet.has(targetKey)) {
      progressByTargetKey[targetKey] = currentProgress;
      continue;
    }

    const prerequisitesMet = target.prerequisiteTargetKeys.every((key) =>
      unlockedSet.has(key),
    );
    if (!prerequisitesMet) {
      progressByTargetKey[targetKey] = resetProgress();
      continue;
    }

    const distance = distanceMeters(sample, target);
    const reliable =
      sample.validForMetrics &&
      sample.accuracyMeters <= validatedPolicy.maxAccuracyMeters &&
      distance <= target.triggerRadiusMeters;

    if (!reliable) {
      progressByTargetKey[targetKey] = resetProgress();
      continue;
    }

    const gapSeconds = evidenceGapSeconds(
      currentProgress.lastEvidenceAt,
      sample.timestamp,
    );
    const continuesEvidence =
      gapSeconds === null || gapSeconds >= 0 && gapSeconds <= validatedPolicy.maxEvidenceGapSeconds;

    const nextProgress: ExplorationTargetProgress = {
      consecutiveSamples: continuesEvidence
        ? currentProgress.consecutiveSamples + 1
        : 1,
      lastEvidenceAt: sample.timestamp,
    };
    progressByTargetKey[targetKey] = nextProgress;

    if (nextProgress.consecutiveSamples >= validatedPolicy.requiredConsecutiveSamples) {
      unlockedSet.add(targetKey);
      unlockedTargetKeys.push(targetKey);
      observations.push({
        targetId: target.id,
        targetKey,
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
      progressByTargetKey,
      unlockedTargetKeys,
      lastEvaluatedSequence: sample.sequence,
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
export { explorationTargetKey } from './types';
