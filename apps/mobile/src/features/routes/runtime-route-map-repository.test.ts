import { describe, expect, it } from 'vitest';

import { DEV_ADVENTURE_ENGINE_TEST_SLUG } from './dev-adventure-engine-test';
import { createRuntimeRouteMapRepository } from './dev-adventure-engine-test-repository';

describe('runtime route repository release isolation', () => {
  it('never exposes synthetic TEST DATA when development mode is disabled', async () => {
    const releaseRepository = createRuntimeRouteMapRepository(false);

    expect(await releaseRepository.getAdventureDefinition(DEV_ADVENTURE_ENGINE_TEST_SLUG)).toBeNull();
    expect(await releaseRepository.getMapPayload(DEV_ADVENTURE_ENGINE_TEST_SLUG)).toBeNull();
    expect(await releaseRepository.getOfflineManifest(DEV_ADVENTURE_ENGINE_TEST_SLUG)).toBeNull();
  });

  it('exposes only the explicit synthetic slug in injected development mode', async () => {
    const devRepository = createRuntimeRouteMapRepository(true);

    expect((await devRepository.getAdventureDefinition(DEV_ADVENTURE_ENGINE_TEST_SLUG))?.slug).toBe(
      DEV_ADVENTURE_ENGINE_TEST_SLUG,
    );
    expect(await devRepository.getAdventureDefinition('unknown-production-slug')).toBeNull();
  });
});
