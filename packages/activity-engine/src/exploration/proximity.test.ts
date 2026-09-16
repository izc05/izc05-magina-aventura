import { describe, expect, it } from 'vitest';

import type { LocationSample } from '@magina-aventura/contracts';
import {
  createExplorationState,
  evaluateExplorationSample,
  type ExplorationPolicy,
  type ExplorationTarget,
} from './proximity';

const target: ExplorationTarget = {
  id: 'checkpoint-1',
  kind: 'checkpoint',
  latitude: 37,
  longitude: -3,
  triggerRadiusMeters: 30,
};

const policy: ExplorationPolicy = {
  maxAccuracyMeters: 25,
  requiredConsecutiveSamples: 2,
  maxEvidenceGapSeconds: 15,
};

function sample(overrides: Partial<LocationSample> = {}): LocationSample {
  return {
    sequence: 1,
    timestamp: '2026-09-16T06:00:00.000Z',
    latitude: 37,
    longitude: -3,
    accuracyMeters: 8,
    altitudeMeters: null,
    speedMps: null,
    headingDegrees: null,
    validForMetrics: true,
    rejectionReason: null,
    ...overrides,
  };
}

describe('evaluateExplorationSample', () => {
  it('does not accumulate evidence when the user is outside the target radius', () => {
    const result = evaluateExplorationSample(
      createExplorationState(),
      sample({ latitude: 37.001 }),
      [target],
      policy,
    );

    expect(result.observations).toEqual([]);
    expect(result.state.progressByTarget[target.id]).toEqual({
      consecutiveSamples: 0,
      lastEvidenceAt: null,
    });
    expect(result.state.unlockedTargetIds).toEqual([]);
  });

  it('rejects proximity evidence when GPS accuracy is worse than the configured limit', () => {
    const result = evaluateExplorationSample(
      createExplorationState(),
      sample({ accuracyMeters: 40 }),
      [target],
      policy,
    );

    expect(result.observations).toEqual([]);
    expect(result.state.progressByTarget[target.id]!.consecutiveSamples).toBe(0);
  });

  it('unlocks only after the configured number of consecutive reliable samples', () => {
    const first = evaluateExplorationSample(
      createExplorationState(),
      sample(),
      [target],
      policy,
    );

    expect(first.observations).toEqual([]);
    expect(first.state.progressByTarget[target.id]!.consecutiveSamples).toBe(1);

    const second = evaluateExplorationSample(
      first.state,
      sample({
        sequence: 2,
        timestamp: '2026-09-16T06:00:05.000Z',
      }),
      [target],
      policy,
    );

    expect(second.state.unlockedTargetIds).toEqual(['checkpoint-1']);
    expect(second.observations).toHaveLength(1);
    expect(second.observations[0]).toMatchObject({
      targetId: 'checkpoint-1',
      kind: 'checkpoint',
      observedAt: '2026-09-16T06:00:05.000Z',
      sampleSequence: 2,
      accuracyMeters: 8,
    });
    expect(second.observations[0]!.distanceMeters).toBeCloseTo(0, 6);
  });

  it('restarts consecutive evidence when the gap between reliable samples is too large', () => {
    const first = evaluateExplorationSample(
      createExplorationState(),
      sample(),
      [target],
      policy,
    );

    const afterGap = evaluateExplorationSample(
      first.state,
      sample({
        sequence: 2,
        timestamp: '2026-09-16T06:00:30.000Z',
      }),
      [target],
      policy,
    );

    expect(afterGap.observations).toEqual([]);
    expect(afterGap.state.unlockedTargetIds).toEqual([]);
    expect(afterGap.state.progressByTarget[target.id]).toEqual({
      consecutiveSamples: 1,
      lastEvidenceAt: '2026-09-16T06:00:30.000Z',
    });
  });

  it('clears consecutive evidence after a sample rejected by the GPS metrics filter', () => {
    const first = evaluateExplorationSample(
      createExplorationState(),
      sample(),
      [target],
      policy,
    );

    const rejected = evaluateExplorationSample(
      first.state,
      sample({
        sequence: 2,
        timestamp: '2026-09-16T06:00:05.000Z',
        validForMetrics: false,
        rejectionReason: 'poor_accuracy',
      }),
      [target],
      policy,
    );

    expect(rejected.observations).toEqual([]);
    expect(rejected.state.progressByTarget[target.id]).toEqual({
      consecutiveSamples: 0,
      lastEvidenceAt: null,
    });

    const nextReliable = evaluateExplorationSample(
      rejected.state,
      sample({
        sequence: 3,
        timestamp: '2026-09-16T06:00:10.000Z',
      }),
      [target],
      policy,
    );

    expect(nextReliable.observations).toEqual([]);
    expect(nextReliable.state.progressByTarget[target.id]!.consecutiveSamples).toBe(1);
  });

  it('never emits a second observation after the target is already unlocked', () => {
    const first = evaluateExplorationSample(
      createExplorationState(),
      sample(),
      [target],
      policy,
    );
    const unlocked = evaluateExplorationSample(
      first.state,
      sample({
        sequence: 2,
        timestamp: '2026-09-16T06:00:05.000Z',
      }),
      [target],
      policy,
    );
    const repeated = evaluateExplorationSample(
      unlocked.state,
      sample({
        sequence: 3,
        timestamp: '2026-09-16T06:00:10.000Z',
      }),
      [target],
      policy,
    );

    expect(unlocked.observations).toHaveLength(1);
    expect(repeated.observations).toEqual([]);
    expect(repeated.state.unlockedTargetIds).toEqual(['checkpoint-1']);
  });
});
