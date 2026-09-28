import {
  defaultActivityEngineConfig,
  type ActivityEngineConfig,
} from './config';

export type OffRouteState = 'on_route' | 'uncertain' | 'off_route' | 'recovering';

export interface OffRouteEvidence {
  state: OffRouteState;
  outsideSamples: number;
  insideSamples: number;
}

export function createInitialOffRouteEvidence(): OffRouteEvidence {
  return {
    state: 'on_route',
    outsideSamples: 0,
    insideSamples: 0,
  };
}

export function updateOffRouteState(
  previous: OffRouteEvidence,
  distanceToRouteMeters: number,
  accuracyMeters: number,
  config: ActivityEngineConfig = defaultActivityEngineConfig,
): OffRouteEvidence {
  const effectiveCorridor = Math.max(
    config.offRouteBaseCorridorMeters,
    Math.max(0, accuracyMeters) * config.offRouteAccuracyMultiplier,
  );
  const isOutside = distanceToRouteMeters > effectiveCorridor;

  if (isOutside) {
    const outsideSamples = previous.outsideSamples + 1;

    return {
      state:
        outsideSamples >= config.offRouteSamplesToConfirm
          ? 'off_route'
          : 'uncertain',
      outsideSamples,
      insideSamples: 0,
    };
  }

  if (previous.state === 'off_route' || previous.state === 'recovering') {
    const insideSamples = previous.insideSamples + 1;
    const recovered = insideSamples >= config.offRouteSamplesToConfirm;

    return {
      state: recovered ? 'on_route' : 'recovering',
      outsideSamples: recovered ? 0 : previous.outsideSamples,
      insideSamples: recovered ? 0 : insideSamples,
    };
  }

  return createInitialOffRouteEvidence();
}
