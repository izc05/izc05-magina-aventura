import type {
  AdventureDefinition,
  ActivitySession,
  GeoJsonPosition,
  RouteDetail,
} from '@magina-aventura/contracts';
import { validateAdventureDefinition } from '@magina-aventura/contracts';
import {
  createInitialEngineState,
  createExplorationState,
  evaluateExplorationSample,
  explorationConfigFromAdventureDefinition,
  normalizeLocationSample,
  reduceActivity,
  type ActivityEngineState,
} from '@magina-aventura/activity-engine';

import type {
  ActivityStore,
  ExplorationPersistence,
  RecoveredActivity,
} from './activity-store';
import { createActivitySyncQueue } from './activity-sync-queue';
import type {
  BackgroundLocationInbox,
  BackgroundLocationPoint,
} from './background-location-inbox';
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
}

function validateDefinitionForRoute(
  definition: AdventureDefinition,
  route: RouteDetail,
): AdventureDefinition {
  const validated = validateAdventureDefinition(definition);
  if (validated.routeId !== route.id) {
    throw new Error('AdventureDefinition routeId does not match the selected route');
  }
  if (validated.geometryVersion !== route.geometryVersion) {
    throw new Error('AdventureDefinition geometryVersion does not match the selected route');
  }
  return validated;
}

function validateDefinitionForRecovery(
  definition: AdventureDefinition,
  session: ActivitySession,
  route: RouteDetail,
): AdventureDefinition {
  const validated = validateDefinitionForRoute(definition, route);
  if (
    validated.slug !== session.adventureSlug ||
    validated.version !== session.adventureVersion ||
    validated.routeId !== session.routeId ||
    validated.geometryVersion !== session.geometryVersion
  ) {
    throw new Error('The exact AdventureDefinition version for this activity is unavailable');
  }
  return validated;
}

function explorationFromEngine(state: ActivityEngineState): ExplorationPersistence {
  return {
    state: state.exploration ?? createExplorationState(),
    observations: state.explorationObservations ?? [],
  };
}

function rehydrateEngineState(
  recovered: RecoveredActivity,
  routeLine: readonly GeoJsonPosition[],
  applyLocation: (
    state: ActivityEngineState,
    sample: Parameters<typeof normalizeLocationSample>[0] extends never
      ? never
      : RecoveredActivity['samplesAfterSnapshot'][number],
  ) => ActivityEngineState,
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
    exploration: recovered.exploration.state,
    explorationObservations: recovered.exploration.observations,
  };

  for (const sample of recovered.samplesAfterSnapshot) {
    state = reduceActivity(state, { type: 'LOCATION', sample }, routeLine);
    state = applyLocation(state, sample);
  }

  return state;
}

export function createActivityController(dependencies: ActivityControllerDependencies) {
  let engineState: ActivityEngineState | null = null;
  let routeLine: readonly GeoJsonPosition[] = [];
  let explorationConfig: ReturnType<typeof explorationConfigFromAdventureDefinition> | null = null;
  let initialized = false;
  const syncQueue = createActivitySyncQueue({
    store: dependencies.store,
    now: dependencies.now,
  });

  function applyExploration(
    state: ActivityEngineState,
    sample: RecoveredActivity['samplesAfterSnapshot'][number],
  ): ActivityEngineState {
    const config = explorationConfig;
    if (!config) {
      return {
        ...state,
        exploration: state.exploration ?? createExplorationState(),
        explorationObservations: state.explorationObservations ?? [],
      };
    }

    const evaluation = evaluateExplorationSample(
      state.exploration ?? createExplorationState(),
      sample,
      config.targets,
      config.policy,
    );
    return {
      ...state,
      exploration: evaluation.state,
      explorationObservations: [
        ...(state.explorationObservations ?? []),
        ...evaluation.observations,
      ],
    };
  }

  async function initializeStores(): Promise<void> {
    if (initialized) return;
    await dependencies.store.initialize();
    await dependencies.inbox.initialize();
    initialized = true;
  }

  async function startLocation(activityId: string): Promise<void> {
    await dependencies.locationProvider.start(activityId, (point) => {
      void dependencies.inbox.append(activityId, [point]).then(() => refresh());
    });
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
      engineState = applyExploration(engineState, sample);
      samples.push(sample);

      if (engineState.shouldPersistSnapshot) {
        snapshotToPersist = engineState.snapshot;
      }
    }

    await dependencies.store.appendBatch(
      activityId,
      samples,
      snapshotToPersist,
      explorationFromEngine(engineState),
    );
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
      definition: AdventureDefinition,
      route: RouteDetail,
      line: readonly GeoJsonPosition[] = [],
    ): Promise<ActivityEngineState> {
      await initializeStores();
      const validatedDefinition = validateDefinitionForRoute(definition, route);
      explorationConfig = explorationConfigFromAdventureDefinition(validatedDefinition);
      const permissions = await dependencies.locationProvider.requestAdventurePermissions();
      ensureReadyForAdventure(permissions);

      routeLine = line;
      const at = dependencies.now();
      const session: ActivitySession = {
        activityId: dependencies.createActivityId(),
        adventureSlug: validatedDefinition.slug,
        adventureVersion: validatedDefinition.version,
        routeId: route.id,
        routeSlug: route.slug,
        geometryVersion: route.geometryVersion,
        state: 'DRAFT',
        startedAt: at,
        pausedAt: null,
        finishedAt: null,
        lastProcessedSequence: 0,
        syncState: 'local',
      };

      engineState = reduceActivity(
        {
          ...createInitialEngineState(session, at),
          exploration: createExplorationState(),
          explorationObservations: [],
        },
        { type: 'START', at },
        routeLine,
      );

      await dependencies.store.createSession(
        engineState.session,
        engineState.snapshot,
        explorationFromEngine(engineState),
      );

      try {
        await startLocation(engineState.session.activityId);
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
          explorationFromEngine(engineState),
        );
        throw error;
      }

      return engineState;
    },

    async recover(
      definition: AdventureDefinition,
      route: RouteDetail,
      line: readonly GeoJsonPosition[] = [],
    ): Promise<ActivityEngineState | null> {
      await initializeStores();
      routeLine = line;
      const recovered = await dependencies.store.loadActiveSession();
      if (!recovered || recovered.session.routeId !== route.id) {
        engineState = null;
        return null;
      }

      const validatedDefinition = validateDefinitionForRecovery(
        definition,
        recovered.session,
        route,
      );
      explorationConfig = explorationConfigFromAdventureDefinition(validatedDefinition);
      engineState = rehydrateEngineState(recovered, routeLine, applyExploration);
      if (engineState.session.state === 'ACTIVE') {
        await startLocation(engineState.session.activityId);
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
        explorationFromEngine(engineState),
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
        explorationFromEngine(engineState),
      );

      try {
        await startLocation(engineState.session.activityId);
      } catch (error) {
        engineState = reduceActivity(
          engineState,
          { type: 'PAUSE', at: dependencies.now() },
          routeLine,
        );
        await dependencies.store.updateSession(
          engineState.session,
          engineState.snapshot,
          explorationFromEngine(engineState),
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
        explorationFromEngine(engineState),
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
