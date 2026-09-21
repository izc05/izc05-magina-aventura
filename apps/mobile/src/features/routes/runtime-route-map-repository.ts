import { developmentRouteMapRepository } from './development-route-map-repository';
import type { RouteMapRepository } from './route-map-repository';
import { getQaAdventureHarness } from '../qa/qa-harness';

/** Production remains fail-closed; QA data is selected only by the QA gate. */
export function getRuntimeRouteMapRepository(): RouteMapRepository {
  return getQaAdventureHarness()?.routeMapRepository ?? developmentRouteMapRepository;
}
