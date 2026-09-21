import {
  devAdventureEngineTestDefinition,
  devAdventureEngineTestManifest,
  devAdventureEngineTestMapPayload,
  devAdventureEngineTestRoute,
} from '../routes/dev-adventure-engine-test';
import type { RouteMapRepository } from '../routes/route-map-repository';

const routeMapRepository: RouteMapRepository = {
  async getAdventureDefinition(slug) {
    return slug === devAdventureEngineTestRoute.slug
      ? devAdventureEngineTestDefinition
      : null;
  },
  async getMapPayload(slug) {
    return slug === devAdventureEngineTestRoute.slug
      ? devAdventureEngineTestMapPayload
      : null;
  },
  async getOfflineManifest(slug) {
    return slug === devAdventureEngineTestRoute.slug
      ? devAdventureEngineTestManifest
      : null;
  },
};

/**
 * This module is reachable only through the compile-time QA gate in
 * qa-harness.ts. It contains the sole permitted Phase 4C synthetic route.
 */
export const qaAdventureEngineHarness = {
  route: devAdventureEngineTestRoute,
  routeMapRepository,
} as const;
