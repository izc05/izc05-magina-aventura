import { createActivityController } from './activity-controller';
import { expoLocationProvider } from './expo-location-provider';
import { sqliteActivityStore } from './sqlite-activity-store';
import { sqliteBackgroundLocationInbox } from './sqlite-background-location-inbox';

function createActivityId(): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `activity-${time}-${random}`;
}

export const activityRuntime = createActivityController({
  store: sqliteActivityStore,
  inbox: sqliteBackgroundLocationInbox,
  locationProvider: expoLocationProvider,
  createActivityId,
  now: () => new Date().toISOString(),
});
