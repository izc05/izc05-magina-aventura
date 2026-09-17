import { describe, expect, it } from 'vitest';
import type { LocationSample } from '@magina-aventura/contracts';
import { presentEmergency } from './emergency-presenter';

function makeSample(overrides?: Partial<LocationSample>): LocationSample {
  return {
    sequence: 1,
    timestamp: '2026-09-17T12:30:00Z',
    latitude: 37.7654,
    longitude: -3.4321,
    accuracyMeters: 8.5,
    altitudeMeters: 1250,
    speedMps: 0.5,
    headingDegrees: 180,
    validForMetrics: true,
    rejectionReason: null,
    ...overrides,
  };
}

describe('emergency-presenter', () => {
  it('returns available state with formatted coordinates from valid sample', () => {
    const result = presentEmergency(makeSample(), 'activity-abc');

    expect(result.positionState).toBe('available');
    expect(result.coordinates).not.toBeNull();
    expect(result.coordinates!.decimalDisplay).toBe('37.765400, -3.432100');
    expect(result.coordinates!.latitudeDMS).toContain('N');
    expect(result.coordinates!.longitudeDMS).toContain('O');
    expect(result.coordinates!.accuracyM).toBe(9); // rounded
    expect(result.coordinates!.altitudeM).toBe(1250);
    expect(result.copyableCoordinates).toBe('37.765400, -3.432100');
    expect(result.activityReference).toBe('activity-abc');
  });

  it('returns unavailable state without fabricating coordinates when no sample', () => {
    const result = presentEmergency(null, 'activity-abc');

    expect(result.positionState).toBe('unavailable');
    expect(result.coordinates).toBeNull();
    expect(result.copyableCoordinates).toBeNull();
    // activityReference still available for emergency context
    expect(result.activityReference).toBe('activity-abc');
  });

  it('handles null altitude gracefully', () => {
    const result = presentEmergency(makeSample({ altitudeMeters: null }), null);

    expect(result.positionState).toBe('available');
    expect(result.coordinates!.altitudeM).toBeNull();
  });

  it('handles no activity reference', () => {
    const result = presentEmergency(null, null);

    expect(result.positionState).toBe('unavailable');
    expect(result.activityReference).toBeNull();
  });

  it('formats south/west coordinates with correct labels', () => {
    const result = presentEmergency(
      makeSample({ latitude: -33.86, longitude: -70.65 }),
      null,
    );

    expect(result.coordinates!.latitudeDMS).toContain('S');
    expect(result.coordinates!.longitudeDMS).toContain('O');
  });
});
