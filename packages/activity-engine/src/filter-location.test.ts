import { describe, expect, it } from 'vitest';
import type { LocationSample } from '@magina-aventura/contracts';

import { defaultActivityEngineConfig } from './config';
import { normalizeLocationSample, type RawLocationSample } from './filter-location';

const previous: LocationSample = {
  sequence: 1,
  timestamp: '2026-09-15T10:00:00.000Z',
  latitude: 37,
  longitude: -4,
  accuracyMeters: 8,
  altitudeMeters: 900,
  speedMps: 1,
  headingDegrees: 90,
  validForMetrics: true,
  rejectionReason: null,
};

function raw(overrides: Partial<RawLocationSample> = {}): RawLocationSample {
  return {
    sequence: 2,
    timestamp: '2026-09-15T10:00:05.000Z',
    latitude: 37.00001,
    longitude: -4,
    accuracyMeters: 8,
    altitudeMeters: 901,
    speedMps: 1.1,
    headingDegrees: 90,
    ...overrides,
  };
}

describe('normalizeLocationSample', () => {
  it('rejects coordinates outside valid latitude/longitude ranges', () => {
    const sample = normalizeLocationSample(raw({ latitude: 91 }), previous, defaultActivityEngineConfig);
    expect(sample.validForMetrics).toBe(false);
    expect(sample.rejectionReason).toBe('invalid_coordinate');
  });

  it('rejects non-monotonic timestamps', () => {
    const sample = normalizeLocationSample(
      raw({ timestamp: previous.timestamp }),
      previous,
      defaultActivityEngineConfig,
    );
    expect(sample.validForMetrics).toBe(false);
    expect(sample.rejectionReason).toBe('non_monotonic_time');
  });

  it('rejects poor GPS accuracy', () => {
    const sample = normalizeLocationSample(raw({ accuracyMeters: 51 }), previous, defaultActivityEngineConfig);
    expect(sample.validForMetrics).toBe(false);
    expect(sample.rejectionReason).toBe('poor_accuracy');
  });

  it('rejects physically implausible derived hiking speed', () => {
    const sample = normalizeLocationSample(
      raw({ latitude: 37.001, speedMps: null }),
      previous,
      defaultActivityEngineConfig,
    );
    expect(sample.validForMetrics).toBe(false);
    expect(sample.rejectionReason).toBe('impossible_speed');
  });

  it('accepts a good sample and preserves its sequence', () => {
    const sample = normalizeLocationSample(raw(), previous, defaultActivityEngineConfig);
    expect(sample.validForMetrics).toBe(true);
    expect(sample.rejectionReason).toBeNull();
    expect(sample.sequence).toBe(2);
  });
});
