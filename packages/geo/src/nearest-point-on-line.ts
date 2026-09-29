import type { GeoJsonPosition } from '@magina-aventura/contracts';

import { distanceMeters } from './distance';

export interface NearestPointOnRouteResult {
  distanceToRouteMeters: number;
  distanceAlongRouteMeters: number;
  routeLengthMeters: number;
}

const METERS_PER_DEGREE_LATITUDE = 111_132;
const METERS_PER_DEGREE_LONGITUDE_AT_EQUATOR = 111_320;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function segmentProjection(
  position: GeoJsonPosition,
  start: GeoJsonPosition,
  end: GeoJsonPosition,
): { t: number; distanceMeters: number } {
  const referenceLatitudeRadians = (((start[1] + end[1]) / 2) * Math.PI) / 180;
  const metersPerDegreeLongitude =
    METERS_PER_DEGREE_LONGITUDE_AT_EQUATOR * Math.cos(referenceLatitudeRadians);

  const segmentX = (end[0] - start[0]) * metersPerDegreeLongitude;
  const segmentY = (end[1] - start[1]) * METERS_PER_DEGREE_LATITUDE;
  const pointX = (position[0] - start[0]) * metersPerDegreeLongitude;
  const pointY = (position[1] - start[1]) * METERS_PER_DEGREE_LATITUDE;

  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
  const t =
    segmentLengthSquared === 0
      ? 0
      : clamp01((pointX * segmentX + pointY * segmentY) / segmentLengthSquared);

  const deltaX = pointX - t * segmentX;
  const deltaY = pointY - t * segmentY;

  return {
    t,
    distanceMeters: Math.hypot(deltaX, deltaY),
  };
}

export function nearestPointOnRoute(
  position: GeoJsonPosition,
  line: readonly GeoJsonPosition[],
): NearestPointOnRouteResult {
  if (line.length < 2) {
    throw new Error('Route line requires at least two coordinates');
  }

  let routeLengthMeters = 0;
  const segmentLengths: number[] = [];

  for (let index = 0; index < line.length - 1; index += 1) {
    const start = line[index];
    const end = line[index + 1];

    if (!start || !end) continue;

    const length = distanceMeters(
      { longitude: start[0], latitude: start[1] },
      { longitude: end[0], latitude: end[1] },
    );
    segmentLengths.push(length);
    routeLengthMeters += length;
  }

  let bestDistanceMeters = Number.POSITIVE_INFINITY;
  let bestDistanceAlongRouteMeters = 0;
  let accumulatedMeters = 0;

  for (let index = 0; index < line.length - 1; index += 1) {
    const start = line[index];
    const end = line[index + 1];
    const segmentLengthMeters = segmentLengths[index];

    if (!start || !end || segmentLengthMeters === undefined) continue;

    const projection = segmentProjection(position, start, end);

    if (projection.distanceMeters < bestDistanceMeters) {
      bestDistanceMeters = projection.distanceMeters;
      bestDistanceAlongRouteMeters =
        accumulatedMeters + segmentLengthMeters * projection.t;
    }

    accumulatedMeters += segmentLengthMeters;
  }

  return {
    distanceToRouteMeters: bestDistanceMeters,
    distanceAlongRouteMeters: bestDistanceAlongRouteMeters,
    routeLengthMeters,
  };
}
