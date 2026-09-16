import { describe, expect, it } from 'vitest';
import type { ActivitySnapshot, LocationSample } from '@magina-aventura/contracts';

import { updateActivityMetrics } from './metrics';

function snapshot(overrides: Partial<ActivitySnapshot> = {}): ActivitySnapshot {
  return {
    activityId: 'activity-test',
    state: 'ACTIVE',
    lastProcessedSequence: 1,
    validDistanceMeters: 0,
    totalElapsedSeconds: 0,
    movingElapsedSeconds: 0,
    currentSpeedMps: null,
    paceSecondsPerKm: null,
    elevationGainMeters: 0,
    elevationLossMeters: 0,
    routeProgress: 0,
    maxRouteProgress: 0,
    distanceToRouteMeters: null,
    offRouteState: 'on_route',
    lastValidSample: null,
    algorithmVersion: 1,
    createdAt: '2026-09-16T07:00:00.000Z',
    ...overrides,
  };
}

function sample(overrides: Partial<LocationSample> = {}): LocationSample {
  return {
    sequence: 2,
    timestamp: '2026-09-16T07:00:10.000Z',
    latitude: 37.0001,
    longitude: -4,
    accuracyMeters: 8,
    altitudeMeters: 904,
    speedMps: 1.1,
    headingDegrees: 0,
    validForMetrics: true,
    rejectionReason: null,
    ...overrides,
  };
}

const previous: LocationSample = sample({
  sequence: 1,
  timestamp: '2026-09-16T07:00:00.000Z',
  latitude: 37,
  altitudeMeters: 900,
});

describe('updateActivityMetrics', () => {
  it('adds distance and moving time from accepted ACTIVE samples', () => {
    const result = updateActivityMetrics(snapshot(), previous, sample(), 'ACTIVE');

    expect(result.validDistanceMeters).toBeGreaterThan(10);
    expect(result.movingElapsedSeconds).toBe(10);
    expect(result.currentSpeedMps).not.toBeNull();
  });

  it('does not inflate metrics with a rejected sample', () => {
    const initial = snapshot({ validDistanceMeters: 120, movingElapsedSeconds: 45 });
    const result = updateActivityMetrics(
      initial,
      previous,
      sample({ validForMetrics: false, rejectionReason: 'poor_accuracy' }),
      'ACTIVE',
    );

    expect(result.validDistanceMeters).toBe(120);
    expect(result.movingElapsedSeconds).toBe(45);
  });

  it('does not add distance or moving time while PAUSED', () => {
    const initial = snapshot({ validDistanceMeters: 120, movingElapsedSeconds: 45 });
    const result = updateActivityMetrics(initial, previous, sample(), 'PAUSED');

    expect(result.validDistanceMeters).toBe(120);
    expect(result.movingElapsedSeconds).toBe(45);
  });

  it('ignores altitude noise below 3 m', () => {
    const result = updateActivityMetrics(
      snapshot(),
      previous,
      sample({ altitudeMeters: 902 }),
      'ACTIVE',
    );

    expect(result.elevationGainMeters).toBe(0);
    expect(result.elevationLossMeters).toBe(0);
  });

  it('accumulates meaningful elevation gain and loss', () => {
    const gained = updateActivityMetrics(snapshot(), previous, sample({ altitudeMeters: 904 }), 'ACTIVE');
    expect(gained.elevationGainMeters).toBe(4);

    const higherPrevious = previous ? { ...previous, altitudeMeters: 910 } : previous;
    const lost = updateActivityMetrics(snapshot(), higherPrevious, sample({ altitudeMeters: 905 }), 'ACTIVE');
    expect(lost.elevationLossMeters).toBe(5);
  });
});
