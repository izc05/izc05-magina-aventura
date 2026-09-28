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

  it('reports zero distance for a point exactly on the route', () => {
    const line: GeoJsonPosition[] = [
      [-4.01, 37],
      [-4, 37],
      [-3.99, 37],
    ];

    const result = nearestPointOnRoute([-4, 37], line);

    expect(result.distanceToRouteMeters).toBeCloseTo(0, 6);
    expect(result.distanceAlongRouteMeters / result.routeLengthMeters).toBeCloseTo(0.5, 2);
  });

  it('clamps progress to the nearest route endpoint outside the segment', () => {
    const line: GeoJsonPosition[] = [
      [-4, 37],
      [-3.99, 37],
    ];

    const before = nearestPointOnRoute([-4.01, 37], line);
    const after = nearestPointOnRoute([-3.98, 37], line);

    expect(before.distanceAlongRouteMeters).toBeCloseTo(0, 6);
    expect(after.distanceAlongRouteMeters).toBeCloseTo(after.routeLengthMeters, 6);
  });

  it('rejects a route with fewer than two coordinates', () => {
    expect(() => nearestPointOnRoute([-4, 37], [[-4, 37]])).toThrow(
      'Route line requires at least two coordinates',
    );
  });

  it('handles a zero-length segment without producing NaN', () => {
    const line: GeoJsonPosition[] = [
      [-4, 37],
      [-4, 37],
      [-3.99, 37],
    ];

    const result = nearestPointOnRoute([-4, 37.0001], line);

    expect(Number.isFinite(result.distanceToRouteMeters)).toBe(true);
    expect(Number.isFinite(result.distanceAlongRouteMeters)).toBe(true);
    expect(Number.isFinite(result.routeLengthMeters)).toBe(true);
  });
});
