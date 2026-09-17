import type { OfflineAdventureManifestV1 } from '@magina-aventura/contracts';

export function parseManifestV1(
  data: unknown,
  expectedRouteId?: string,
  expectedGeometryVersion?: number
): OfflineAdventureManifestV1 {
  if (!data || typeof data !== 'object') throw new Error('Invalid manifest data');
  const record = data as Record<string, unknown>;

  if (record.schemaVersion !== 'offline-package.v1') {
    throw new Error('Invalid schemaVersion: expected offline-package.v1');
  }

  if (typeof record.routeVersionId !== 'string' || !record.routeVersionId) {
    throw new Error('Missing routeVersionId');
  }

  if (typeof record.contentHash !== 'string' || !/^[a-f0-9]{64}$/i.test(record.contentHash)) {
    throw new Error('Invalid contentHash: must be 64-char hex');
  }

  const manifest = record as unknown as OfflineAdventureManifestV1;

  if (expectedRouteId && manifest.routeId !== expectedRouteId) {
    throw new Error('Mismatch: routeId');
  }

  if (expectedGeometryVersion !== undefined && manifest.geometryVersion !== expectedGeometryVersion) {
    throw new Error('Mismatch: geometryVersion');
  }

  return manifest;
}