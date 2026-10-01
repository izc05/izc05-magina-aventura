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
  earlier: string,
  later: string,
): number | null {
  const earlierMs = Date.parse(earlier);
  const laterMs = Date.parse(later);

  if (!Number.isFinite(earlierMs) || !Number.isFinite(laterMs)) return null;
  return Math.max(0, (laterMs - earlierMs) / 1000);
}

/**
 * Returns committed lifecycle ACTIVE time plus the current START/RESUME interval.
 * This is active elapsed time, not GPS-estimated walking time. GPS gaps affect
 * only GPS-derived metrics/segments; they never stop or shorten this clock.
 */
export function elapsedSecondsAt(
  snapshot: ActivitySnapshot,
  state: ActivityState,
  at: string,
): number {
  if (state !== 'ACTIVE') return snapshot.totalElapsedSeconds;

  const intervalStartedAt = snapshot.activeIntervalStartedAt ?? snapshot.createdAt;
  const intervalSeconds = elapsedSecondsBetween(intervalStartedAt, at);
  if (intervalSeconds === null) return snapshot.totalElapsedSeconds;
  return snapshot.totalElapsedSeconds + intervalSeconds;
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

  // Samples racing with pause/finish cannot change timing, position, or distance.
  if (state !== 'ACTIVE' || !sample.validForMetrics) return base;

  if (!previousAccepted?.validForMetrics) {
    return {
      ...base,
      lastValidSample: sample,
      currentSpeedMps: null,
      paceSecondsPerKm: null,
    };
  }

  const elapsedSeconds = elapsedSecondsBetween(previousAccepted.timestamp, sample.timestamp);
  if (elapsedSeconds === null || elapsedSeconds <= 0) return base;

  if (elapsedSeconds > config.maxMetricSampleGapSeconds) {
    // Use this fix as the next segment reference, but do not derive distance,
    // elevation, moving time, or speed across the long GPS gap. The lifecycle-
    // based ACTIVE clock is unaffected.
    return {
      ...base,
      gpsGapSecondsExcluded:
        (snapshot.gpsGapSecondsExcluded ?? 0) +
        (elapsedSeconds - config.maxMetricSampleGapSeconds),
      currentSpeedMps: null,
      paceSecondsPerKm: null,
      lastValidSample: sample,
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
    movingElapsedSeconds: snapshot.movingElapsedSeconds + elapsedSeconds,
    currentSpeedMps,
    paceSecondsPerKm,
    elevationGainMeters,
    elevationLossMeters,
    lastValidSample: sample,
  };
}
