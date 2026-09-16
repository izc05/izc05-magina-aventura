import { describe, expect, it } from 'vitest';
import type {
  ActivityAction,
  ActivitySession,
  GeoJsonPosition,
  LocationSample,
} from '@magina-aventura/contracts';

import { replayActivity } from './replay';

const routeLine: GeoJsonPosition[] = [
  [-4.01, 37],
  [-4, 37],
  [-3.99, 37],
];

const baseSession: ActivitySession = {
  activityId: 'activity-replay-test',
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

function sample(sequence: number, longitude: number): LocationSample {
  return {
    sequence,
    timestamp: `2026-09-16T08:00:${String(sequence * 10).padStart(2, '0')}.000Z`,
    latitude: 37,
    longitude,
    accuracyMeters: 8,
    altitudeMeters: 900,
    speedMps: 1,
    headingDegrees: 90,
    validForMetrics: true,
    rejectionReason: null,
  };
}

const actions: ActivityAction[] = [
  { type: 'START', at: '2026-09-16T08:00:00.000Z' },
  { type: 'LOCATION', sample: sample(1, -4.009) },
  { type: 'LOCATION', sample: sample(2, -4.0089) },
  { type: 'PAUSE', at: '2026-09-16T08:00:21.000Z' },
  { type: 'RESUME', at: '2026-09-16T08:00:25.000Z' },
  { type: 'LOCATION', sample: sample(3, -4.0088) },
  { type: 'FINISH', at: '2026-09-16T08:00:31.000Z' },
];

describe('replayActivity', () => {
  it('reconstructs the same final state deterministically', () => {
    const first = replayActivity(baseSession, actions, routeLine, '2026-09-16T08:00:00.000Z');
    const second = replayActivity(baseSession, actions, routeLine, '2026-09-16T08:00:00.000Z');

    expect(second).toEqual(first);
    expect(first.session.state).toBe('FINISHED');
    expect(first.snapshot.lastProcessedSequence).toBe(3);
    expect(first.snapshot.validDistanceMeters).toBeGreaterThan(0);
  });

  it('is idempotent for a duplicated LOCATION sequence', () => {
    const withDuplicate: ActivityAction[] = [
      ...actions.slice(0, 3),
      { type: 'LOCATION', sample: sample(2, -4.007) },
      ...actions.slice(3),
    ];

    const normal = replayActivity(baseSession, actions, routeLine, '2026-09-16T08:00:00.000Z');
    const duplicate = replayActivity(baseSession, withDuplicate, routeLine, '2026-09-16T08:00:00.000Z');

    expect(duplicate.snapshot.validDistanceMeters).toBe(normal.snapshot.validDistanceMeters);
    expect(duplicate.snapshot.lastProcessedSequence).toBe(normal.snapshot.lastProcessedSequence);
  });
});
