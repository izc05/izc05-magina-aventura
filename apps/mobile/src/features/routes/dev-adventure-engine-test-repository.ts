import type { RouteMapRepository } from './route-map-repository';
import {
  DEV_ADVENTURE_ENGINE_TEST_SLUG,
  devAdventureEngineTestDefinition,
  devAdventureEngineTestManifest,
  devAdventureEngineTestMapPayload,
} from './dev-adventure-engine-test';

/**
 * Dependency-injected repository for TEST DATA only. It exposes exactly one
 * synthetic slug and has no fallback behavior for real or unknown content.
 */
export function createDevAdventureEngineTestRepository(): RouteMapRepository {
  return {
    async getAdventureDefinition(slug) {
      return slug === DEV_ADVENTURE_ENGINE_TEST_SLUG
        ? devAdventureEngineTestDefinition
        : null;
    },
    async getMapPayload(slug) {
      return slug === DEV_ADVENTURE_ENGINE_TEST_SLUG
        ? devAdventureEngineTestMapPayload
        : null;
    },
    async getOfflineManifest() {
      return null;
    },
  };
}

export const devAdventureEngineTestRepository = createDevAdventureEngineTestRepository();

export function createRuntimeRouteMapRepository(
  devMode: boolean,
): RouteMapRepository {
  return devMode ? devAdventureEngineTestRepository : {
    async getAdventureDefinition() { return null; },
    async getMapPayload() { return null; },
    async getOfflineManifest() { return null; },
  };
}
