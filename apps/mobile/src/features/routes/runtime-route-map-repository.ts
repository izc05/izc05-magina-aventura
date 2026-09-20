import { createDevAdventureEngineTestRepository } from './dev-adventure-engine-test-repository';
import { developmentRouteMapRepository } from './development-route-map-repository';
import type { RouteMapRepository } from './route-map-repository';

const devRepository = createDevAdventureEngineTestRepository();

/** Production remains fail-closed; synthetic content is selected only in DEV. */
export function getRuntimeRouteMapRepository(): RouteMapRepository {
  return __DEV__ ? devRepository : developmentRouteMapRepository;
}
