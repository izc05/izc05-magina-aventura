import { describe, expect, it } from 'vitest';
import type { ActivitySnapshot, LocationSample } from '@magina-aventura/contracts';

import { elapsedSecondsAt, updateActivityMetrics } from './metrics';

function snapshot(overrides: Partial<ActivitySnapshot> = {}): ActivitySnapshot {
  return {
    activityId: 'activity-test',
    state: 'ACTIVE',
    lastProcessedSequence: 1,
    validDistanceMeters: 0,
    totalElapsedSeconds: 0,
    activeIntervalStartedAt: '2026-09-16T07:00:00.000Z',
    gpsGapSecondsExcluded: 0,
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

describe('activity elapsed time and metrics', () => {
  it('advances its active clock without any GPS samples', () => {
    const initial = snapshot();
    expect(elapsedSecondsAt(initial, 'ACTIVE', '2026-09-16T07:00:17.000Z')).toBe(17);
    expect(elapsedSecondsAt(initial, 'PAUSED', '2026-09-16T07:00:17.000Z')).toBe(0);
  });

  it('adds distance and moving time for accepted samples within the GPS gap limit', () => {
    const result = updateActivityMetrics(snapshot(), previous, sample(), 'ACTIVE');

    expect(result.validDistanceMeters).toBeGreaterThan(10);
    expect(result.movingElapsedSeconds).toBe(10);
    expect(result.currentSpeedMps).not.toBeNull();
    // Total active time is supplied by lifecycle intervals, not sample deltas.
    expect(result.totalElapsedSeconds).toBe(0);
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

  it('does not add distance, moving time, or elapsed time while PAUSED', () => {
    const initial = snapshot({ validDistanceMeters: 120, movingElapsedSeconds: 45 });
    const result = updateActivityMetrics(initial, previous, sample(), 'PAUSED');

    expect(result.validDistanceMeters).toBe(120);
    expect(result.movingElapsedSeconds).toBe(45);
    expect(result.totalElapsedSeconds).toBe(0);
    expect(result.lastValidSample).toBeNull();
  });

  it('drops GPS-derived metrics across a prolonged gap without shortening ACTIVE time', () => {
    const beforeGap = snapshot({ lastValidSample: previous });
    const farAfterGap = sample({
      timestamp: '2026-09-16T07:00:20.000Z',
      latitude: 37.003,
      longitude: -4,
    });
    const result = updateActivityMetrics(beforeGap, previous, farAfterGap, 'ACTIVE');

    expect(result.validDistanceMeters).toBe(0);
    expect(result.movingElapsedSeconds).toBe(0);
    expect(result.elevationGainMeters).toBe(0);
    expect(result.elevationLossMeters).toBe(0);
    expect(result.currentSpeedMps).toBeNull();
    expect(result.gpsGapSecondsExcluded).toBe(5);
    expect(elapsedSecondsAt(result, 'ACTIVE', farAfterGap.timestamp)).toBe(20);
  });

  it('keeps counting the full ACTIVE interval after the last GPS fix', () => {
    const withFix = snapshot({ lastValidSample: previous });
    expect(elapsedSecondsAt(withFix, 'ACTIVE', '2026-09-16T07:00:20.000Z')).toBe(20);
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

    const higherPrevious = { ...previous, altitudeMeters: 910 };
    const lost = updateActivityMetrics(snapshot(), higherPrevious, sample({ altitudeMeters: 905 }), 'ACTIVE');
    expect(lost.elevationLossMeters).toBe(5);
  });
});
