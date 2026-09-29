import type { GeoJsonPosition } from '@magina-aventura/contracts';
import { nearestPointOnRoute } from '@magina-aventura/geo';

export interface RouteProgressResult {
  currentProgress: number;
  maxProgress: number;
  distanceToRouteMeters: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function calculateRouteProgress(
  position: GeoJsonPosition,
  routeLine: readonly GeoJsonPosition[],
  previousMaxProgress: number,
): RouteProgressResult {
  const projection = nearestPointOnRoute(position, routeLine);
  const currentProgress =
    projection.routeLengthMeters > 0
      ? clamp01(projection.distanceAlongRouteMeters / projection.routeLengthMeters)
      : 0;

  return {
    currentProgress,
    maxProgress: clamp01(Math.max(previousMaxProgress, currentProgress)),
    distanceToRouteMeters: projection.distanceToRouteMeters,
  };
}
