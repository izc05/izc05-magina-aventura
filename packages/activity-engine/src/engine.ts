import type {
  ActivityAction,
  ActivitySession,
  ActivitySnapshot,
  GeoJsonPosition,
  LocationSample,
} from '@magina-aventura/contracts';

import {
  defaultActivityEngineConfig,
  type ActivityEngineConfig,
} from './config';
import { updateActivityMetrics } from './metrics';
import {
  createInitialOffRouteEvidence,
  updateOffRouteState,
  type OffRouteEvidence,
} from './off-route';
import { calculateRouteProgress } from './route-progress';
import { transitionActivityState } from './state-machine';
import type { ExplorationObservation, ExplorationState } from './exploration';

export interface ActivityEngineState {
  session: ActivitySession;
  snapshot: ActivitySnapshot;
  offRouteEvidence: OffRouteEvidence;
  shouldPersistSnapshot: boolean;
  acceptedSamplesSinceSnapshot: number;
  lastSnapshotAt: string;
  acceptedSample: LocationSample | null;
  rejectedSample: LocationSample | null;
  exploration?: ExplorationState;
  explorationObservations?: ExplorationObservation[];
}

export function createInitialEngineState(
  session: ActivitySession,
  createdAt: string,
): ActivityEngineState {
  return {
    session: { ...session },
    snapshot: {
      activityId: session.activityId,
      state: session.state,
      lastProcessedSequence: session.lastProcessedSequence,
      validDistanceMeters: 0,
      totalElapsedSeconds: 0,
      movingElapsedSeconds: 0,
      currentSpeedMps: null,
      paceSecondsPerKm: null,
      elevationGainMeters: 0,
      elevationLossMeters: 0,
      routeProgress: 0,
      maxRouteProgress: 0,
      distanceToRouteMeters: null,
      offRouteState: 'on_route',
      lastValidSample: null,
      algorithmVersion: 1,
      createdAt,
    },
    offRouteEvidence: createInitialOffRouteEvidence(),
    shouldPersistSnapshot: false,
    acceptedSamplesSinceSnapshot: 0,
    lastSnapshotAt: createdAt,
    acceptedSample: null,
    rejectedSample: null,
  };
}

function elapsedSince(earlier: string, later: string): number {
  const earlierMs = Date.parse(earlier);
  const laterMs = Date.parse(later);
  if (!Number.isFinite(earlierMs) || !Number.isFinite(laterMs)) return 0;
  return Math.max(0, (laterMs - earlierMs) / 1000);
}

function advanceActiveClock(
  snapshot: ActivitySnapshot,
  isActive: boolean,
  at: string,
): ActivitySnapshot {
  if (!isActive) return snapshot;

  const earlierMs = Date.parse(snapshot.createdAt);
  const laterMs = Date.parse(at);
  if (
    !Number.isFinite(earlierMs) ||
    !Number.isFinite(laterMs) ||
    laterMs <= earlierMs
  ) {
    return snapshot;
  }

  return {
    ...snapshot,
    totalElapsedSeconds:
      snapshot.totalElapsedSeconds + (laterMs - earlierMs) / 1000,
    createdAt: at,
  };
}

function reduceLifecycleAction(
  state: ActivityEngineState,
  action: Exclude<ActivityAction, { type: 'LOCATION' }>,
): ActivityEngineState {
  const clockedSnapshot = advanceActiveClock(
    state.snapshot,
    state.session.state === 'ACTIVE',
    action.at,
  );
  const nextState = transitionActivityState(state.session.state, action.type);
  const nextSession: ActivitySession = {
    ...state.session,
    state: nextState,
    startedAt: action.type === 'START' ? action.at : state.session.startedAt,
    pausedAt:
      action.type === 'PAUSE'
        ? action.at
        : action.type === 'RESUME'
          ? null
          : state.session.pausedAt,
    finishedAt: action.type === 'FINISH' ? action.at : state.session.finishedAt,
  };

  return {
    ...state,
    session: nextSession,
    snapshot: {
      ...clockedSnapshot,
      state: nextState,
      createdAt: action.at,
      currentSpeedMps: null,
      paceSecondsPerKm: null,
      lastValidSample:
        action.type === 'RESUME'
          ? null
          : clockedSnapshot.lastValidSample,
    },
    shouldPersistSnapshot: true,
    acceptedSamplesSinceSnapshot: 0,
    lastSnapshotAt: action.at,
    acceptedSample: null,
    rejectedSample: null,
  };
}

export function reduceActivity(
  state: ActivityEngineState,
  action: ActivityAction,
  routeLine: readonly GeoJsonPosition[] = [],
  config: ActivityEngineConfig = defaultActivityEngineConfig,
): ActivityEngineState {
  if (action.type !== 'LOCATION') {
    return reduceLifecycleAction(state, action);
  }

  const sample = action.sample;
  if (sample.sequence <= state.session.lastProcessedSequence) {
    return {
      ...state,
      shouldPersistSnapshot: false,
      acceptedSample: null,
      rejectedSample: null,
    };
  }

  const clockedSnapshot = advanceActiveClock(
    state.snapshot,
    state.session.state === 'ACTIVE',
    sample.timestamp,
  );
  let snapshot = updateActivityMetrics(
    clockedSnapshot,
    state.snapshot.lastValidSample,
    sample,
    state.session.state,
    config,
  );
  let offRouteEvidence = state.offRouteEvidence;

  if (sample.validForMetrics && routeLine.length >= 2) {
    const progress = calculateRouteProgress(
      [sample.longitude, sample.latitude],
      routeLine,
      state.snapshot.maxRouteProgress,
    );
    offRouteEvidence = updateOffRouteState(
      state.offRouteEvidence,
      progress.distanceToRouteMeters,
      sample.accuracyMeters,
      config,
    );

    const effectiveCorridorMeters = Math.max(
      config.offRouteBaseCorridorMeters,
      Math.max(0, sample.accuracyMeters) * config.offRouteAccuracyMultiplier,
    );
    const insideRouteCorridor =
      progress.distanceToRouteMeters <= effectiveCorridorMeters;

    snapshot = {
      ...snapshot,
      routeProgress: insideRouteCorridor
        ? progress.currentProgress
        : state.snapshot.routeProgress,
      maxRouteProgress: insideRouteCorridor
        ? progress.maxProgress
        : state.snapshot.maxRouteProgress,
      distanceToRouteMeters: progress.distanceToRouteMeters,
      offRouteState: offRouteEvidence.state,
    };
  }

  const nextAcceptedCount = sample.validForMetrics
    ? state.acceptedSamplesSinceSnapshot + 1
    : state.acceptedSamplesSinceSnapshot;
  const dueByCount =
    sample.validForMetrics &&
    nextAcceptedCount >= config.snapshotEveryAcceptedSamples;
  const dueByTime =
    sample.validForMetrics &&
    elapsedSince(state.lastSnapshotAt, sample.timestamp) >=
      config.snapshotEverySeconds;
  const shouldPersistSnapshot = dueByCount || dueByTime;

  return {
    ...state,
    session: {
      ...state.session,
      lastProcessedSequence: sample.sequence,
    },
    snapshot,
    offRouteEvidence,
    shouldPersistSnapshot,
    acceptedSamplesSinceSnapshot: shouldPersistSnapshot ? 0 : nextAcceptedCount,
    lastSnapshotAt: shouldPersistSnapshot
      ? sample.timestamp
      : state.lastSnapshotAt,
    acceptedSample: sample.validForMetrics ? sample : null,
    rejectedSample: sample.validForMetrics ? null : sample,
  };
}
