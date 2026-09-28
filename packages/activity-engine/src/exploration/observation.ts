import type { ExplorationObservation } from './types';

export function explorationObservationKey(
  activityId: string,
  observation: ExplorationObservation,
): string {
  return `${activityId}:${observation.targetKey}`;
}
