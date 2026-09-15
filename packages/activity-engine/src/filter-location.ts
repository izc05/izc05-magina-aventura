import type {
  LocationRejectionReason,
  LocationSample,
} from '@magina-aventura/contracts';
import { distanceMeters } from '@magina-aventura/geo';

import {
  defaultActivityEngineConfig,
  type ActivityEngineConfig,
} from './config';

export interface RawLocationSample {
  sequence: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  altitudeMeters: number | null;
  speedMps: number | null;
  headingDegrees: number | null;
}

function toLocationSample(
  raw: RawLocationSample,
  validForMetrics: boolean,
  rejectionReason: LocationRejectionReason | null,
): LocationSample {
  return {
    ...raw,
    validForMetrics,
    rejectionReason,
  };
}

function hasValidCoordinates(raw: RawLocationSample): boolean {
  return (
    Number.isFinite(raw.latitude) &&
    Number.isFinite(raw.longitude) &&
    raw.latitude >= -90 &&
    raw.latitude <= 90 &&
    raw.longitude >= -180 &&
    raw.longitude <= 180
  );
}

export function normalizeLocationSample(
  raw: RawLocationSample,
  previous: LocationSample | null,
  config: ActivityEngineConfig = defaultActivityEngineConfig,
): LocationSample {
  if (!hasValidCoordinates(raw)) {
    return toLocationSample(raw, false, 'invalid_coordinate');
  }

  const timestampMs = Date.parse(raw.timestamp);
  const previousTimestampMs = previous ? Date.parse(previous.timestamp) : null;

  if (
    !Number.isFinite(timestampMs) ||
    (previousTimestampMs !== null &&
      (!Number.isFinite(previousTimestampMs) || timestampMs <= previousTimestampMs))
  ) {
    return toLocationSample(raw, false, 'non_monotonic_time');
  }

  if (
    !Number.isFinite(raw.accuracyMeters) ||
    raw.accuracyMeters < 0 ||
    raw.accuracyMeters > config.maxAccuracyMeters
  ) {
    return toLocationSample(raw, false, 'poor_accuracy');
  }

  if (
    raw.speedMps !== null &&
    Number.isFinite(raw.speedMps) &&
    raw.speedMps > config.maxHikingSpeedMps
  ) {
    return toLocationSample(raw, false, 'impossible_speed');
  }

  if (previous?.validForMetrics && previousTimestampMs !== null) {
    const elapsedSeconds = (timestampMs - previousTimestampMs) / 1000;
    const traveledMeters = distanceMeters(
      { latitude: previous.latitude, longitude: previous.longitude },
      { latitude: raw.latitude, longitude: raw.longitude },
    );
    const derivedSpeedMps = traveledMeters / elapsedSeconds;

    if (derivedSpeedMps > config.maxHikingSpeedMps) {
      return toLocationSample(raw, false, 'impossible_speed');
    }
  }

  return toLocationSample(raw, true, null);
}
