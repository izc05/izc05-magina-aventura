export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface ForegroundLocationPoint {
  timestampMs: number;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  altitudeMeters: number | null;
  speedMps: number | null;
  headingDegrees: number | null;
}

export interface LocationPermissionState {
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  servicesEnabled: boolean;
}

export type LocationCaptureSource = 'device-gps' | 'mock';

export interface NativeLocationAdapter {
  isServicesEnabled(): Promise<boolean>;
  getForegroundPermission(): Promise<LocationPermissionStatus>;
  requestForegroundPermission(): Promise<LocationPermissionStatus>;
  getBackgroundPermission(): Promise<LocationPermissionStatus>;
  requestBackgroundPermission(): Promise<LocationPermissionStatus>;
  hasStartedBackgroundUpdates(): Promise<boolean>;
  startBackgroundUpdates(activityId: string): Promise<void>;
  stopBackgroundUpdates(): Promise<void>;
  startForegroundUpdates(onLocation: (point: ForegroundLocationPoint) => void): Promise<void>;
  stopForegroundUpdates(): Promise<void>;
}

export interface LocationProvider {
  readonly recordingSource: LocationCaptureSource;
  getPermissionState(): Promise<LocationPermissionState>;
  requestAdventurePermissions(): Promise<LocationPermissionState>;
  start(
    activityId: string,
    onForegroundLocation?: (point: ForegroundLocationPoint) => void,
  ): Promise<void>;
  stop(): Promise<void>;
}

function granted(status: LocationPermissionStatus): boolean {
  return status === 'granted';
}

export function createLocationProvider(
  adapter: NativeLocationAdapter,
  recordingSource: LocationCaptureSource = 'mock',
): LocationProvider {
  return {
    recordingSource,
    async getPermissionState(): Promise<LocationPermissionState> {
      const [servicesEnabled, foreground, background] = await Promise.all([
        adapter.isServicesEnabled(),
        adapter.getForegroundPermission(),
        adapter.getBackgroundPermission(),
      ]);

      return {
        foregroundGranted: granted(foreground),
        backgroundGranted: granted(background),
        servicesEnabled,
      };
    },

    async requestAdventurePermissions(): Promise<LocationPermissionState> {
      const servicesEnabled = await adapter.isServicesEnabled();
      const foreground = await adapter.requestForegroundPermission();

      if (!granted(foreground)) {
        return {
          foregroundGranted: false,
          backgroundGranted: false,
          servicesEnabled,
        };
      }

      // Background permission is deliberately not requested during activity
      // startup. Android may move this flow to system settings and some OEMs
      // are unstable when a foreground service is started immediately after.
      // First prove foreground GPS on the physical QA gate; background tracking
      // is enabled in a separate, explicit step once foreground is stable.
      const background = await adapter.getBackgroundPermission();
      return {
        foregroundGranted: true,
        backgroundGranted: granted(background),
        servicesEnabled,
      };
    },

    async start(activityId: string, onForegroundLocation): Promise<void> {
      const servicesEnabled = await adapter.isServicesEnabled();
      if (!servicesEnabled) {
        throw new Error('Location services are disabled');
      }

      const foreground = await adapter.getForegroundPermission();
      if (!granted(foreground)) {
        throw new Error('Foreground location permission is required');
      }

      // Foreground tracking is the safe baseline for physical QA. Do not
      // automatically start the Android foreground/background service here,
      // even if the user granted background permission in an earlier build.
      // This isolates native service crashes from the core GPS/session gate.
      void activityId;

      if (!onForegroundLocation) {
        throw new Error('Foreground location callback is required without background permission');
      }
      await adapter.startForegroundUpdates(onForegroundLocation);
    },

    async stop(): Promise<void> {
      const started = await adapter.hasStartedBackgroundUpdates();
      if (started) await adapter.stopBackgroundUpdates();
      await adapter.stopForegroundUpdates();
    },
  };
}
