import { describe, expect, it } from 'vitest';
import { validateRouteLineFeature } from './route-line';

describe('validateRouteLineFeature', () => {
  const base = {
    type: 'Feature' as const,
    properties: { routeId: 'route-1', geometryVersion: 1 },
    geometry: {
      type: 'LineString' as const,
      coordinates: [[-3.5, 37.7], [-3.4, 37.71]] as [number, number][],
    },
  };

  it('accepts a valid line', () => {
    expect(validateRouteLineFeature(base)).toEqual(base);
  });

  it('rejects fewer than two coordinates', () => {
    expect(() => validateRouteLineFeature({
      ...base,
      geometry: { ...base.geometry, coordinates: [[-3.5, 37.7]] },
    })).toThrow('Route requires at least two coordinates');
  });

  it('rejects invalid latitude', () => {
    expect(() => validateRouteLineFeature({
      ...base,
      geometry: { ...base.geometry, coordinates: [[-3.5, 91], [-3.4, 37.7]] },
    })).toThrow('Invalid latitude');
  });

  it('rejects invalid longitude', () => {
    expect(() => validateRouteLineFeature({
      ...base,
      geometry: { ...base.geometry, coordinates: [[181, 37.7], [-3.4, 37.7]] },
    })).toThrow('Invalid longitude');
  });
});
