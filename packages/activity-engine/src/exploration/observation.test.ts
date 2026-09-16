import { describe, expect, it } from 'vitest';

import type { LocationSample } from '@magina-aventura/contracts';

import { explorationObservationKey } from './observation';
import {
  createExplorationState,
  evaluateExplorationSample,
} from './proximity';
import type { ExplorationObservation, ExplorationTarget } from './types';

const observation: ExplorationObservation = {
  targetId: 'checkpoint-1',
  kind: 'checkpoint',
  observedAt: '2026-09-16T06:00:05.000Z',
  sampleSequence: 2,
  distanceMeters: 4,
  accuracyMeters: 8,
};

describe('explorationObservationKey', () => {
  it('is stable for the same activity and target even when observation details differ', () => {
    const first = explorationObservationKey('activity-1', observation);
    const replayed = explorationObservationKey('activity-1', {
      ...observation,
      observedAt: '2026-09-16T06:01:00.000Z',
      sampleSequence: 99,
      distanceMeters: 2,
    });

    expect(first).toBe('activity-1:checkpoint:checkpoint-1');
    expect(replayed).toBe(first);
  });
});

describe('multi-target exploration', () => {
  it('tracks checkpoint and discovery evidence independently from the same GPS sample', () => {
    const targets: ExplorationTarget[] = [
      {
        id: 'checkpoint-1',
        kind: 'checkpoint',
        latitude: 37,
        longitude: -3,
        triggerRadiusMeters: 30,
      },
      {
        id: 'discovery-1',
        kind: 'discovery',
        latitude: 37,
        longitude: -3,
        triggerRadiusMeters: 20,
      },
    ];
    const location: LocationSample = {
      sequence: 7,
      timestamp: '2026-09-16T06:10:00.000Z',
      latitude: 37,
      longitude: -3,
      accuracyMeters: 7,
      altitudeMeters: null,
      speedMps: null,
      headingDegrees: null,
      validForMetrics: true,
      rejectionReason: null,
    };

    const result = evaluateExplorationSample(
      createExplorationState(),
      location,
      targets,
      {
        maxAccuracyMeters: 20,
        requiredConsecutiveSamples: 1,
        maxEvidenceGapSeconds: 15,
      },
    );

    expect(result.state.unlockedTargetIds).toEqual([
      'checkpoint-1',
      'discovery-1',
    ]);
    expect(result.observations.map(({ targetId, kind }) => ({ targetId, kind }))).toEqual([
      { targetId: 'checkpoint-1', kind: 'checkpoint' },
      { targetId: 'discovery-1', kind: 'discovery' },
    ]);
    expect(result.state.progressByTarget['checkpoint-1']!.consecutiveSamples).toBe(1);
    expect(result.state.progressByTarget['discovery-1']!.consecutiveSamples).toBe(1);
  });
});
