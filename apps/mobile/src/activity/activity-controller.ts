import type {
  ActivitySession,
  GeoJsonPosition,
  RouteDetail,
} from '@magina-aventura/contracts';
import {
  createInitialEngineState,
  normalizeLocationSample,
  reduceActivity,
  type ActivityEngineState,
} from '@magina-aventura/activity-engine';

import type { ActivityStore, RecoveredActivity } from './activity-store';
import { createActivitySyncQueue } from './activity-sync-queue';
import type { BackgroundLocationInbox } from './background-location-inbox';
import type {
  LocationPermissionState,
  LocationProvider,
} from './location-provider';

export interface ActivityControllerDependencies {
  store: ActivityStore;
  inbox: BackgroundLocationInbox;
  locationProvider: LocationProvider;
  createActivityId(): string;
  now(): string;
}

function ensureReadyForAdventure(state: LocationPermissionState): void {
  if (!state.servicesEnabled) {
    throw new Error('Location services are disabled');
  }
  if (!state.foregroundGranted) {
    throw new Error('Foreground location permission is required');
  }
  if (!state.backgroundGranted) {
    throw new Error('Background location permission is required');
  }
}

function rehydrateEngineState(
  recovered: RecoveredActivity,
  routeLine: readonly GeoJsonPosition[],
): ActivityEngineState {
  let state: ActivityEngineState = {
    session: {
      ...recovered.session,
      lastProcessedSequence: recovered.snapshot.lastProcessedSequence,
    },
    snapshot: recovered.snapshot,
    offRouteEvidence: {
      state: recovered.snapshot.offRouteState,
      outsideSamples: 0,
      insideSamples: 0,
    },
    shouldPersistSnapshot: false,
    acceptedSamplesSinceSnapshot: 0,
    lastSnapshotAt: recovered.snapshot.createdAt,
    acceptedSample: null,
    rejectedSample: null,
  };

  for (const sample of recovered.samplesAfterSnapshot) {
    state = reduceActivity(state, { type: 'LOCATION', sample }, routeLine);
  }

  return state;
}

