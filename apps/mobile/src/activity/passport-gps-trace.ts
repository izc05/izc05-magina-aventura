import type { GeoJsonPosition } from '@magina-aventura/contracts';
import { defaultActivityEngineConfig } from '@magina-aventura/activity-engine';

import type { PassportGpsSample } from './activity-store';

export interface PassportGpsTraceMapData {
  /** Independent local line segments; never interpolate across a gap. */
  segments: GeoJsonPosition[][];
  /** west, south, east, north */
  cameraBounds: [number, number, number, number];
}

function cameraBoundsFor(segments: readonly (readonly GeoJsonPosition[])[]): PassportGpsTraceMapData['cameraBounds'] {
  const positions = segments.flat();
  const longitudes = positions.map(([longitude]) => longitude);
  const latitudes = positions.map(([, latitude]) => latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minSpan = 0.001;
  const longitudePadding = Math.max((maxLongitude - minLongitude) * 0.12, minSpan / 2);
  const latitudePadding = Math.max((maxLatitude - minLatitude) * 0.12, minSpan / 2);
  return [
    Math.max(-180, minLongitude - longitudePadding),
    Math.max(-90, minLatitude - latitudePadding),
    Math.min(180, maxLongitude + longitudePadding),
    Math.min(90, maxLatitude + latitudePadding),
  ];
}

function isUsableSegment(positions: readonly GeoJsonPosition[]): boolean {
  const first = positions[0];
  return positions.length >= 2 && Boolean(first) && positions.some(
    ([longitude, latitude]) => longitude !== first![0] || latitude !== first![1],
  );
}

/** Builds map geometry exclusively from validated, persisted device-GPS fixes. */
export function buildPassportGpsTrace(
  samples: readonly PassportGpsSample[],
): PassportGpsTraceMapData | null {
  if (samples.length < 2) return null;
  const segments: GeoJsonPosition[][] = [];
  let current: GeoJsonPosition[] = [];
  let previous: PassportGpsSample | null = null;
  let previousSequence = 0;

  const finishSegment = () => {
    if (isUsableSegment(current)) segments.push(current);
    current = [];
  };

  for (const sample of samples) {
    const timestampMs = Date.parse(sample.timestamp);
    if (
      !Number.isInteger(sample.sequence) || sample.sequence <= previousSequence ||
      !Number.isFinite(timestampMs) ||
      !Number.isFinite(sample.latitude) || !Number.isFinite(sample.longitude) ||
      !Number.isFinite(sample.accuracyMeters) || sample.accuracyMeters < 0 ||
      sample.validForMetrics !== (sample.rejectionReason === null)
    ) return null;

    const inRange = sample.latitude >= -90 && sample.latitude <= 90 &&
      sample.longitude >= -180 && sample.longitude <= 180;
    if (!inRange && !(sample.rejectionReason === 'invalid_coordinate' && !sample.validForMetrics)) {
      return null;
    }
    const accepted = sample.validForMetrics && inRange &&
      sample.accuracyMeters <= defaultActivityEngineConfig.maxAccuracyMeters;
    if (!accepted) {
      finishSegment();
      previous = null;
      previousSequence = sample.sequence;
      continue;
    }

    if (
      sample.activeIntervalStartedAt !== null &&
      (!Number.isFinite(Date.parse(sample.activeIntervalStartedAt)) ||
        Date.parse(sample.activeIntervalStartedAt) > timestampMs)
    ) return null;
    if (sample.activeIntervalStartedAt === null) {
      finishSegment();
      previous = null;
      previousSequence = sample.sequence;
      continue;
    }

    const position: GeoJsonPosition = [sample.longitude, sample.latitude];
    if (!previous) {
      current = [position];
    } else {
      const elapsedSeconds = (timestampMs - Date.parse(previous.timestamp)) / 1000;
      if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return null;
      const contiguous = sample.sequence === previous.sequence + 1;
      const sameInterval = sample.activeIntervalStartedAt === previous.activeIntervalStartedAt;
      const withinGap = elapsedSeconds <= defaultActivityEngineConfig.maxMetricSampleGapSeconds;
      if (!contiguous || !sameInterval || !withinGap) {
        finishSegment();
        current = [position];
      } else {
        current.push(position);
      }
    }
    previous = sample;
    previousSequence = sample.sequence;
  }

  finishSegment();
  if (segments.length === 0) return null;
  return { segments, cameraBounds: cameraBoundsFor(segments) };
}
