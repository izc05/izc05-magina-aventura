import type {
  LocationPermissionStatus,
  NativeLocationAdapter,
} from './location-provider';

export const ACTIVITY_LOCATION_TASK = 'magina-aventura-active-location-v1';

export interface ExpoLocationPermissionResponse {
  status: string;
}

export interface ExpoLocationApi {
  Accuracy: {
    High: number;
  };
  hasServicesEnabledAsync(): Promise<boolean>;
  getForegroundPermissionsAsync(): Promise<ExpoLocationPermissionResponse>;
  requestForegroundPermissionsAsync(): Promise<ExpoLocationPermissionResponse>;
  getBackgroundPermissionsAsync(): Promise<ExpoLocationPermissionResponse>;
  requestBackgroundPermissionsAsync(): Promise<ExpoLocationPermissionResponse>;
  hasStartedLocationUpdatesAsync(taskName: string): Promise<boolean>;
  startLocationUpdatesAsync(
    taskName: string,
    options: Record<string, unknown>,
  ): Promise<void>;
  stopLocationUpdatesAsync(taskName: string): Promise<void>;
}

function normalizePermission(status: string): LocationPermissionStatus {
  if (status === 'granted' || status === 'denied') return status;
  return 'undetermined';
}

export function createExpoLocationAdapter(
  api: ExpoLocationApi,
): NativeLocationAdapter {
  return {
    isServicesEnabled: () => api.hasServicesEnabledAsync(),

    async getForegroundPermission() {
      const response = await api.getForegroundPermissionsAsync();
      return normalizePermission(response.status);
    },

    async requestForegroundPermission() {
      const response = await api.requestForegroundPermissionsAsync();
      return normalizePermission(response.status);
    },

    async getBackgroundPermission() {
      const response = await api.getBackgroundPermissionsAsync();
      return normalizePermission(response.status);
    },

    async requestBackgroundPermission() {
      const response = await api.requestBackgroundPermissionsAsync();
      return normalizePermission(response.status);
    },

    hasStartedBackgroundUpdates: () =>
      api.hasStartedLocationUpdatesAsync(ACTIVITY_LOCATION_TASK),

    async startBackgroundUpdates(activityId: string) {
      // The activity is persisted locally before tracking starts. The background
      // task resolves the active session from SQLite, so Android task options do
      // not carry application-specific identifiers.
      void activityId;
      await api.startLocationUpdatesAsync(ACTIVITY_LOCATION_TASK, {
        accuracy: api.Accuracy.High,
        distanceInterval: 8,
        deferredUpdatesDistance: 24,
        deferredUpdatesInterval: 15000,
        foregroundService: {
          notificationTitle: 'Mágina Aventura · Ruta en curso',
          notificationBody: 'Registrando tu recorrido aunque bloquees la pantalla.',
          killServiceOnDestroy: false,
        },
      });
    },

    stopBackgroundUpdates: () =>
      api.stopLocationUpdatesAsync(ACTIVITY_LOCATION_TASK),
  };
}