export function createActivityController(dependencies: ActivityControllerDependencies) {
  let engineState: ActivityEngineState | null = null;
  let routeLine: readonly GeoJsonPosition[] = [];
  let initialized = false;
  const syncQueue = createActivitySyncQueue({
    store: dependencies.store,
    now: dependencies.now,
  });

  async function initializeStores(): Promise<void> {
    if (initialized) return;
    await dependencies.store.initialize();
    await dependencies.inbox.initialize();
    initialized = true;
  }

  async function refresh(): Promise<ActivityEngineState | null> {
    await initializeStores();
    if (!engineState) return null;

    const activityId = engineState.session.activityId;
    const pending = await dependencies.inbox.loadPending(activityId);
    if (pending.length === 0) return engineState;

    const samples = [];
    let snapshotToPersist = null;

    for (const item of pending) {
      const sequence = engineState.session.lastProcessedSequence + 1;
      const sample = normalizeLocationSample(
        {
          sequence,
          timestamp: new Date(item.point.timestampMs).toISOString(),
          latitude: item.point.latitude,
          longitude: item.point.longitude,
          accuracyMeters: item.point.accuracyMeters,
          altitudeMeters: item.point.altitudeMeters,
          speedMps: item.point.speedMps,
          headingDegrees: item.point.headingDegrees,
        },
        engineState.snapshot.lastValidSample,
      );

      engineState = reduceActivity(
        engineState,
        { type: 'LOCATION', sample },
        routeLine,
      );
      samples.push(sample);

      if (engineState.shouldPersistSnapshot) {
        snapshotToPersist = engineState.snapshot;
      }
    }

    await dependencies.store.appendBatch(activityId, samples, snapshotToPersist);
    await dependencies.inbox.acknowledgeThrough(
      activityId,
      pending[pending.length - 1]!.inboxId,
    );

    return engineState;
  }

  return {
    async getPermissionState(): Promise<LocationPermissionState> {
      return dependencies.locationProvider.getPermissionState();
    },

    async requestPermissions(): Promise<LocationPermissionState> {
      return dependencies.locationProvider.requestAdventurePermissions();
    },

    async start(
      route: { id: string; slug: string; geometryVersion?: number },
      line: readonly GeoJsonPosition[] = [],
    ): Promise<ActivityEngineState> {
      await initializeStores();
      const permissions = await dependencies.locationProvider.requestAdventurePermissions();
      ensureReadyForAdventure(permissions);

      routeLine = line;
      const at = dependencies.now();
      const session: ActivitySession = {
        activityId: dependencies.createActivityId(),
        routeId: route.id,
        routeSlug: route.slug,
        geometryVersion: (route.geometryVersion ?? 0),
        state: 'DRAFT',
        startedAt: at,
        pausedAt: null,
        finishedAt: null,
        lastProcessedSequence: 0,
        syncState: 'local',
      };

      engineState = reduceActivity(
        createInitialEngineState(session, at),
        { type: 'START', at },
        routeLine,
      );

      await dependencies.store.createSession(
        engineState.session,
        engineState.snapshot,
      );

      try {
        await dependencies.locationProvider.start(engineState.session.activityId);
      } catch (error) {
        const pausedAt = dependencies.now();
        engineState = reduceActivity(
          engineState,
          { type: 'PAUSE', at: pausedAt },
          routeLine,
        );
        await dependencies.store.updateSession(
          engineState.session,
          engineState.snapshot,
        );
        throw error;
      }

      return engineState;
    },

    async recover(
      route: { id: string; slug: string; geometryVersion?: number },
      line: readonly GeoJsonPosition[] = [],
    ): Promise<ActivityEngineState | null> {
      await initializeStores();
      routeLine = line;
      const recovered = await dependencies.store.loadActiveSession();
      if (!recovered || recovered.session.routeId !== route.id) {
        engineState = null;
        return null;
      }

      engineState = rehydrateEngineState(recovered, routeLine);
      if (engineState.session.state === 'ACTIVE') {
        await dependencies.locationProvider.start(engineState.session.activityId);
      }

      return refresh();
    },

    refresh,

    async pause(): Promise<ActivityEngineState> {
      const current = await refresh();
      if (!current) throw new Error('No active adventure');

      engineState = reduceActivity(
        current,
        { type: 'PAUSE', at: dependencies.now() },
        routeLine,
      );
      await dependencies.store.updateSession(
        engineState.session,
        engineState.snapshot,
      );
      await dependencies.locationProvider.stop();
      return engineState;
    },

    async resume(): Promise<ActivityEngineState> {
      if (!engineState) throw new Error('No paused adventure');

      engineState = reduceActivity(
        engineState,
        { type: 'RESUME', at: dependencies.now() },
        routeLine,
      );
      await dependencies.store.updateSession(
        engineState.session,
        engineState.snapshot,
      );

      try {
        await dependencies.locationProvider.start(engineState.session.activityId);
      } catch (error) {
        engineState = reduceActivity(
          engineState,
          { type: 'PAUSE', at: dependencies.now() },
          routeLine,
        );
        await dependencies.store.updateSession(
          engineState.session,
          engineState.snapshot,
        );
        throw error;
      }

      return engineState;
    },

    async finish(): Promise<ActivityEngineState> {
      const current = await refresh();
      if (!current) throw new Error('No active adventure');

      engineState = reduceActivity(
        current,
        { type: 'FINISH', at: dependencies.now() },
        routeLine,
      );
      await dependencies.store.updateSession(
        engineState.session,
        engineState.snapshot,
      );
      await dependencies.locationProvider.stop();

      const track = await dependencies.store.loadTrack(engineState.session.activityId);
      if (track.length > 0) {
        await syncQueue.enqueue(
          engineState.session.activityId,
          track,
          engineState.snapshot,
        );
      }

      return engineState;
    },

    async loadTrack() {
      if (!engineState) return [];
      return dependencies.store.loadTrack(engineState.session.activityId);
    },

    current(): ActivityEngineState | null {
      return engineState;
    },
  };
}

export type ActivityController = ReturnType<typeof createActivityController>;

