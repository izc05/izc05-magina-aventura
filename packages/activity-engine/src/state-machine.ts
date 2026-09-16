import type { ActivityState } from '@magina-aventura/contracts';

export type LocalActivityActionType = 'START' | 'PAUSE' | 'RESUME' | 'FINISH';

const TRANSITIONS: Partial<
  Record<ActivityState, Partial<Record<LocalActivityActionType, ActivityState>>>
> = {
  DRAFT: { START: 'ACTIVE' },
  ACTIVE: { PAUSE: 'PAUSED', FINISH: 'FINISHED' },
  PAUSED: { RESUME: 'ACTIVE', FINISH: 'FINISHED' },
};

export function transitionActivityState(
  state: ActivityState,
  actionType: LocalActivityActionType,
): ActivityState {
  const nextState = TRANSITIONS[state]?.[actionType];

  if (!nextState) {
    throw new Error(`Invalid activity transition: ${state} -> ${actionType}`);
  }

  return nextState;
}
