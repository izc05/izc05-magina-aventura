import { describe, expect, it } from 'vitest';
import type {
  ActivityAction,
  ActivitySession,
  GeoJsonPosition,
  LocationSample,
} from '@magina-aventura/contracts';

import { createInitialEngineState, reduceActivity } from './engine';
import { elapsedSecondsAt } from './metrics';

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

function location(
  sequence: number,
  longitude: number,
  timestamp: string,
  latitude = 37,
): LocationSample {
  return {
    sequence,
    timestamp,
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

const at = (seconds: number) => `2026-09-16T08:00:${String(seconds).padStart(2, '0')}.000Z`;

describe('activity engine reducer', () => {
  it('runs START -> ACTIVE and accumulates accepted active samples', () => {
    let state = createInitialEngineState(session(), at(0));
    state = reduceActivity(state, { type: 'START', at: at(0) }, routeLine);
    state = reduceActivity(state, { type: 'LOCATION', sample: location(1, -4.009, at(5)) }, routeLine);
    state = reduceActivity(state, { type: 'LOCATION', sample: location(2, -4.0089, at(10)) }, routeLine);

    expect(state.session.state).toBe('ACTIVE');
    expect(state.snapshot.state).toBe('ACTIVE');
    expect(state.snapshot.validDistanceMeters).toBeGreaterThan(0);
    expect(state.snapshot.routeProgress).toBeGreaterThan(0);
    expect(state.session.lastProcessedSequence).toBe(2);
  });

  it('does not count duplicate location sequences twice', () => {
    let state = createInitialEngineState(session(), at(0));
    state = reduceActivity(state, { type: 'START', at: at(0) }, routeLine);
    state = reduceActivity(state, { type: 'LOCATION', sample: location(1, -4.009, at(5)) }, routeLine);
    state = reduceActivity(state, { type: 'LOCATION', sample: location(2, -4.0089, at(10)) }, routeLine);
    const distance = state.snapshot.validDistanceMeters;

    state = reduceActivity(state, { type: 'LOCATION', sample: location(2, -4.0088, at(11)) }, routeLine);

    expect(state.snapshot.validDistanceMeters).toBe(distance);
    expect(state.session.lastProcessedSequence).toBe(2);
  });

  it('counts START to FINISH time without waiting for GPS samples', () => {
    let state = createInitialEngineState(session(), at(0));
    state = reduceActivity(state, { type: 'START', at: at(0) }, routeLine);

    expect(elapsedSecondsAt(state.snapshot, state.session.state, at(17))).toBe(17);

    state = reduceActivity(state, { type: 'FINISH', at: at(17) }, routeLine);
    expect(state.session.state).toBe('FINISHED');
    expect(state.session.finishedAt).toBe(at(17));
    expect(state.snapshot.totalElapsedSeconds).toBe(17);
    expect(elapsedSecondsAt(state.snapshot, state.session.state, at(30))).toBe(17);
  });

  it('freezes through PAUSED, resets the location reference on RESUME, and finishes only active intervals', () => {
    let state = createInitialEngineState(session(), at(0));
    const actions: ActivityAction[] = [
      { type: 'START', at: at(0) },
      { type: 'LOCATION', sample: location(1, -4.009, at(5)) },
      { type: 'PAUSE', at: at(10) },
      { type: 'LOCATION', sample: location(2, -4.008, at(20)) },
    ];
    for (const action of actions) state = reduceActivity(state, action, routeLine);

    expect(state.snapshot.totalElapsedSeconds).toBe(10);
    expect(state.snapshot.lastValidSample).toBeNull();
    expect(elapsedSecondsAt(state.snapshot, state.session.state, at(25))).toBe(10);

    state = reduceActivity(state, { type: 'RESUME', at: at(30) }, routeLine);
    state = reduceActivity(
      state,
      { type: 'LOCATION', sample: location(3, -4.007, at(31)) },
      routeLine,
    );
    expect(state.snapshot.validDistanceMeters).toBe(0);

    state = reduceActivity(state, { type: 'FINISH', at: at(40) }, routeLine);
    expect(state.snapshot.totalElapsedSeconds).toBe(20);
    expect(state.session.state).toBe('FINISHED');
  });

  it('does not add paused wall time when finishing from PAUSED', () => {
    let state = createInitialEngineState(session(), at(0));
    state = reduceActivity(state, { type: 'START', at: at(0) }, routeLine);
    state = reduceActivity(state, { type: 'PAUSE', at: at(10) }, routeLine);
    state = reduceActivity(state, { type: 'FINISH', at: at(50) }, routeLine);

    expect(state.snapshot.totalElapsedSeconds).toBe(10);
    expect(elapsedSecondsAt(state.snapshot, state.session.state, at(60))).toBe(10);
  });

  it('keeps full ACTIVE time across a GPS gap without bridging movement metrics', () => {
    let state = createInitialEngineState(session(), at(0));
    state = reduceActivity(state, { type: 'START', at: at(0) }, routeLine);
    state = reduceActivity(
      state,
      { type: 'LOCATION', sample: location(1, -4.009, at(0)) },
      routeLine,
    );
    expect(elapsedSecondsAt(state.snapshot, 'ACTIVE', at(20))).toBe(20);

    state = reduceActivity(
      state,
      { type: 'LOCATION', sample: location(2, -4.007, at(20)) },
      routeLine,
    );
    expect(state.snapshot.validDistanceMeters).toBe(0);
    expect(state.snapshot.movingElapsedSeconds).toBe(0);
    expect(state.snapshot.elevationGainMeters).toBe(0);
    expect(state.snapshot.elevationLossMeters).toBe(0);
    expect(state.snapshot.currentSpeedMps).toBeNull();
    expect(state.snapshot.gpsGapSecondsExcluded).toBe(5);
    expect(elapsedSecondsAt(state.snapshot, 'ACTIVE', at(20))).toBe(20);

    state = reduceActivity(state, { type: 'FINISH', at: at(20) }, routeLine);
    expect(state.snapshot.totalElapsedSeconds).toBe(20);
  });
});
