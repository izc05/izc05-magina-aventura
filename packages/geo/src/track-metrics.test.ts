import { describe, expect, it } from 'vitest';
import type { RouteLineFeature } from '@magina-aventura/contracts';
import { calculateTrackMetrics } from './track-metrics';

const line: RouteLineFeature = {
  type: 'Feature',
  properties: { routeId: 'ma-test', geometryVersion: 1 },
  geometry: {
    type: 'LineString',
    coordinates: [
      [-3.4, 37.7],
      [-3.399, 37.701],
      [-3.398, 37.702],
    ],
  },
};

describe('calculateTrackMetrics', () => {
  it('calculates distance and elevation statistics deterministically', () => {
    const metrics = calculateTrackMetrics(line, [700, 720, 710]);
    expect(metrics.distanceKm).toBeGreaterThan(0);
    expect(metrics.ascentM).toBe(20);
    expect(metrics.descentM).toBe(10);
    expect(metrics.minElevationM).toBe(700);
    expect(metrics.maxElevationM).toBe(720);
  });

  it('keeps horizontal distance but returns null elevation metrics for incomplete elevation data', () => {
    const metrics = calculateTrackMetrics(line, [700, null, 710]);
    expect(metrics.distanceKm).toBeGreaterThan(0);
    expect(metrics.ascentM).toBeNull();
    expect(metrics.descentM).toBeNull();
    expect(metrics.minElevationM).toBeNull();
    expect(metrics.maxElevationM).toBeNull();
  });

  it('returns null elevation metrics when coordinate and elevation lengths differ', () => {
    const metrics = calculateTrackMetrics(line, [700, 720]);
    expect(metrics.ascentM).toBeNull();
    expect(metrics.maxElevationM).toBeNull();
  });
});
