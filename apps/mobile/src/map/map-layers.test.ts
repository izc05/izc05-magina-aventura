import { describe, expect, it } from 'vitest';
import {
  buildCheckpointFeatureCollection,
  buildHikerPositionFeature,
  buildPOIFeatureCollection,
  sierraMaginaParkBoundaryGeoJSON,
  type DetailedPOI,
} from './map-layers';
import { MAP_THEMES, getMapTheme } from './map-theme';
import type { RouteMapCheckpoint } from '@magina-aventura/contracts';

describe('Map Layers & Theme Utilities', () => {
  it('builds checkpoint feature collection with correct properties', () => {
    const checkpoints: RouteMapCheckpoint[] = [
      { id: 'cp1', name: 'Start', position: [-3.4, 37.8], triggerRadiusM: 20, required: true },
      { id: 'cp2', name: 'End', position: [-3.5, 37.9], triggerRadiusM: 20, required: true },
    ];

    const fc = buildCheckpointFeatureCollection(checkpoints);
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features).toHaveLength(2);
    expect(fc.features[0]?.properties.isStart).toBe(true);
    expect(fc.features[1]?.properties.isFinish).toBe(true);
  });

  it('builds POI feature collection with category mapping', () => {
    const pois: DetailedPOI[] = [
      {
        id: 'poi1',
        category: 'flora',
        name: 'Bosque',
        description: 'Pinos',
        position: [-3.42, 37.82],
      },
    ];

    const fc = buildPOIFeatureCollection(pois);
    expect(fc.features[0]?.properties.category).toBe('flora');
    expect(fc.features[0]?.geometry.coordinates).toEqual([-3.42, 37.82]);
  });

  it('builds hiker position feature with heading angle', () => {
    const hiker = buildHikerPositionFeature([-3.41, 37.81], 90);
    expect(hiker.features[0]?.properties.heading).toBe(90);
    expect(hiker.features[0]?.geometry.coordinates).toEqual([-3.41, 37.81]);
  });

  it('contains valid Sierra Mágina Natural Park polygon boundary', () => {
    expect(sierraMaginaParkBoundaryGeoJSON.features[0]?.geometry.type).toBe('Polygon');
    expect(sierraMaginaParkBoundaryGeoJSON.features[0]?.geometry.coordinates[0]?.length).toBeGreaterThan(4);
  });

  it('retrieves all 4 defined themes (olive, topo, satellite, night)', () => {
    expect(Object.keys(MAP_THEMES)).toHaveLength(4);
    expect(getMapTheme('olive').id).toBe('olive');
    expect(getMapTheme('topo').id).toBe('topo');
    expect(getMapTheme('satellite').id).toBe('satellite');
    expect(getMapTheme('night').id).toBe('night');
  });
});
