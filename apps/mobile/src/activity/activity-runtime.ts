import { createActivityController, type ActivityController } from './activity-controller';
import { expoLocationProvider } from './expo-location-provider';
import { sqliteActivityStore } from './sqlite-activity-store';
import { sqliteBackgroundLocationInbox } from './sqlite-background-location-inbox';

function bytesToUuid(bytes: Uint8Array): string {
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Activity ids are local uniqueness identifiers, not credentials or secrets.
 *
 * Prefer the Web Crypto implementation when the runtime exposes it. Hermes on
 * some Android builds does not currently expose randomUUID/getRandomValues, so
 * keep a React-Native-safe UUID v4 fallback instead of preventing a route from
 * starting. The fallback mixes wall/monotonic time with Math.random to avoid
 * practical collisions for local activity sessions.
 */
export function createActivityId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;

  const secureBytes = globalThis.crypto?.getRandomValues?.(new Uint8Array(16));
  if (secureBytes) return bytesToUuid(secureBytes);

  const bytes = new Uint8Array(16);
  let timeSeed = Date.now();
  const monotonicSeed =
    typeof globalThis.performance?.now === 'function'
      ? Math.floor(globalThis.performance.now() * 1000)
      : 0;

  for (let index = 0; index < bytes.length; index += 1) {
    const randomByte = Math.floor(Math.random() * 256);
    const timeByte = timeSeed & 0xff;
    const monotonicByte = (monotonicSeed >>> ((index % 4) * 8)) & 0xff;
    bytes[index] = randomByte ^ timeByte ^ monotonicByte;
    timeSeed = Math.floor(timeSeed / 256);
  }

  return bytesToUuid(bytes);
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
