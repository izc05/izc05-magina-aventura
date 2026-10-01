import type { RouteMapProps } from './map-types';

export const OPENFREEMAP_LIBERTY_STYLE_URL =
  'https://tiles.openfreemap.org/styles/liberty';

/** Approximate Bedmar town-center coordinates from a secondary profile; context only, never trail geometry. */
export const BEDMAR_APPROXIMATE_CENTER: [number, number] = [-3.412, 37.823];
export const BEDMAR_APPROXIMATE_ZOOM = 12;

export const MAP_BASE_REFERENCE_WARNING =
  'Mapa base de referencia; ruta y checkpoints no verificados; no usar para navegación';
export const MAP_BASE_OFFLINE_NOTICE =
  'La cartografía base requiere conexión; no se descargan ni precargan teselas para uso offline.';

export type BaseMapReferenceProps = Pick<
  RouteMapProps,
  'payload' | 'mapStyle' | 'baseMapOnly' | 'attribution' | 'showLayerControls'
>;

export function createBaseMapReferenceProps(): BaseMapReferenceProps {
  return {
    payload: null,
    mapStyle: OPENFREEMAP_LIBERTY_STYLE_URL,
    baseMapOnly: true,
    attribution: true,
    showLayerControls: false,
  };
}

export function getInitialMapViewState(
  payload: RouteMapProps['payload'],
  baseMapOnly: boolean,
) {
  if (payload && !baseMapOnly) {
    return {
      bounds: payload.bounds,
      padding: { top: 32, right: 32, bottom: 32, left: 32 },
    };
  }

  return {
    center: BEDMAR_APPROXIMATE_CENTER,
    zoom: BEDMAR_APPROXIMATE_ZOOM,
  };
}
