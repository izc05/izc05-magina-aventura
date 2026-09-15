import { describe, expect, it } from 'vitest';
import { distanceMeters } from './distance';

describe('distanceMeters', () => {
  it('returns zero for the same point', () => {
    const point = { latitude: 37.823, longitude: -3.413 };
    expect(distanceMeters(point, point)).toBe(0);
  });

  it('returns approximately 111.2 km for one degree of latitude', () => {
    const value = distanceMeters(
      { latitude: 37, longitude: -3 },
      { latitude: 38, longitude: -3 },
    );

    expect(value).toBeGreaterThan(111_000);
    expect(value).toBeLessThan(111_400);
  });
});
