export interface ActivityEngineConfig {
  maxAccuracyMeters: number;
  maxHikingSpeedMps: number;
  /** Fixes farther apart than this do not form a GPS-derived metrics segment. */
  maxMetricSampleGapSeconds: number;
  elevationNoiseThresholdMeters: number;
  offRouteBaseCorridorMeters: number;
  offRouteAccuracyMultiplier: number;
  offRouteSamplesToConfirm: number;
  snapshotEveryAcceptedSamples: number;
  snapshotEverySeconds: number;
}

export const defaultActivityEngineConfig: ActivityEngineConfig = {
  maxAccuracyMeters: 50,
  maxHikingSpeedMps: 4.5,
  // Three foreground intervals (5 s each), matching Android's 15 s deferred updates.
  maxMetricSampleGapSeconds: 15,
  elevationNoiseThresholdMeters: 3,
  offRouteBaseCorridorMeters: 35,
  offRouteAccuracyMultiplier: 1.5,
  offRouteSamplesToConfirm: 3,
  snapshotEveryAcceptedSamples: 10,
  snapshotEverySeconds: 15,
};
