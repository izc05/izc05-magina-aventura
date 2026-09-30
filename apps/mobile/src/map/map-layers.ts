import type {
  GeoJsonPosition,
  RouteMapCheckpoint,
  RouteMapDiscoveryHint,
  RouteMapPayload,
} from '@magina-aventura/contracts';

export type MapThemeId = 'olive' | 'topo' | 'satellite' | 'night';

export interface MapLayerVisibility {
  routeTrack: boolean;
  checkpoints: boolean;
  pois: boolean;
  hikerPosition: boolean;
  elevationGrid: boolean;
}

export interface DetailedPOI extends RouteMapDiscoveryHint {
  name: string;
  description: string;
  position: GeoJsonPosition;
  altitudeM?: number;
}

export interface EnhancedRoutePayload extends RouteMapPayload {
  pois?: DetailedPOI[];
  elevationProfile?: { distanceKm: number; elevationM: number }[];
  hikerPosition?: GeoJsonPosition;
  hikerHeadingDeg?: number;
}

export function buildCheckpointFeatureCollection(
  checkpoints: RouteMapCheckpoint[],
) {
  return {
    type: 'FeatureCollection' as const,
    features: checkpoints.map((cp, idx) => ({
      type: 'Feature' as const,
      properties: {
        id: cp.id,
        name: cp.name,
        required: cp.required,
        isStart: idx === 0,
        isFinish: idx === checkpoints.length - 1,
        stepNumber: idx + 1,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: cp.position,
      },
    })),
  };
}

export function buildPOIFeatureCollection(pois: DetailedPOI[]) {
  return {
    type: 'FeatureCollection' as const,
    features: pois.map((poi) => ({
      type: 'Feature' as const,
      properties: {
        id: poi.id,
        name: poi.name,
        category: poi.category,
        description: poi.description,
        altitudeM: poi.altitudeM ?? 0,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: poi.position,
      },
    })),
  };
}

export function buildHikerPositionFeature(
  position: GeoJsonPosition,
  headingDeg: number = 0,
) {
  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: { heading: headingDeg },
        geometry: {
          type: 'Point' as const,
          coordinates: position,
        },
      },
    ],
  };
}

export interface RouteMapOverlayData {
  routeLine: RouteMapPayload['line'] | null;
  checkpointShape: ReturnType<typeof buildCheckpointFeatureCollection> | null;
  poiShape: ReturnType<typeof buildPOIFeatureCollection> | null;
  hikerShape: ReturnType<typeof buildHikerPositionFeature> | null;
}

/**
 * The caller controls whether route data is authoritative before it is rendered.
 * Reference-map mode suppresses even a mistakenly supplied payload.
 */
export function buildRouteMapOverlayData(
  payload: EnhancedRoutePayload | RouteMapPayload | null,
  baseMapOnly = false,
): RouteMapOverlayData {
  if (!payload || baseMapOnly) {
    return {
      routeLine: null,
      checkpointShape: null,
      poiShape: null,
      hikerShape: null,
    };
  }

  const enhancedPayload = payload as EnhancedRoutePayload;

  return {
    routeLine: payload.line,
    checkpointShape: buildCheckpointFeatureCollection(payload.checkpoints),
    poiShape: enhancedPayload.pois?.length
      ? buildPOIFeatureCollection(enhancedPayload.pois)
      : null,
    hikerShape: enhancedPayload.hikerPosition
      ? buildHikerPositionFeature(
          enhancedPayload.hikerPosition,
          enhancedPayload.hikerHeadingDeg ?? 45,
        )
      : null,
  };
}

export const defaultLayerVisibility: MapLayerVisibility = {
  routeTrack: true,
  checkpoints: true,
  pois: true,
  hikerPosition: true,
  elevationGrid: true,
};
