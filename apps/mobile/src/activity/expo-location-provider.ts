import * as Location from 'expo-location';

import {
  createExpoLocationAdapter,
  type ExpoLocationApi,
} from './expo-location-adapter';
import { createLocationProvider } from './location-provider';

const expoLocationApi: ExpoLocationApi = {
  Accuracy: {
    High: Location.Accuracy.High,
  },
  hasServicesEnabledAsync: () => Location.hasServicesEnabledAsync(),
  getForegroundPermissionsAsync: () => Location.getForegroundPermissionsAsync(),
  requestForegroundPermissionsAsync: () => Location.requestForegroundPermissionsAsync(),
  getBackgroundPermissionsAsync: () => Location.getBackgroundPermissionsAsync(),
  requestBackgroundPermissionsAsync: () => Location.requestBackgroundPermissionsAsync(),
  hasStartedLocationUpdatesAsync: (taskName) =>
    Location.hasStartedLocationUpdatesAsync(taskName),
  startLocationUpdatesAsync: (taskName, options) =>
    Location.startLocationUpdatesAsync(
      taskName,
      options as Location.LocationTaskOptions,
    ),
  stopLocationUpdatesAsync: (taskName) =>
    Location.stopLocationUpdatesAsync(taskName),
};

export const expoLocationAdapter = createExpoLocationAdapter(expoLocationApi);
export const expoLocationProvider = createLocationProvider(expoLocationAdapter);
