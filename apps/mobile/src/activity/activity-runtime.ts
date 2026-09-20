import { createActivityController, type ActivityController } from './activity-controller';
import { expoLocationProvider } from './expo-location-provider';
import { sqliteActivityStore } from './sqlite-activity-store';
import { sqliteBackgroundLocationInbox } from './sqlite-background-location-inbox';
import { createSimulatedLocationProvider } from './simulated-location-provider';

function createActivityId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;

  const bytes = globalThis.crypto?.getRandomValues?.(new Uint8Array(16));
  if (bytes) {
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  throw new Error('Secure UUID generation is unavailable');
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

/** Explicit DEV-only simulator runtime; never selected for a production slug. */
export const devSimulationLocationProvider = createSimulatedLocationProvider();
export const devSimulationRuntime = createActivityRuntime(devSimulationLocationProvider);

export function getActivityRuntime(slug?: string): ActivityController {
  if (__DEV__ && slug === 'dev-adventure-engine-test') {
    return devSimulationRuntime;
  }
  return activityRuntime;
}
