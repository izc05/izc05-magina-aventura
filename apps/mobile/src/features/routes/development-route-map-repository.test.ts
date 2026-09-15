import { describe, expect, it } from 'vitest';

import { developmentRouteMapRepository } from './development-route-map-repository';

describe('developmentRouteMapRepository', () => {
  it('does not invent authoritative geometry', async () => {
    const payload = await developmentRouteMapRepository.getMapPayload('cuadros-development');

    expect(payload).toBeNull();
  });

  it('returns null for unknown manifest', async () => {
    expect(await developmentRouteMapRepository.getOfflineManifest('missing-route')).toBeNull();
  });
});
