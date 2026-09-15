export interface ActivityEngineConfig {
  maxAccuracyMeters: number;
  maxHikingSpeedMps: number;
}

export const defaultActivityEngineConfig: ActivityEngineConfig = {
  maxAccuracyMeters: 50,
  maxHikingSpeedMps: 4.5,
};
