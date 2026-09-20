import type {
  LocationPermissionState,
  LocationProvider,
  ForegroundLocationPoint,
} from './location-provider';

export interface SimulatedLocationProvider extends LocationProvider {
  emit(point: ForegroundLocationPoint): Promise<void>;
  reset(): void;
}

/**
 * DEV/test-only provider. It emits through the same foreground callback used by
 * the real provider; the ActivityController, normalization, engine, inbox and
 * SQLite paths are unchanged.
 */
export function createSimulatedLocationProvider(): SimulatedLocationProvider {
  let callback: ((point: ForegroundLocationPoint) => void | Promise<void>) | null = null;
  let started = false;
  const permissions: LocationPermissionState = {
    foregroundGranted: true,
    backgroundGranted: false,
    servicesEnabled: true,
  };

  return {
    async getPermissionState() {
      return { ...permissions };
    },
    async requestAdventurePermissions() {
      return { ...permissions };
    },
    async start(_activityId, onForegroundLocation) {
      if (!onForegroundLocation) {
        throw new Error('The DEV simulator requires a foreground callback');
      }
      callback = onForegroundLocation;
      started = true;
    },
    async stop() {
      started = false;
      callback = null;
    },
    async emit(point) {
      if (!started || !callback) {
        throw new Error('The DEV location simulator is not running');
      }
      await callback(point);
    },
    reset() {
      started = false;
      callback = null;
    },
  };
}
