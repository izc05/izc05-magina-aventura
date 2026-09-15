import type { GeoJsonPosition, RouteBounds } from '@magina-aventura/contracts';

export function calculateRouteBounds(
  positions: readonly GeoJsonPosition[],
): RouteBounds {
  if (positions.length < 2) {
    throw new Error('Route requires at least two coordinates');
  }

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const [longitude, latitude] of positions) {
    west = Math.min(west, longitude);
    east = Math.max(east, longitude);
    south = Math.min(south, latitude);
    north = Math.max(north, latitude);
  }

  return [west, south, east, north];
}
