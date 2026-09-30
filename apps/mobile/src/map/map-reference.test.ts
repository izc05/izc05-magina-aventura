import { describe, expect, it } from 'vitest';

import {
  BEDMAR_APPROXIMATE_CENTER,
  BEDMAR_APPROXIMATE_ZOOM,
  createBaseMapReferenceProps,
  getInitialMapViewState,
  MAP_BASE_REFERENCE_WARNING,
  OPENFREEMAP_LIBERTY_STYLE_URL,
} from './map-reference';
import { mockRoutePayload } from '../features/routes/development-route-map-repository';

describe('base map reference configuration', () => {
  it('uses OpenFreeMap Liberty and keeps MapLibre attribution enabled', () => {
    const props = createBaseMapReferenceProps();

    expect(OPENFREEMAP_LIBERTY_STYLE_URL)
      .toBe('https://tiles.openfreemap.org/styles/liberty');
    expect(props.mapStyle).toBe(OPENFREEMAP_LIBERTY_STYLE_URL);
    expect(props.attribution).toBe(true);
    expect(props.payload).toBeNull();
    expect(props.baseMapOnly).toBe(true);
    expect(props.showLayerControls).toBe(false);
    expect(MAP_BASE_REFERENCE_WARNING)
      .toBe('Mapa base de referencia; ruta y checkpoints no verificados; no usar para navegación');
  });

  it('falls back to the approximate Bedmar town context when no route data exists', () => {
    expect(getInitialMapViewState(null, false)).toEqual({
      center: BEDMAR_APPROXIMATE_CENTER,
      zoom: BEDMAR_APPROXIMATE_ZOOM,
    });
  });

  it('keeps the approximate town camera in base-only mode even if route data is accidentally supplied', () => {
    expect(getInitialMapViewState(mockRoutePayload, true)).toEqual({
      center: BEDMAR_APPROXIMATE_CENTER,
      zoom: BEDMAR_APPROXIMATE_ZOOM,
    });
  });
});
