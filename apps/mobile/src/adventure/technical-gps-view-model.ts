import {
  elapsedSecondsAt,
  type ActivityEngineState,
} from '@magina-aventura/activity-engine';

export interface TechnicalGpsMetricsViewModel {
  sessionState: ActivityEngineState['session']['state'] | null;
  distanceKm: number | null;
  elapsedSeconds: number | null;
  gpsSamples: number | null;
}

/** Projects only metrics recorded by the Activity Engine, never route fixtures. */
export function technicalGpsMetricsViewModel(
  activity: ActivityEngineState | null,
  nowMs: number,
): TechnicalGpsMetricsViewModel {
  if (!activity) {
    return {
      sessionState: null,
      distanceKm: null,
      elapsedSeconds: null,
      gpsSamples: null,
    };
  }

  return {
    sessionState: activity.session.state,
    distanceKm: activity.snapshot.validDistanceMeters / 1000,
    elapsedSeconds: elapsedSecondsAt(
      activity.snapshot,
      activity.session.state,
      new Date(nowMs).toISOString(),
    ),
    gpsSamples: activity.session.lastProcessedSequence,
  };
}
