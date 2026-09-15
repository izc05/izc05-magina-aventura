import { describe, expect, it } from 'vitest';
import type { GeoJsonPosition } from '@magina-aventura/contracts';

import { nearestPointOnRoute } from './nearest-point-on-line';

describe('nearestPointOnRoute', () => {
  it('projects a point onto a synthetic route and reports distance along the line', () => {
    const line: GeoJsonPosition[] = [
      [-4.01, 37],
      [-4, 37],
      [-3.99, 37],
    ];
    const position: GeoJsonPosition = [-4, 37.0005];

    const result = nearestPointOnRoute(position, line);

    expect(result.distanceToRouteMeters).toBeGreaterThan(50);
    expect(result.distanceToRouteMeters).toBeLessThan(60);
    expect(result.routeLengthMeters).toBeGreaterThan(1_700);
    expect(result.routeLengthMeters).toBeLessThan(1_900);
    expect(result.distanceAlongRouteMeters / result.routeLengthMeters).toBeCloseTo(0.5, 2);
  });
});
