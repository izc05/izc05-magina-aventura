export interface ActivityEngineConfig {
  maxAccuracyMeters: number;
  maxHikingSpeedMps: number;
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
  elevationNoiseThresholdMeters: 3,
  offRouteBaseCorridorMeters: 35,
  offRouteAccuracyMultiplier: 1.5,
  offRouteSamplesToConfirm: 3,
  snapshotEveryAcceptedSamples: 10,
  snapshotEverySeconds: 15,
};
