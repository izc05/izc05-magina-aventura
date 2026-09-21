import { describe, expect, it } from 'vitest';

import type { LocationSample } from '@magina-aventura/contracts';
import {
  createExplorationState,
  evaluateExplorationSample,
  explorationTargetKey,
  validateExplorationPolicy,
  validateExplorationTargets,
  type ExplorationPolicy,
  type ExplorationTarget,
} from './proximity';

const target: ExplorationTarget = {
  id: '00000000-0000-4000-8000-000000000001',
  kind: 'checkpoint',
  sequence: 1,
  required: true,
  prerequisiteTargetKeys: [],
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
  it('does not accumulate evidence outside the target radius', () => {
    const result = evaluateExplorationSample(
      createExplorationState(),
      sample({ latitude: 37.001 }),
      [target],
      policy,
    );

    expect(result.observations).toEqual([]);
    expect(result.state.progressByTargetKey[explorationTargetKey('checkpoint', target.id)]).toEqual({
      consecutiveSamples: 0,
      lastEvidenceAt: null,
    });
  });

  it('rejects proximity evidence when GPS accuracy is worse than policy', () => {
    const result = evaluateExplorationSample(
      createExplorationState(),
      sample({ accuracyMeters: 40 }),
      [target],
      policy,
    );

    expect(result.observations).toEqual([]);
    expect(result.state.lastEvaluatedSequence).toBe(1);
  });

  it('unlocks only after consecutive reliable samples', () => {
    const first = evaluateExplorationSample(createExplorationState(), sample(), [target], policy);
    const second = evaluateExplorationSample(
      first.state,
      sample({ sequence: 2, timestamp: '2026-09-16T06:00:05.000Z' }),
      [target],
      policy,
    );

    expect(second.state.unlockedTargetKeys).toEqual([`checkpoint:${target.id}`]);
    expect(second.observations).toHaveLength(1);
    expect(second.observations[0]).toMatchObject({
      targetId: target.id,
      targetKey: `checkpoint:${target.id}`,
      sampleSequence: 2,
    });
  });

  it('resets evidence after an excessive gap', () => {
    const first = evaluateExplorationSample(createExplorationState(), sample(), [target], policy);
    const afterGap = evaluateExplorationSample(
      first.state,
      sample({ sequence: 2, timestamp: '2026-09-16T06:00:30.000Z' }),
      [target],
      policy,
    );

    expect(afterGap.observations).toEqual([]);
    expect(afterGap.state.progressByTargetKey[`checkpoint:${target.id}`]).toEqual({
      consecutiveSamples: 1,
      lastEvidenceAt: '2026-09-16T06:00:30.000Z',
    });
  });

  it('clears evidence after an invalid normalized GPS sample', () => {
    const first = evaluateExplorationSample(createExplorationState(), sample(), [target], policy);
    const rejected = evaluateExplorationSample(
      first.state,
      sample({ sequence: 2, validForMetrics: false, rejectionReason: 'poor_accuracy' }),
      [target],
      policy,
    );

    expect(rejected.state.progressByTargetKey[`checkpoint:${target.id}`]).toEqual({
      consecutiveSamples: 0,
      lastEvidenceAt: null,
    });
  });

  it('makes a replayed or out-of-order sample a no-op', () => {
    const first = evaluateExplorationSample(createExplorationState(), sample(), [target], policy);
    const replay = evaluateExplorationSample(first.state, sample(), [target], policy);

    expect(replay.observations).toEqual([]);
    expect(replay.state).toEqual(first.state);
  });

  it('does not unlock a target twice and honors explicit prerequisites', () => {
    const firstTarget = target;
    const secondTarget: ExplorationTarget = {
      ...target,
      id: '00000000-0000-4000-8000-000000000002',
      sequence: 2,
      prerequisiteTargetKeys: [`checkpoint:${firstTarget.id}`],
      latitude: 37.001,
    };
    const unlockedFirst = evaluateExplorationSample(
      createExplorationState(),
      sample(),
      [firstTarget, secondTarget],
      { ...policy, requiredConsecutiveSamples: 1 },
    );
    const repeated = evaluateExplorationSample(
      unlockedFirst.state,
      sample({ sequence: 2, timestamp: '2026-09-16T06:00:05.000Z', latitude: 37.001 }),
      [firstTarget, secondTarget],
      { ...policy, requiredConsecutiveSamples: 1 },
    );

    expect(unlockedFirst.state.unlockedTargetKeys).toEqual([`checkpoint:${firstTarget.id}`]);
    expect(repeated.state.unlockedTargetKeys).toEqual([
      `checkpoint:${firstTarget.id}`,
      `checkpoint:${secondTarget.id}`,
    ]);
    expect(repeated.observations).toHaveLength(1);
  });
});

describe('exploration validation', () => {
  it('rejects unsafe policies', () => {
    expect(() => validateExplorationPolicy({ ...policy, maxEvidenceGapSeconds: 0 })).toThrow();
    expect(() => validateExplorationPolicy({ ...policy, requiredConsecutiveSamples: 1.5 })).toThrow();
    expect(() => validateExplorationPolicy({ ...policy, maxAccuracyMeters: 101 })).toThrow();
  });

  it('rejects duplicate target keys and unknown prerequisites', () => {
    expect(() => validateExplorationTargets([target, target])).toThrow(/Duplicate/);
    expect(() => validateExplorationTargets([
      { ...target, prerequisiteTargetKeys: ['discovery:missing'] },
    ])).toThrow(/Unknown/);
  });
});
