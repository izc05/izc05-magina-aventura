import type {
  GeoJsonPosition,
  RouteBounds,
  RouteMapCheckpoint,
  RouteMapDiscoveryHint,
  RouteMapPayload,
} from '@magina-aventura/contracts';

export type MapThemeId = 'olive' | 'topo' | 'satellite' | 'night';

export interface MapLayerVisibility {
  routeTrack: boolean;
  checkpoints: boolean;
  pois: boolean;
  parkBoundary: boolean;
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

// Sierra Mágina Natural Park Boundary approximate GeoJSON Polygon
export const sierraMaginaParkBoundaryGeoJSON = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      properties: { name: 'Parque Natural Sierra Mágina' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [-3.52, 37.85],
            [-3.38, 37.85],
            [-3.35, 37.75],
            [-3.40, 37.65],
            [-3.55, 37.66],
            [-3.58, 37.76],
            [-3.52, 37.85],
          ],
        ],
      },
    },
  ],
};

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

export const defaultLayerVisibility: MapLayerVisibility = {
  routeTrack: true,
  checkpoints: true,
  pois: true,
  parkBoundary: true,
  hikerPosition: true,
  elevationGrid: true,
};
