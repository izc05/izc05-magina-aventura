import * as Crypto from 'expo-crypto';

import { createActivityController, type ActivityController } from './activity-controller';
import { expoLocationProvider } from './expo-location-provider';
import { sqliteActivityStore } from './sqlite-activity-store';
import { sqliteBackgroundLocationInbox } from './sqlite-background-location-inbox';

function createActivityId(): string {
  return Crypto.randomUUID();
}

export function createActivityRuntime(
  locationProvider = expoLocationProvider,
): ActivityController {
  return createActivityController({
    store: sqliteActivityStore,
    inbox: sqliteBackgroundLocationInbox,
    locationProvider,
    createActivityId,
    now: () => new Date().toISOString(),
  });
}

export const activityRuntime = createActivityRuntime();
