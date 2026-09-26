import { describe, expect, it } from 'vitest';

import { developmentRouteMapRepository } from './development-route-map-repository';

describe('developmentRouteMapRepository', () => {
  it('loads the official Las Viñas line with control checkpoints explicitly bounded to the pilot', async () => {
    const payload = await developmentRouteMapRepository.getMapPayload('cuadros-las-vinas');

    expect(payload?.routeId).toBe('MA-001');
    expect(payload?.line.geometry.coordinates.length).toBeGreaterThan(300);
    expect(payload?.checkpoints.map((checkpoint) => checkpoint.id)).toEqual([
      'CP00', 'CP01', 'CP02', 'CP03', 'CP04', 'CP05', 'CP06', 'CP07', 'CP08', 'CP09', 'CP10', 'FINAL',
    ]);
    expect(payload?.checkpoints.filter((checkpoint) => checkpoint.position).length).toBe(9);
    expect(payload?.checkpoints.filter((checkpoint) => !checkpoint.position).map((checkpoint) => checkpoint.id)).toEqual(['CP02', 'CP03', 'CP06']);
    expect(payload?.mapAsset).toBeNull();
  });

  it('does not invent authoritative geometry', async () => {
    const payload = await developmentRouteMapRepository.getMapPayload('cuadros-development');

    expect(payload).toBeNull();
  });

  it('returns null for unknown manifest', async () => {
    expect(await developmentRouteMapRepository.getOfflineManifest('missing-route')).toBeNull();
  });
});
