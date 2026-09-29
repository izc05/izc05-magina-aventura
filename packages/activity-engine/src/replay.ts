import type {
  ActivityAction,
  ActivitySession,
  GeoJsonPosition,
} from '@magina-aventura/contracts';

import {
  defaultActivityEngineConfig,
  type ActivityEngineConfig,
} from './config';
import {
  createInitialEngineState,
  reduceActivity,
  type ActivityEngineState,
} from './engine';

export function replayActivity(
  session: ActivitySession,
  actions: readonly ActivityAction[],
  routeLine: readonly GeoJsonPosition[] = [],
  createdAt: string = session.startedAt,
  config: ActivityEngineConfig = defaultActivityEngineConfig,
): ActivityEngineState {
  let state = createInitialEngineState(session, createdAt);

  for (const action of actions) {
    state = reduceActivity(state, action, routeLine, config);
  }

  return state;
}
