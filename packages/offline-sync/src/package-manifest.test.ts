import { describe, expect, it } from 'vitest';
import { parseManifestV1 } from './package-manifest';

describe('package-manifest', () => {
  const validBase = {
    schemaVersion: 'offline-package.v1',
    packageId: 'pkg-1',
    routeId: '00000000-0000-0000-0000-000000000001',
    routeVersionId: '00000000-0000-0000-0000-000000000002',
    geometryVersion: 1,
    mapAssetVersion: 1,
    createdAt: new Date().toISOString(),
    contentHash: 'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
    safetySnapshotUpdatedAt: null,
    weatherSnapshotUpdatedAt: null,
  };

  it('accepts valid manifest', () => {
    expect(() => parseManifestV1(validBase)).not.toThrow();
  });

  it('rejects wrong schema version', () => {
    expect(() => parseManifestV1({ ...validBase, schemaVersion: 'v2' })).toThrow(/schemaVersion/);
  });

  it('rejects malformed hash', () => {
    expect(() => parseManifestV1({ ...validBase, contentHash: 'short' })).toThrow(/contentHash/);
  });

  it('rejects missing route version', () => {
    const invalid = { ...validBase };
    delete (invalid as any).routeVersionId;
    expect(() => parseManifestV1(invalid)).toThrow(/routeVersionId/);
  });

  it('rejects mismatched route identity', () => {
    expect(() => parseManifestV1({ ...validBase, routeId: 'invalid' }, 'different-id')).toThrow(/routeId/);
  });

  it('rejects mismatched geometry version', () => {
    expect(() => parseManifestV1({ ...validBase, geometryVersion: 2 }, validBase.routeId, 1)).toThrow(/geometryVersion/);
  });
});