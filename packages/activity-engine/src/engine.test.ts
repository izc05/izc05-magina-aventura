import { describe, expect, it } from 'vitest';
import type {
  ActivityAction,
  ActivitySession,
  GeoJsonPosition,
  LocationSample,
} from '@magina-aventura/contracts';

import { createInitialEngineState, reduceActivity } from './engine';

const routeLine: GeoJsonPosition[] = [
  [-4.01, 37],
  [-4, 37],
  [-3.99, 37],
];

function session(): ActivitySession {
  return {
    activityId: 'activity-engine-test',
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
}

function location(sequence: number, longitude: number, latitude = 37): LocationSample {
  return {
    sequence,
    timestamp: `2026-09-16T08:00:${String(sequence * 10).padStart(2, '0')}.000Z`,
    latitude,
    longitude,
    accuracyMeters: 8,
    altitudeMeters: 900 + sequence * 4,
    speedMps: 1,
    headingDegrees: 90,
    validForMetrics: true,
    rejectionReason: null,
  };
}

describe('activity engine reducer', () => {
  it('runs START -> ACTIVE and accumulates accepted active samples', () => {
    let state = createInitialEngineState(session(), '2026-09-16T08:00:00.000Z');
    state = reduceActivity(state, { type: 'START', at: '2026-09-16T08:00:00.000Z' }, routeLine);
    state = reduceActivity(state, { type: 'LOCATION', sample: location(1, -4.009) }, routeLine);
    state = reduceActivity(state, { type: 'LOCATION', sample: location(2, -4.0089) }, routeLine);

    expect(state.session.state).toBe('ACTIVE');
    expect(state.snapshot.state).toBe('ACTIVE');
    expect(state.snapshot.validDistanceMeters).toBeGreaterThan(0);
    expect(state.snapshot.routeProgress).toBeGreaterThan(0);
    expect(state.session.lastProcessedSequence).toBe(2);
  });

  it('does not count duplicate location sequences twice', () => {
    let state = createInitialEngineState(session(), '2026-09-16T08:00:00.000Z');
    state = reduceActivity(state, { type: 'START', at: '2026-09-16T08:00:00.000Z' }, routeLine);
    state = reduceActivity(state, { type: 'LOCATION', sample: location(1, -4.009) }, routeLine);
    state = reduceActivity(state, { type: 'LOCATION', sample: location(2, -4.0089) }, routeLine);
    const distance = state.snapshot.validDistanceMeters;

    state = reduceActivity(state, { type: 'LOCATION', sample: location(2, -4.0088) }, routeLine);

    expect(state.snapshot.validDistanceMeters).toBe(distance);
    expect(state.session.lastProcessedSequence).toBe(2);
  });

  it('pauses, resumes and finishes without granting rewards', () => {
    let state = createInitialEngineState(session(), '2026-09-16T08:00:00.000Z');
    const actions: ActivityAction[] = [
      { type: 'START', at: '2026-09-16T08:00:00.000Z' },
      { type: 'LOCATION', sample: location(1, -4.009) },
      { type: 'PAUSE', at: '2026-09-16T08:00:11.000Z' },
      { type: 'LOCATION', sample: location(2, -4.008) },
      { type: 'RESUME', at: '2026-09-16T08:00:21.000Z' },
      { type: 'LOCATION', sample: location(3, -4.0079) },
      { type: 'FINISH', at: '2026-09-16T08:00:31.000Z' },
    ];

    for (const action of actions) state = reduceActivity(state, action, routeLine);

    expect(state.session.state).toBe('FINISHED');
    expect(state.session.finishedAt).toBe('2026-09-16T08:00:31.000Z');
    expect(state.snapshot.state).toBe('FINISHED');
    expect(state.session.syncState).toBe('local');
  });
});
