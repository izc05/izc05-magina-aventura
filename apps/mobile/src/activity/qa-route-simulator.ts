import type { GeoJsonPosition } from '@magina-aventura/contracts';

export type QaRouteSimulationMode =
  | 'replay'
  | 'walk_to_advance'
  | 'checkpoint_jump';

export interface QaRouteSimulationSnapshot {
  readonly qaSimulated: true;
  readonly mode: QaRouteSimulationMode;
  readonly virtualDistanceMeters: number;
  readonly routeProgress: number;
  readonly position: GeoJsonPosition;
  readonly completed: boolean;
}

const EARTH_RADIUS_METERS = 6_371_008.8;
const DEFAULT_STRIDE_METERS = 0.75;

function radians(value: number): number {
  return (value * Math.PI) / 180;
}

export function distanceMeters(
  from: GeoJsonPosition,
  to: GeoJsonPosition,
): number {
  const [lon1, lat1] = from;
  const [lon2, lat2] = to;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const lat1Rad = radians(lat1);
  const lat2Rad = radians(lat2);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function routeLengthMeters(route: readonly GeoJsonPosition[]): number {
  let total = 0;
  for (let index = 1; index < route.length; index += 1) {
    total += distanceMeters(route[index - 1]!, route[index]!);
  }
  return total;
}

export function virtualMetersFromSteps(
  steps: number,
  strideMeters: number = DEFAULT_STRIDE_METERS,
): number {
  if (!Number.isFinite(steps) || !Number.isFinite(strideMeters)) return 0;
  return Math.max(0, Math.floor(steps)) * Math.max(0, strideMeters);
}

export function positionAtDistance(
  route: readonly GeoJsonPosition[],
  requestedDistanceMeters: number,
): QaRouteSimulationSnapshot {
  if (route.length === 0) {
    throw new Error('QA route simulation requires at least one route position');
  }

  const total = routeLengthMeters(route);
  const clamped = Math.max(
    0,
    Math.min(Number.isFinite(requestedDistanceMeters) ? requestedDistanceMeters : 0, total),
  );

  if (route.length === 1 || total === 0) {
    return {
      qaSimulated: true,
      mode: 'replay',
      virtualDistanceMeters: 0,
      routeProgress: 1,
      position: route[0]!,
      completed: true,
    };
  }

  let traversed = 0;

  for (let index = 1; index < route.length; index += 1) {
    const start = route[index - 1]!;
    const end = route[index]!;
    const segment = distanceMeters(start, end);

    if (traversed + segment >= clamped) {
      const segmentProgress =
        segment === 0 ? 0 : (clamped - traversed) / segment;
      const [startLon, startLat] = start;
      const [endLon, endLat] = end;

      return {
        qaSimulated: true,
        mode: 'replay',
        virtualDistanceMeters: clamped,
        routeProgress: clamped / total,
        position: [
          startLon + (endLon - startLon) * segmentProgress,
          startLat + (endLat - startLat) * segmentProgress,
        ],
        completed: clamped >= total,
      };
    }

    traversed += segment;
  }

  return {
    qaSimulated: true,
    mode: 'replay',
    virtualDistanceMeters: total,
    routeProgress: 1,
    position: route[route.length - 1]!,
    completed: true,
  };
}

export function walkToAdvance(
  route: readonly GeoJsonPosition[],
  steps: number,
  strideMeters: number = DEFAULT_STRIDE_METERS,
): QaRouteSimulationSnapshot {
  const snapshot = positionAtDistance(
    route,
    virtualMetersFromSteps(steps, strideMeters),
  );

  return {
    ...snapshot,
    mode: 'walk_to_advance',
  };
}

export function jumpToQaPosition(
  position: GeoJsonPosition,
): QaRouteSimulationSnapshot {
  return {
    qaSimulated: true,
    mode: 'checkpoint_jump',
    virtualDistanceMeters: 0,
    routeProgress: 0,
    position: [...position] as GeoJsonPosition,
    completed: false,
  };
}
