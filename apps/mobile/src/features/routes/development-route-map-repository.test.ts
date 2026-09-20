import { describe, expect, it } from 'vitest';

import { developmentRouteMapRepository } from './development-route-map-repository';
import {
  createDevAdventureEngineTestRepository,
  createRuntimeRouteMapRepository,
} from './dev-adventure-engine-test-repository';
import { DEV_ADVENTURE_ENGINE_TEST_SLUG } from './dev-adventure-engine-test';

describe('developmentRouteMapRepository', () => {
  it('does not invent authoritative geometry', async () => {
    const payload = await developmentRouteMapRepository.getMapPayload('cuadros-development');

    expect(payload).toBeNull();
  });

  it('returns null for unknown manifest', async () => {
    expect(await developmentRouteMapRepository.getOfflineManifest('missing-route')).toBeNull();
  });

  it('exposes synthetic content only through explicit DEV/test injection', async () => {
    const injected = createDevAdventureEngineTestRepository();
    expect((await injected.getAdventureDefinition(DEV_ADVENTURE_ENGINE_TEST_SLUG))?.slug).toBe(
      DEV_ADVENTURE_ENGINE_TEST_SLUG,
    );
    expect(await injected.getAdventureDefinition('sendero-de-cuadros-dev')).toBeNull();
    expect(await createRuntimeRouteMapRepository(false).getAdventureDefinition(DEV_ADVENTURE_ENGINE_TEST_SLUG)).toBeNull();
  });
});
