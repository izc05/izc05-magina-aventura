import { describe, expect, it } from 'vitest';
import type { RouteLineFeature } from '@magina-aventura/contracts';
import { validateCanonicalGeometry } from './geometry-validation';

const feature = (coordinates: Array<readonly [number, number]>): RouteLineFeature => ({
  type: 'Feature',
  properties: { routeId: 'ma-test', geometryVersion: 1 },
  geometry: { type: 'LineString', coordinates: [...coordinates] },
});

describe('validateCanonicalGeometry', () => {
  it('accepts a plausible short route line', () => {
    const issues = validateCanonicalGeometry(
      feature([
        [-3.4, 37.7],
        [-3.39, 37.71],
      ]),
    );
    expect(issues).toEqual([]);
  });

  it('reports suspicious segment gaps over the configured threshold', () => {
    const issues = validateCanonicalGeometry(
      feature([
        [-3.4, 37.7],
        [-3.2, 37.9],
      ]),
      { maxSegmentKm: 5 },
    );
    expect(issues).toContainEqual(
      expect.objectContaining({ code: 'suspicious_segment_gap' }),
    );
  });

  it('reports zero-length geometry', () => {
    const issues = validateCanonicalGeometry(
      feature([
        [-3.4, 37.7],
        [-3.4, 37.7],
      ]),
    );
    expect(issues).toContainEqual(expect.objectContaining({ code: 'zero_length' }));
  });

  it('checks optional acceptance bounds without defining an official park boundary', () => {
    const issues = validateCanonicalGeometry(
      feature([
        [-3.4, 37.7],
        [-3.39, 37.71],
      ]),
      { acceptanceBounds: [-3.3, 37.6, -3.2, 37.8] },
    );
    expect(issues).toContainEqual(
      expect.objectContaining({ code: 'outside_acceptance_bounds' }),
    );
  });
});
