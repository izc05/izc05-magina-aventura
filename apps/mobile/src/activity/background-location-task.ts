import * as TaskManager from 'expo-task-manager';

import {
  handleBackgroundLocations,
  type ExpoBackgroundLocation,
} from './background-location-handler';
import { ACTIVITY_LOCATION_TASK } from './expo-location-adapter';
import { sqliteActivityStore } from './sqlite-activity-store';
import { sqliteBackgroundLocationInbox } from './sqlite-background-location-inbox';

type LocationTaskData = {
  locations?: ExpoBackgroundLocation[];
};

TaskManager.defineTask(ACTIVITY_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;

  const locations = (data as LocationTaskData).locations ?? [];
  if (locations.length === 0) return;

  try {
    await handleBackgroundLocations(locations, {
      store: sqliteActivityStore,
      inbox: sqliteBackgroundLocationInbox,
    });
  } catch {
    // The background callback must not crash the headless runtime.
    // Durable SQLite state is reconciled when the app is opened again.
  }
});
