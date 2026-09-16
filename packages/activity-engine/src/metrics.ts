import type {
  ActivitySnapshot,
  ActivityState,
  LocationSample,
} from '@magina-aventura/contracts';
import { distanceMeters } from '@magina-aventura/geo';

import {
  defaultActivityEngineConfig,
  type ActivityEngineConfig,
} from './config';

function elapsedSecondsBetween(
  previous: LocationSample,
  current: LocationSample,
): number | null {
  const previousMs = Date.parse(previous.timestamp);
  const currentMs = Date.parse(current.timestamp);

  if (!Number.isFinite(previousMs) || !Number.isFinite(currentMs)) return null;

  const elapsed = (currentMs - previousMs) / 1000;
  return elapsed > 0 ? elapsed : null;
}

export function updateActivityMetrics(
  snapshot: ActivitySnapshot,
  previousAccepted: LocationSample | null,
  sample: LocationSample,
  state: ActivityState,
  config: ActivityEngineConfig = defaultActivityEngineConfig,
): ActivitySnapshot {
  const base: ActivitySnapshot = {
    ...snapshot,
    state,
    lastProcessedSequence: Math.max(snapshot.lastProcessedSequence, sample.sequence),
  };

  if (!sample.validForMetrics || !previousAccepted?.validForMetrics) {
    return sample.validForMetrics
      ? { ...base, lastValidSample: sample }
      : base;
  }

  const elapsedSeconds = elapsedSecondsBetween(previousAccepted, sample);
  if (elapsedSeconds === null) return base;

  const totalElapsedSeconds = snapshot.totalElapsedSeconds + elapsedSeconds;

  if (state !== 'ACTIVE') {
    return {
      ...base,
      totalElapsedSeconds,
      lastValidSample: sample,
      currentSpeedMps: null,
      paceSecondsPerKm: null,
    };
  }

  const segmentDistanceMeters = distanceMeters(
    { latitude: previousAccepted.latitude, longitude: previousAccepted.longitude },
    { latitude: sample.latitude, longitude: sample.longitude },
  );
  const currentSpeedMps = segmentDistanceMeters / elapsedSeconds;
  const paceSecondsPerKm =
    segmentDistanceMeters > 0
      ? elapsedSeconds / (segmentDistanceMeters / 1000)
      : null;

  let elevationGainMeters = snapshot.elevationGainMeters;
  let elevationLossMeters = snapshot.elevationLossMeters;

  if (
    previousAccepted.altitudeMeters !== null &&
    sample.altitudeMeters !== null
  ) {
    const altitudeDelta = sample.altitudeMeters - previousAccepted.altitudeMeters;

    if (Math.abs(altitudeDelta) >= config.elevationNoiseThresholdMeters) {
      if (altitudeDelta > 0) elevationGainMeters += altitudeDelta;
      if (altitudeDelta < 0) elevationLossMeters += Math.abs(altitudeDelta);
    }
  }

  return {
    ...base,
    validDistanceMeters: snapshot.validDistanceMeters + segmentDistanceMeters,
    totalElapsedSeconds,
    movingElapsedSeconds: snapshot.movingElapsedSeconds + elapsedSeconds,
    currentSpeedMps,
    paceSecondsPerKm,
    elevationGainMeters,
    elevationLossMeters,
    lastValidSample: sample,
  };
}
