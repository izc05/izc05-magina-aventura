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
import { createActivitySyncBatch } from './activity-sync-queue';
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
  let lastConsumedInboxId = 0;
  let refreshInFlight: Promise<ActivityEngineState | null> | null = null;

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
    await dependencies.locationProvider.start(activityId, async (point) => {
      await dependencies.inbox.append(activityId, [point]);
      await refresh();
    });
  }

  async function refreshInternal(): Promise<ActivityEngineState | null> {
    await initializeStores();
    if (!engineState) return null;

    const activityId = engineState.session.activityId;
    const pending = await dependencies.inbox.loadPending(
      activityId,
      lastConsumedInboxId,
    );
    if (pending.length === 0) return engineState;

    let nextState = engineState;
    const samples = [];
    let snapshotToPersist = null;

    for (const item of pending) {
      const sequence = nextState.session.lastProcessedSequence + 1;
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
        nextState.snapshot.lastValidSample,
      );

      nextState = reduceActivity(
        nextState,
        { type: 'LOCATION', sample },
        routeLine,
      );
      nextState = applyExploration(nextState, sample);
      samples.push(sample);

      if (nextState.shouldPersistSnapshot) {
        snapshotToPersist = nextState.snapshot;
      }
    }

    const consumedThrough = pending[pending.length - 1]!.inboxId;

    await dependencies.store.appendBatch(
      activityId,
      samples,
      snapshotToPersist,
      explorationFromEngine(nextState),
      consumedThrough,
    );

    engineState = nextState;
    lastConsumedInboxId = consumedThrough;

    try {
      await dependencies.inbox.acknowledgeThrough(activityId, consumedThrough);
    } catch {
      // Cleanup is best-effort. The durable cursor is the exactly-once boundary.
    }

    return engineState;
  }

  function refresh(): Promise<ActivityEngineState | null> {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = refreshInternal().finally(() => {
      refreshInFlight = null;
    });
    return refreshInFlight;
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
      lastConsumedInboxId = 0;
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

      const startedState = reduceActivity(
        {
          ...createInitialEngineState(session, at),
          exploration: createExplorationState(),
          explorationObservations: [],
        },
        { type: 'START', at },
        routeLine,
      );

      await dependencies.store.createSession(
        startedState.session,
        startedState.snapshot,
        explorationFromEngine(startedState),
      );
      engineState = startedState;

      try {
        await startLocation(startedState.session.activityId);
      } catch (error) {
        const pausedState = reduceActivity(
          startedState,
          { type: 'PAUSE', at: dependencies.now() },
          routeLine,
        );
        await dependencies.store.updateSession(
          pausedState.session,
          pausedState.snapshot,
          explorationFromEngine(pausedState),
        );
        engineState = pausedState;
        throw error;
      }

      return startedState;
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
        lastConsumedInboxId = 0;
        return null;
      }

      const validatedDefinition = validateDefinitionForRecovery(
        definition,
        recovered.session,
        route,
      );
      explorationConfig = explorationConfigFromAdventureDefinition(validatedDefinition);
      lastConsumedInboxId = recovered.lastConsumedInboxId;
      engineState = rehydrateEngineState(recovered, routeLine, applyExploration);

      if (engineState.session.state === 'ACTIVE') {
        try {
          await startLocation(engineState.session.activityId);
        } catch (error) {
          const pausedState = reduceActivity(
            engineState,
            { type: 'PAUSE', at: dependencies.now() },
            routeLine,
          );
          await dependencies.store.updateSession(
            pausedState.session,
            pausedState.snapshot,
            explorationFromEngine(pausedState),
          );
          engineState = pausedState;
          throw error;
        }
      }

      return refresh();
    },

    refresh,

    async pause(): Promise<ActivityEngineState> {
      const current = await refresh();
      if (!current) throw new Error('No active adventure');

      const pausedState = reduceActivity(
        current,
        { type: 'PAUSE', at: dependencies.now() },
        routeLine,
      );
      await dependencies.store.updateSession(
        pausedState.session,
        pausedState.snapshot,
        explorationFromEngine(pausedState),
      );
      engineState = pausedState;
      await dependencies.locationProvider.stop();
      return pausedState;
    },

    async resume(): Promise<ActivityEngineState> {
      if (!engineState) throw new Error('No paused adventure');

      const resumedState = reduceActivity(
        engineState,
        { type: 'RESUME', at: dependencies.now() },
        routeLine,
      );
      await dependencies.store.updateSession(
        resumedState.session,
        resumedState.snapshot,
        explorationFromEngine(resumedState),
      );
      engineState = resumedState;

      try {
        await startLocation(resumedState.session.activityId);
      } catch (error) {
        const pausedState = reduceActivity(
          resumedState,
          { type: 'PAUSE', at: dependencies.now() },
          routeLine,
        );
        await dependencies.store.updateSession(
          pausedState.session,
          pausedState.snapshot,
          explorationFromEngine(pausedState),
        );
        engineState = pausedState;
        throw error;
      }

      return resumedState;
    },

    async finish(): Promise<ActivityEngineState> {
      const current = await refresh();
      if (!current) throw new Error('No active adventure');

      const finishedState = reduceActivity(
        current,
        { type: 'FINISH', at: dependencies.now() },
        routeLine,
      );
      const track = await dependencies.store.loadTrack(
        finishedState.session.activityId,
      );

      if (track.length > 0) {
        const batch = createActivitySyncBatch(
          finishedState.session.activityId,
          track,
          finishedState.snapshot,
          dependencies.now(),
        );
        await dependencies.store.finishSessionAndQueueSyncBatch(
          finishedState.session,
          finishedState.snapshot,
          explorationFromEngine(finishedState),
          batch,
        );
      } else {
        await dependencies.store.updateSession(
          finishedState.session,
          finishedState.snapshot,
          explorationFromEngine(finishedState),
        );
      }

      engineState = finishedState;

      try {
        await dependencies.locationProvider.stop();
      } catch {
        // The durable FINISHED/outbox state wins. Native cleanup is retried on reopen.
      }

      return finishedState;
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
