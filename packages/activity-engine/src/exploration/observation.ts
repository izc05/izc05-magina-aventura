import type { ExplorationObservation } from './types';

export function explorationObservationKey(
  activityId: string,
  observation: Pick<ExplorationObservation, 'kind' | 'targetId'>,
): string {
  return `${activityId}:${observation.kind}:${observation.targetId}`;
}
