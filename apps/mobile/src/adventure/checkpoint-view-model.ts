import type { AdventureTargetDefinition, LocationSample } from '@magina-aventura/contracts';
import { explorationTargetKey, type ExplorationState } from '@magina-aventura/activity-engine';
import { distanceMeters } from '@magina-aventura/geo';

export type CheckpointVisualStatus = 'nearby' | 'verifying' | 'discovered';

export interface CheckpointViewModel {
  key: string;
  status: CheckpointVisualStatus;
  distanceMeters: number | null;
  required: boolean;
  sequence: number;
}

export type CheckpointDataOrigin = 'verified' | 'development-simulation' | 'unverified';

export function checkpointViewModel(
  target: AdventureTargetDefinition,
  exploration: ExplorationState,
  lastValidSample: LocationSample | null,
  origin: CheckpointDataOrigin,
): CheckpointViewModel | null {
  if (origin !== 'verified') return null;

  const key = explorationTargetKey(target.kind, target.id);
  const discovered = exploration.unlockedTargetKeys.includes(key);
  const progress = exploration.progressByTargetKey[key];

  return {
    key,
    status: discovered
      ? 'discovered'
      : (progress?.consecutiveSamples ?? 0) > 0
        ? 'verifying'
        : 'nearby',
    distanceMeters: lastValidSample
      ? distanceMeters(lastValidSample, target)
      : null,
    required: target.required,
    sequence: target.sequence,
  };
}
