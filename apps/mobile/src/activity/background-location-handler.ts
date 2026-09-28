import type { ActivityStore } from './activity-store';
import type {
  BackgroundLocationInbox,
  BackgroundLocationPoint,
} from './background-location-inbox';

export interface ExpoBackgroundLocation {
  timestamp: number;
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
    speed: number | null;
    heading: number | null;
  };
}

export interface BackgroundLocationHandlerDependencies {
  store: Pick<ActivityStore, 'initialize' | 'loadActiveSession'>;
  inbox: Pick<BackgroundLocationInbox, 'initialize' | 'append'>;
}

function finiteOrNull(value: number | null): number | null {
  return value !== null && Number.isFinite(value) ? value : null;
}

function toBackgroundPoint(
  location: ExpoBackgroundLocation,
): BackgroundLocationPoint | null {
  if (
    !Number.isFinite(location.timestamp) ||
    !Number.isFinite(location.coords.latitude) ||
    !Number.isFinite(location.coords.longitude)
  ) {
    return null;
  }

  const accuracy = finiteOrNull(location.coords.accuracy);

  return {
    timestampMs: location.timestamp,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracyMeters: accuracy === null ? 9999 : Math.max(0, accuracy),
    altitudeMeters: finiteOrNull(location.coords.altitude),
    speedMps: finiteOrNull(location.coords.speed),
    headingDegrees: finiteOrNull(location.coords.heading),
  };
}

export async function handleBackgroundLocations(
  locations: readonly ExpoBackgroundLocation[],
  dependencies: BackgroundLocationHandlerDependencies,
): Promise<void> {
  if (locations.length === 0) return;

  await dependencies.store.initialize();
  await dependencies.inbox.initialize();

  const recovered = await dependencies.store.loadActiveSession();
  if (!recovered || recovered.session.state !== 'ACTIVE') return;

  const points = locations
    .map(toBackgroundPoint)
    .filter((point): point is BackgroundLocationPoint => point !== null);

  if (points.length === 0) return;
  await dependencies.inbox.append(recovered.session.activityId, points);
}
