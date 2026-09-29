import { describe, expect, it } from 'vitest';
import type { GeoJsonPosition } from '@magina-aventura/contracts';

import { calculateRouteProgress } from './route-progress';

const route: GeoJsonPosition[] = [
  [-4.01, 37],
  [-4, 37],
  [-3.99, 37],
];

describe('calculateRouteProgress', () => {
  it('projects a position onto the route and exposes current progress', () => {
    const result = calculateRouteProgress([-4, 37.0001], route, 0);

    expect(result.currentProgress).toBeGreaterThan(0.49);
    expect(result.currentProgress).toBeLessThan(0.51);
    expect(result.maxProgress).toBeCloseTo(result.currentProgress, 4);
    expect(result.distanceToRouteMeters).toBeGreaterThan(0);
  });

  it('keeps visual max progress monotonic when GPS projects backwards', () => {
    const result = calculateRouteProgress([-4.005, 37], route, 0.8);

    expect(result.currentProgress).toBeLessThan(0.8);
    expect(result.maxProgress).toBe(0.8);
  });

  it('clamps progress to the valid zero-to-one interval', () => {
    const start = calculateRouteProgress([-4.02, 37], route, 0);
    const end = calculateRouteProgress([-3.98, 37], route, start.maxProgress);

    expect(start.currentProgress).toBeGreaterThanOrEqual(0);
    expect(end.currentProgress).toBeLessThanOrEqual(1);
    expect(end.maxProgress).toBeLessThanOrEqual(1);
  });
});
