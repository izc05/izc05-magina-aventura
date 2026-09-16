import * as TaskManager from 'expo-task-manager';

import { handleBackgroundLocations, type ExpoBackgroundLocation } from './background-location-handler';
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
    // The task must never crash the background runtime. Pending native
    // deliveries can be redelivered by the OS and the inbox is idempotent.
  }
});
