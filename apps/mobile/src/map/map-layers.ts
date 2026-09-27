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

export interface ElevationProfilePoint {
  distanceKm: number;
  elevationM: number;
}

export interface EnhancedRoutePayload extends RouteMapPayload {
  pois?: DetailedPOI[];
  elevationProfile?: ElevationProfilePoint[];
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

export function buildElevationSegmentFeatureCollection(
  coordinates: GeoJsonPosition[],
  profile: ElevationProfilePoint[],
) {
  const emptyCollection = {
    type: 'FeatureCollection' as const,
    features: [] as Array<{
      type: 'Feature';
      properties: {
        startElevationM: number;
        endElevationM: number;
        elevationM: number;
        elevationRatio: number;
      };
      geometry: { type: 'LineString'; coordinates: GeoJsonPosition[] };
    }>,
  };

  if (coordinates.length < 2 || profile.length < 2) return emptyCollection;
  if (coordinates.some(([longitude, latitude]) =>
    !Number.isFinite(longitude)
      || !Number.isFinite(latitude)
      || Math.abs(longitude) > 180
      || Math.abs(latitude) > 90,
  )) return emptyCollection;

  const uniqueSamples = new Map<number, number>();
  for (const sample of profile) {
    if (
      Number.isFinite(sample.distanceKm)
      && sample.distanceKm >= 0
      && Number.isFinite(sample.elevationM)
    ) uniqueSamples.set(sample.distanceKm, sample.elevationM);
  }
  const samples = [...uniqueSamples.entries()]
    .map(([distanceKm, elevationM]) => ({ distanceKm, elevationM }))
    .sort((left, right) => left.distanceKm - right.distanceKm);
  if (samples.length < 2) return emptyCollection;

  const segmentLengths = coordinates.slice(1).map((position, index) =>
    haversineDistanceKm(coordinates[index]!, position),
  );
  const routeLengthKm = segmentLengths.reduce((total, length) => total + length, 0);
  if (!Number.isFinite(routeLengthKm) || routeLengthKm <= 0) return emptyCollection;

  const elevationBounds = samples.reduce(
    (bounds, sample) => ({
      min: Math.min(bounds.min, sample.elevationM),
      max: Math.max(bounds.max, sample.elevationM),
    }),
    { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
  );
  const minElevationM = elevationBounds.min;
  const elevationRangeM = elevationBounds.max - elevationBounds.min;
  const profileStartKm = samples[0]!.distanceKm;
  const profileDistanceRangeKm = samples[samples.length - 1]!.distanceKm - profileStartKm;
  if (profileDistanceRangeKm <= 0) return emptyCollection;

  let cumulativeDistanceKm = 0;
  const elevationsAtVertices = coordinates.map((_, index) => {
    if (index > 0) cumulativeDistanceKm += segmentLengths[index - 1]!;
    const routeProgress = cumulativeDistanceKm / routeLengthKm;
    const profileDistanceKm = profileStartKm + profileDistanceRangeKm * routeProgress;
    return interpolateElevation(samples, profileDistanceKm);
  });

  const features = coordinates.slice(1).flatMap((position, index) => {
    if (segmentLengths[index]! <= 0) return [];
    const startElevationM = elevationsAtVertices[index]!;
    const endElevationM = elevationsAtVertices[index + 1]!;
    const elevationM = (startElevationM + endElevationM) / 2;
    const elevationRatio = elevationRangeM === 0
      ? 0.5
      : Math.max(0, Math.min(1, (elevationM - minElevationM) / elevationRangeM));

    return [{
      type: 'Feature' as const,
      properties: { startElevationM, endElevationM, elevationM, elevationRatio },
      geometry: {
        type: 'LineString' as const,
        coordinates: [coordinates[index]!, position],
      },
    }];
  });

  return { type: 'FeatureCollection' as const, features };
}

function interpolateElevation(
  samples: ElevationProfilePoint[],
  distanceKm: number,
): number {
  if (distanceKm <= samples[0]!.distanceKm) return samples[0]!.elevationM;
  const last = samples[samples.length - 1]!;
  if (distanceKm >= last.distanceKm) return last.elevationM;

  for (let index = 1; index < samples.length; index += 1) {
    const right = samples[index]!;
    if (distanceKm > right.distanceKm) continue;
    const left = samples[index - 1]!;
    const spanKm = right.distanceKm - left.distanceKm;
    const progress = spanKm === 0 ? 1 : (distanceKm - left.distanceKm) / spanKm;
    return left.elevationM + (right.elevationM - left.elevationM) * progress;
  }

  return last.elevationM;
}

function haversineDistanceKm(start: GeoJsonPosition, end: GeoJsonPosition): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(end[1] - start[1]);
  const longitudeDelta = radians(end[0] - start[0]);
  const startLatitude = radians(start[1]);
  const endLatitude = radians(end[1]);
  const rawHaversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  const haversine = Math.max(0, Math.min(1, rawHaversine));
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}
