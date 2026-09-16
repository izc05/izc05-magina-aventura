export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface LocationPermissionState {
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  servicesEnabled: boolean;
}

export interface NativeLocationAdapter {
  isServicesEnabled(): Promise<boolean>;
  getForegroundPermission(): Promise<LocationPermissionStatus>;
  requestForegroundPermission(): Promise<LocationPermissionStatus>;
  getBackgroundPermission(): Promise<LocationPermissionStatus>;
  requestBackgroundPermission(): Promise<LocationPermissionStatus>;
  hasStartedBackgroundUpdates(): Promise<boolean>;
  startBackgroundUpdates(activityId: string): Promise<void>;
  stopBackgroundUpdates(): Promise<void>;
}

export interface LocationProvider {
  getPermissionState(): Promise<LocationPermissionState>;
  requestAdventurePermissions(): Promise<LocationPermissionState>;
  start(activityId: string): Promise<void>;
  stop(): Promise<void>;
}

function granted(status: LocationPermissionStatus): boolean {
  return status === 'granted';
}

export function createLocationProvider(adapter: NativeLocationAdapter): LocationProvider {
  return {
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

      const background = await adapter.requestBackgroundPermission();
      return {
        foregroundGranted: true,
        backgroundGranted: granted(background),
        servicesEnabled,
      };
    },

    async start(activityId: string): Promise<void> {
      const servicesEnabled = await adapter.isServicesEnabled();
      if (!servicesEnabled) {
        throw new Error('Location services are disabled');
      }

      const foreground = await adapter.getForegroundPermission();
      if (!granted(foreground)) {
        throw new Error('Foreground location permission is required');
      }

      const background = await adapter.getBackgroundPermission();
      if (!granted(background)) {
        throw new Error('Background location permission is required');
      }

      const alreadyStarted = await adapter.hasStartedBackgroundUpdates();
      if (alreadyStarted) return;
      await adapter.startBackgroundUpdates(activityId);
    },

    async stop(): Promise<void> {
      const started = await adapter.hasStartedBackgroundUpdates();
      if (!started) return;
      await adapter.stopBackgroundUpdates();
    },
  };
}
