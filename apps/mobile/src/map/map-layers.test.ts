import { describe, expect, it } from 'vitest';
import {
  buildBaseMapDeviceLocationFeature,
  buildCheckpointFeatureCollection,
  buildHikerPositionFeature,
  buildPOIFeatureCollection,
  buildRouteMapOverlayData,
  type DetailedPOI,
} from './map-layers';
import { MAP_THEMES, getMapTheme } from './map-theme';
import type { RouteMapCheckpoint } from '@magina-aventura/contracts';
import { mockRoutePayload } from '../features/routes/development-route-map-repository';

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

  it('returns no map overlays when route data is absent', () => {
    expect(buildRouteMapOverlayData(null)).toEqual({
      routeLine: null,
      checkpointShape: null,
      poiShape: null,
      hikerShape: null,
    });
  });

  it('suppresses mock route, checkpoint, POI and hiker geometry in base-only mode', () => {
    expect(buildRouteMapOverlayData(mockRoutePayload, true)).toEqual({
      routeLine: null,
      checkpointShape: null,
      poiShape: null,
      hikerShape: null,
    });
  });

  it('renders exactly one current-device Point on the base map and no route geometry', () => {
    const position = [-3.4123, 37.8234] as const;
    const marker = buildBaseMapDeviceLocationFeature(position, true);

    expect(marker).toEqual({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { role: 'device-location' },
        geometry: { type: 'Point', coordinates: position },
      }],
    });
    expect(marker?.features).toHaveLength(1);
    expect(marker?.features.map((feature) => feature.geometry.type)).toEqual(['Point']);
    expect(buildRouteMapOverlayData(mockRoutePayload, true)).toEqual({
      routeLine: null,
      checkpointShape: null,
      poiShape: null,
      hikerShape: null,
    });
  });

  it('never renders the device marker outside the technical base-map-only mode', () => {
    expect(buildBaseMapDeviceLocationFeature([-3.4123, 37.8234], false)).toBeNull();
    expect(buildBaseMapDeviceLocationFeature(null, true)).toBeNull();
  });

  it('retrieves all 4 defined themes (olive, topo, satellite, night)', () => {
    expect(Object.keys(MAP_THEMES)).toHaveLength(4);
    expect(getMapTheme('olive').id).toBe('olive');
    expect(getMapTheme('topo').id).toBe('topo');
    expect(getMapTheme('satellite').id).toBe('satellite');
    expect(getMapTheme('night').id).toBe('night');
  });
});
