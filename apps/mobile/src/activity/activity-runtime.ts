import { createActivityController, type ActivityController } from './activity-controller';
import { expoLocationProvider } from './expo-location-provider';
import { sqliteActivityStore } from './sqlite-activity-store';
import { sqliteBackgroundLocationInbox } from './sqlite-background-location-inbox';

function createActivityId(): string {
  const bytes = new Uint8Array(16);
  const secureRandom = globalThis.crypto?.getRandomValues?.bind(globalThis.crypto);
  if (secureRandom) {
    secureRandom(bytes);
  } else {
    // React Native release builds may not expose Web Crypto. Activity IDs only
    // need local uniqueness/idempotency, not cryptographic unpredictability.
    const seed = `${Date.now()}:${Math.random()}:${Math.random()}`;
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = (seed.charCodeAt(index % seed.length) + index * 37) & 0xff;
    }
  }

  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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
