import type { RouteLineFeature } from '@magina-aventura/contracts';
import { distanceMeters } from './distance';

export interface TrackMetrics {
  distanceKm: number;
  ascentM: number | null;
  descentM: number | null;
  minElevationM: number | null;
  maxElevationM: number | null;
}

export function calculateTrackMetrics(
  line: RouteLineFeature,
  elevationsM: Array<number | null>,
): TrackMetrics {
  const coordinates = line.geometry.coordinates;
  let distanceM = 0;

  for (let index = 1; index < coordinates.length; index += 1) {
    const previous = coordinates[index - 1]!;
    const current = coordinates[index]!;
    distanceM += distanceMeters(
      { longitude: previous[0], latitude: previous[1] },
      { longitude: current[0], latitude: current[1] },
    );
  }

  const elevationsUsable =
    elevationsM.length === coordinates.length &&
    elevationsM.every(
      (value): value is number => value !== null && Number.isFinite(value),
    );

  if (!elevationsUsable) {
    return {
      distanceKm: distanceM / 1000,
      ascentM: null,
      descentM: null,
      minElevationM: null,
      maxElevationM: null,
    };
  }

  let ascentM = 0;
  let descentM = 0;
  let minElevationM = elevationsM[0]!;
  let maxElevationM = elevationsM[0]!;

  for (let index = 1; index < elevationsM.length; index += 1) {
    const previous = elevationsM[index - 1]!;
    const current = elevationsM[index]!;
    const delta = current - previous;

    if (delta > 0) ascentM += delta;
    if (delta < 0) descentM += Math.abs(delta);

    minElevationM = Math.min(minElevationM, current);
    maxElevationM = Math.max(maxElevationM, current);
  }

  return {
    distanceKm: distanceM / 1000,
    ascentM,
    descentM,
    minElevationM,
    maxElevationM,
  };
}
