import type {
  GeoJsonPosition,
  RouteBounds,
  RouteLineFeature,
} from '@magina-aventura/contracts';
import {
  calculateRouteBounds,
  calculateTrackMetrics,
  validateRouteLineFeature,
  type TrackMetrics,
} from '@magina-aventura/geo';

export interface ImportedGeoJsonRoute {
  line: RouteLineFeature;
  start: GeoJsonPosition;
  bounds: RouteBounds;
  metrics: TrackMetrics;
}

type UnknownFeature = {
  type?: unknown;
  properties?: unknown;
  geometry?: {
    type?: unknown;
    coordinates?: unknown;
  };
};

const isPosition = (value: unknown): value is GeoJsonPosition =>
  Array.isArray(value) &&
  value.length >= 2 &&
  typeof value[0] === 'number' &&
  typeof value[1] === 'number';

export function parseGeoJsonRoute(
  json: string,
  routeId: string,
  geometryVersion: number,
): ImportedGeoJsonRoute {
  let parsed: UnknownFeature;

  try {
    parsed = JSON.parse(json) as UnknownFeature;
  } catch {
    throw new Error('Invalid GeoJSON JSON');
  }

  if (
    parsed.type !== 'Feature' ||
    parsed.geometry?.type !== 'LineString' ||
    !Array.isArray(parsed.geometry.coordinates)
  ) {
    throw new Error('GeoJSON must be a Feature with LineString geometry');
  }

  const coordinates = parsed.geometry.coordinates;
  if (!coordinates.every(isPosition)) {
    throw new Error('GeoJSON LineString contains invalid coordinates');
  }

  const line: RouteLineFeature = {
    type: 'Feature',
    properties: { routeId, geometryVersion },
    geometry: {
      type: 'LineString',
      coordinates: coordinates.map(
        ([longitude, latitude]) => [longitude, latitude] as GeoJsonPosition,
      ),
    },
  };

  validateRouteLineFeature(line);

  return {
    line,
    start: line.geometry.coordinates[0]!,
    bounds: calculateRouteBounds(line.geometry.coordinates),
    metrics: calculateTrackMetrics(line, []),
  };
}
