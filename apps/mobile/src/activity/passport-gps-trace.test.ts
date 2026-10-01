import { describe, expect, it } from 'vitest';

import type { PassportGpsSample } from './activity-store';
import { buildPassportGpsTrace } from './passport-gps-trace';

// Coordenadas de fixture sintéticas, limitadas a pruebas y ajenas a ubicaciones de usuarios.
function sample(
  sequence: number,
  seconds: number,
  overrides: Partial<PassportGpsSample> = {},
): PassportGpsSample {
  return {
    sequence,
    timestamp: new Date(Date.UTC(2026, 8, 28, 8, 0, seconds)).toISOString(),
    latitude: 37.5 + sequence * 0.001,
    longitude: -3.5 - sequence * 0.001,
    accuracyMeters: 6,
    validForMetrics: true,
    rejectionReason: null,
    activeIntervalStartedAt: '2026-09-28T08:00:00.000Z',
    ...overrides,
  };
}

describe('buildPassportGpsTrace', () => {
  it('builds local line geometry and padded bounds from accepted persisted samples', () => {
    const trace = buildPassportGpsTrace([sample(1, 0), sample(2, 5)]);
    expect(trace?.segments).toEqual([[[-3.501, 37.501], [-3.502, 37.502]]]);
    expect(trace?.cameraBounds[0]).toBeLessThan(-3.501);
    expect(trace?.cameraBounds[2]).toBeGreaterThan(-3.502);
  });

  it('does not draw through a rejected sample', () => {
    const trace = buildPassportGpsTrace([
      sample(1, 0),
      sample(2, 5, { validForMetrics: false, rejectionReason: 'poor_accuracy' }),
      sample(3, 10),
      sample(4, 15),
    ]);
    expect(trace?.segments).toEqual([[[-3.503, 37.503], [-3.504, 37.504]]]);
  });

  it('splits long timestamp gaps, missing sequences, and resumed intervals', () => {
    const longGap = buildPassportGpsTrace([
      sample(1, 0), sample(2, 5), sample(3, 30), sample(4, 35),
    ]);
    const sequenceGap = buildPassportGpsTrace([
      sample(1, 0), sample(2, 5), sample(4, 10), sample(5, 15),
    ]);
    const resumed = buildPassportGpsTrace([
      sample(1, 0), sample(2, 5),
      sample(3, 10, { activeIntervalStartedAt: '2026-09-28T08:00:09.000Z' }),
      sample(4, 15, { activeIntervalStartedAt: '2026-09-28T08:00:09.000Z' }),
    ]);
    expect(longGap?.segments).toHaveLength(2);
    expect(sequenceGap?.segments).toHaveLength(2);
    expect(resumed?.segments).toHaveLength(2);
  });

  it('does not create a map without two distinct usable fixes in any segment', () => {
    expect(buildPassportGpsTrace([sample(1, 0)])).toBeNull();
    expect(buildPassportGpsTrace([
      sample(1, 0), sample(2, 5, { latitude: 37.501, longitude: -3.501 }),
    ])).toBeNull();
    expect(buildPassportGpsTrace([
      sample(1, 0), sample(2, 20),
    ])).toBeNull();
  });

  it('rejects corrupt accepted coordinates, timestamps, order, or sample flags', () => {
    expect(buildPassportGpsTrace([sample(1, 0, { latitude: 91 }), sample(2, 5)])).toBeNull();
    expect(buildPassportGpsTrace([sample(1, 0), sample(2, 5, { timestamp: 'invalid' })])).toBeNull();
    expect(buildPassportGpsTrace([sample(2, 0), sample(1, 5)])).toBeNull();
    expect(buildPassportGpsTrace([
      sample(1, 0), sample(2, 5, { validForMetrics: false, rejectionReason: null }),
    ])).toBeNull();
  });
});
