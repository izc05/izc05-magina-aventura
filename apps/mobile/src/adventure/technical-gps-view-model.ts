import {
  elapsedSecondsAt,
  type ActivityEngineState,
} from '@magina-aventura/activity-engine';
import type { GeoJsonPosition, LocationSample } from '@magina-aventura/contracts';

export interface TechnicalGpsMetricsViewModel {
  sessionState: ActivityEngineState['session']['state'] | null;
  distanceKm: number | null;
  elapsedSeconds: number | null;
  gpsSamples: number | null;
  deviceLocationSample: LocationSample | null;
  devicePosition: GeoJsonPosition | null;
  deviceLocationState: 'waiting' | 'available' | 'degraded' | 'paused' | 'finished' | 'unavailable';
}

// Match three of the existing 5-second foreground watch intervals; this only
// expires the displayed pin and does not start or alter GPS sampling.
const DEVICE_POSITION_FRESHNESS_MS = 15_000;

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
      deviceLocationSample: null,
      devicePosition: null,
      deviceLocationState: 'waiting',
    };
  }

  const latestEngineSample = activity.acceptedSample ?? activity.rejectedSample;
  const sampleAgeMs = latestEngineSample
    ? nowMs - Date.parse(latestEngineSample.timestamp)
    : Number.NaN;
  const hasFreshSample = Number.isFinite(sampleAgeMs) &&
    sampleAgeMs >= 0 &&
    sampleAgeMs < DEVICE_POSITION_FRESHNESS_MS;
  const isActiveDeviceGps =
    activity.session.state === 'ACTIVE' &&
    activity.session.recordingSource === 'device-gps';
  const hasValidCoordinates = latestEngineSample !== null &&
    hasFreshSample &&
    Number.isFinite(latestEngineSample.latitude) &&
    latestEngineSample.latitude >= -90 &&
    latestEngineSample.latitude <= 90 &&
    Number.isFinite(latestEngineSample.longitude) &&
    latestEngineSample.longitude >= -180 &&
    latestEngineSample.longitude <= 180;
  const deviceLocationSample = isActiveDeviceGps && hasValidCoordinates
    ? latestEngineSample
    : null;
  const deviceLocationState = activity.session.state === 'PAUSED'
    ? 'paused'
    : activity.session.state === 'FINISHED' ||
        activity.session.state === 'VALIDATING' ||
        activity.session.state === 'VERIFIED' ||
        activity.session.state === 'REJECTED'
      ? 'finished'
      : activity.session.state === 'ACTIVE' && activity.session.recordingSource !== 'device-gps'
        ? 'unavailable'
        : deviceLocationSample
          ? deviceLocationSample.validForMetrics ? 'available' : 'degraded'
          : 'waiting';

  return {
    sessionState: activity.session.state,
    distanceKm: activity.snapshot.validDistanceMeters / 1000,
    elapsedSeconds: elapsedSecondsAt(
      activity.snapshot,
      activity.session.state,
      new Date(nowMs).toISOString(),
    ),
    gpsSamples: activity.session.lastProcessedSequence,
    deviceLocationSample,
    devicePosition: deviceLocationSample
      ? [deviceLocationSample.longitude, deviceLocationSample.latitude]
      : null,
    deviceLocationState,
  };
}
