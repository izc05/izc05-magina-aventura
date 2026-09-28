import { describe, expect, it } from 'vitest';
import type { ActivitySession, GeoJsonPosition, LocationSample } from '@magina-aventura/contracts';

import { createInitialEngineState, reduceActivity } from './engine';

const routeLine: GeoJsonPosition[] = [
  [-4.01, 37],
  [-4, 37],
  [-3.99, 37],
];

const baseSession: ActivitySession = {
  activityId: 'snapshot-policy',
  adventureSlug: 'synthetic-adventure',
  adventureVersion: 1,
  routeId: 'route-test',
  routeSlug: 'synthetic-route',
  geometryVersion: 1,
  state: 'DRAFT',
  startedAt: '2026-09-16T08:00:00.000Z',
  pausedAt: null,
  finishedAt: null,
  lastProcessedSequence: 0,
  syncState: 'local',
};

function sample(sequence: number, seconds: number): LocationSample {
  return {
    sequence,
    timestamp: `2026-09-16T08:00:${String(seconds).padStart(2, '0')}.000Z`,
    latitude: 37,
    longitude: -4 + sequence * 0.00001,
    accuracyMeters: 8,
    altitudeMeters: 900,
    speedMps: 1,
    headingDegrees: 90,
    validForMetrics: true,
    rejectionReason: null,
  };
}

describe('activity snapshot policy', () => {
  it('persists on every lifecycle transition', () => {
    let state = createInitialEngineState(baseSession, '2026-09-16T08:00:00.000Z');

    state = reduceActivity(state, { type: 'START', at: '2026-09-16T08:00:00.000Z' }, routeLine);
    expect(state.shouldPersistSnapshot).toBe(true);

    state = reduceActivity(state, { type: 'PAUSE', at: '2026-09-16T08:00:05.000Z' }, routeLine);
    expect(state.shouldPersistSnapshot).toBe(true);

    state = reduceActivity(state, { type: 'RESUME', at: '2026-09-16T08:00:06.000Z' }, routeLine);
    expect(state.shouldPersistSnapshot).toBe(true);

    state = reduceActivity(state, { type: 'FINISH', at: '2026-09-16T08:00:07.000Z' }, routeLine);
    expect(state.shouldPersistSnapshot).toBe(true);
  });

  it('persists after ten accepted samples even before 15 seconds', () => {
    let state = createInitialEngineState(baseSession, '2026-09-16T08:00:00.000Z');
    state = reduceActivity(state, { type: 'START', at: '2026-09-16T08:00:00.000Z' }, routeLine);

    for (let sequence = 1; sequence <= 9; sequence += 1) {
      state = reduceActivity(state, { type: 'LOCATION', sample: sample(sequence, sequence) }, routeLine);
      expect(state.shouldPersistSnapshot).toBe(false);
    }

    state = reduceActivity(state, { type: 'LOCATION', sample: sample(10, 10) }, routeLine);
    expect(state.shouldPersistSnapshot).toBe(true);
    expect(state.acceptedSamplesSinceSnapshot).toBe(0);
  });

  it('persists after fifteen seconds even with fewer than ten samples', () => {
    let state = createInitialEngineState(baseSession, '2026-09-16T08:00:00.000Z');
    state = reduceActivity(state, { type: 'START', at: '2026-09-16T08:00:00.000Z' }, routeLine);
    state = reduceActivity(state, { type: 'LOCATION', sample: sample(1, 15) }, routeLine);

    expect(state.shouldPersistSnapshot).toBe(true);
    expect(state.lastSnapshotAt).toBe('2026-09-16T08:00:15.000Z');
  });

  it('does not count rejected samples toward the ten-sample threshold', () => {
    let state = createInitialEngineState(baseSession, '2026-09-16T08:00:00.000Z');
    state = reduceActivity(state, { type: 'START', at: '2026-09-16T08:00:00.000Z' }, routeLine);
    state = reduceActivity(
      state,
      {
        type: 'LOCATION',
        sample: { ...sample(1, 1), validForMetrics: false, rejectionReason: 'poor_accuracy' },
      },
      routeLine,
    );

    expect(state.acceptedSamplesSinceSnapshot).toBe(0);
    expect(state.shouldPersistSnapshot).toBe(false);
    expect(state.rejectedSample?.sequence).toBe(1);
  });
});
