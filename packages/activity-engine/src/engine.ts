import type {
  ActivityAction,
  ActivitySession,
  ActivitySnapshot,
  GeoJsonPosition,
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

export interface ActivityEngineState {
  session: ActivitySession;
  snapshot: ActivitySnapshot;
  offRouteEvidence: OffRouteEvidence;
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
  };
}

function reduceLifecycleAction(
  state: ActivityEngineState,
  action: Exclude<ActivityAction, { type: 'LOCATION' }>,
): ActivityEngineState {
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
      ...state.snapshot,
      state: nextState,
      createdAt: action.at,
      currentSpeedMps: nextState === 'ACTIVE' ? state.snapshot.currentSpeedMps : null,
      paceSecondsPerKm: nextState === 'ACTIVE' ? state.snapshot.paceSecondsPerKm : null,
    },
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
  if (sample.sequence <= state.session.lastProcessedSequence) return state;

  let snapshot = updateActivityMetrics(
    state.snapshot,
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
    snapshot = {
      ...snapshot,
      routeProgress: progress.currentProgress,
      maxRouteProgress: progress.maxProgress,
      distanceToRouteMeters: progress.distanceToRouteMeters,
      offRouteState: offRouteEvidence.state,
    };
  }

  return {
    session: {
      ...state.session,
      lastProcessedSequence: sample.sequence,
    },
    snapshot,
    offRouteEvidence,
  };
}
