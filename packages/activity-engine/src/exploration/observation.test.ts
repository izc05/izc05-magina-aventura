import { describe, expect, it } from 'vitest';

import type { LocationSample } from '@magina-aventura/contracts';

import { explorationObservationKey } from './observation';
import {
  createExplorationState,
  evaluateExplorationSample,
} from './proximity';
import type { ExplorationObservation, ExplorationTarget } from './types';

const observation: ExplorationObservation = {
  targetId: '00000000-0000-4000-8000-000000000001',
  targetKey: 'checkpoint:00000000-0000-4000-8000-000000000001',
  kind: 'checkpoint',
  observedAt: '2026-09-16T06:00:05.000Z',
  sampleSequence: 2,
  distanceMeters: 4,
  accuracyMeters: 8,
};

describe('explorationObservationKey', () => {
  it('is stable for the same activity and target', () => {
    const first = explorationObservationKey('activity-1', observation);
    const replayed = explorationObservationKey('activity-1', {
      ...observation,
      observedAt: '2026-09-16T06:01:00.000Z',
      sampleSequence: 99,
    });

    expect(first).toBe('activity-1:checkpoint:00000000-0000-4000-8000-000000000001');
    expect(replayed).toBe(first);
  });
});

describe('multi-target exploration', () => {
  it('keeps checkpoint and discovery identities isolated', () => {
    const targets: ExplorationTarget[] = [
      {
        id: '00000000-0000-4000-8000-000000000001',
        kind: 'checkpoint',
        sequence: 1,
        required: true,
        prerequisiteTargetKeys: [],
        latitude: 37,
        longitude: -3,
        triggerRadiusMeters: 30,
      },
      {
        id: '00000000-0000-4000-8000-000000000001',
        kind: 'discovery',
        sequence: 2,
        required: false,
        prerequisiteTargetKeys: [],
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

    expect(result.state.unlockedTargetKeys).toEqual([
      'checkpoint:00000000-0000-4000-8000-000000000001',
      'discovery:00000000-0000-4000-8000-000000000001',
    ]);
    expect(result.observations.map(({ targetKey }) => targetKey)).toEqual([
      'checkpoint:00000000-0000-4000-8000-000000000001',
      'discovery:00000000-0000-4000-8000-000000000001',
    ]);
  });
});
