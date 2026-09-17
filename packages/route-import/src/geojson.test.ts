import { describe, expect, it } from 'vitest';
import { parseGeoJsonRoute } from './geojson';

describe('parseGeoJsonRoute', () => {
  it('normalizes a GeoJSON LineString feature', () => {
    const imported = parseGeoJsonRoute(
      JSON.stringify({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [-3.4, 37.7],
            [-3.39, 37.71],
          ],
        },
      }),
      'ma-001',
      1,
    );

    expect(imported.line.properties).toEqual({
      routeId: 'ma-001',
      geometryVersion: 1,
    });
    expect(imported.start).toEqual([-3.4, 37.7]);
    expect(imported.metrics.distanceKm).toBeGreaterThan(0);
    expect(imported.metrics.ascentM).toBeNull();
  });

  it('rejects non-LineString geometry', () => {
    expect(() =>
      parseGeoJsonRoute(
        JSON.stringify({
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [] },
        }),
        'ma-001',
        1,
      ),
    ).toThrow('GeoJSON must be a Feature with LineString geometry');
  });

  it('rejects malformed JSON', () => {
    expect(() => parseGeoJsonRoute('{', 'ma-001', 1)).toThrow(
      'Invalid GeoJSON JSON',
    );
  });

  it('rejects empty LineString geometry', () => {
    expect(() =>
      parseGeoJsonRoute(
        JSON.stringify({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] },
        }),
        'ma-001',
        1,
      ),
    ).toThrow('Route requires at least two coordinates');
  });
});
