import type { AdventureDefinition } from '@magina-aventura/contracts';

import {
  validateExplorationPolicy,
  validateExplorationTargets,
} from './proximity';
import type { ExplorationPolicy, ExplorationTarget } from './types';

export interface AdventureExplorationConfig {
  targets: ExplorationTarget[];
  policy: ExplorationPolicy;
}

/**
 * The only supported source for spatial exploration configuration is an
 * editorial/backend AdventureDefinition already included in the offline package.
 */
export function explorationConfigFromAdventureDefinition(
  definition: AdventureDefinition,
): AdventureExplorationConfig {
  const targets = [
    ...definition.checkpoints,
    ...definition.discoveries,
  ] as ExplorationTarget[];

  return {
    targets: validateExplorationTargets(targets),
    policy: validateExplorationPolicy(definition.explorationPolicy),
  };
}
