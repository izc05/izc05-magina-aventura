import type { LocationSample } from '@magina-aventura/contracts';
import { describe, expect, it } from 'vitest';

import { trackToGeoJson } from './track-geojson';

function sample(
  sequence: number,
  longitude: number,
  latitude: number,
  validForMetrics: boolean,
): LocationSample {
  return {
    sequence,
    timestamp: `2026-09-16T12:00:0${sequence}.000Z`,
    latitude,
    longitude,
    accuracyMeters: 6,
    altitudeMeters: 900,
    speedMps: 1,
    headingDegrees: 90,
    validForMetrics,
    rejectionReason: validForMetrics ? null : 'poor_accuracy',
  };
}

describe('trackToGeoJson', () => {
  it('includes only accepted metric samples in route order', () => {
    const feature = trackToGeoJson([
      sample(1, -3.4101, 37.8201, true),
      sample(2, -3.4102, 37.8202, false),
      sample(3, -3.4103, 37.8203, true),
    ]);

    expect(feature).toEqual({
      type: 'Feature',
      properties: { kind: 'activity-track' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-3.4101, 37.8201],
          [-3.4103, 37.8203],
        ],
      },
    });
  });
});
