import { describe, expect, it } from 'vitest';

import {
  jumpToQaPosition,
  positionAtDistance,
  routeLengthMeters,
  virtualMetersFromSteps,
  walkToAdvance,
} from './qa-route-simulator';

const route = [
  [-3.41, 37.82],
  [-3.409, 37.82],
  [-3.408, 37.82],
] as const;

describe('qa route simulator', () => {
  it('converts real steps into bounded virtual distance', () => {
    expect(virtualMetersFromSteps(100)).toBe(75);
    expect(virtualMetersFromSteps(-5)).toBe(0);
    expect(virtualMetersFromSteps(Number.NaN)).toBe(0);
  });

  it('interpolates a deterministic virtual position along a route', () => {
    const total = routeLengthMeters(route);
    const snapshot = positionAtDistance(route, total / 2);

    expect(snapshot.qaSimulated).toBe(true);
    expect(snapshot.routeProgress).toBeCloseTo(0.5, 4);
    expect(snapshot.completed).toBe(false);
    expect(snapshot.position[0]).toBeCloseTo(-3.409, 4);
  });

  it('clamps replay distance to the route end', () => {
    const total = routeLengthMeters(route);
    const snapshot = positionAtDistance(route, total * 10);

    expect(snapshot.virtualDistanceMeters).toBeCloseTo(total, 4);
    expect(snapshot.routeProgress).toBe(1);
    expect(snapshot.completed).toBe(true);
    expect(snapshot.position).toEqual(route[route.length - 1]);
  });

  it('keeps walk-to-advance explicitly marked as QA simulation', () => {
    const snapshot = walkToAdvance(route, 40, 1);

    expect(snapshot.mode).toBe('walk_to_advance');
    expect(snapshot.qaSimulated).toBe(true);
    expect(snapshot.virtualDistanceMeters).toBe(40);
  });

  it('supports checkpoint jumps without claiming physical progress', () => {
    const snapshot = jumpToQaPosition([-3.42, 37.83]);

    expect(snapshot.mode).toBe('checkpoint_jump');
    expect(snapshot.qaSimulated).toBe(true);
    expect(snapshot.virtualDistanceMeters).toBe(0);
    expect(snapshot.routeProgress).toBe(0);
    expect(snapshot.completed).toBe(false);
  });
});
