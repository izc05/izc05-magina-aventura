import { describe, expect, it } from 'vitest';
import type { OfflineAdventureManifestV1 } from '@magina-aventura/contracts';

import { evaluateOfflinePackage, offlinePackageFileName, resolvePmtilesUri } from './route-package';

const validHash = 'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234';

const manifest: OfflineAdventureManifestV1 = {
  schemaVersion: 'offline-package.v1',
  packageId: 'pkg-abc',
  routeId: '00000000-0000-0000-0000-000000000001',
  routeVersionId: '00000000-0000-0000-0000-000000000002',
  geometryVersion: 2,
  mapAssetVersion: 1,
  createdAt: '2026-09-17T00:00:00Z',
  contentHash: validHash,
  safetySnapshotUpdatedAt: null,
  weatherSnapshotUpdatedAt: null,
};

describe('route offline package', () => {
  it('marks missing package as not-downloaded', () => {
    expect(evaluateOfflinePackage(null, manifest)).toBe('not-downloaded');
  });

  it('marks geometry mismatch as stale', () => {
    expect(
      evaluateOfflinePackage(
        {
          packageId: 'pkg-abc',
          routeId: '00000000-0000-0000-0000-000000000001',
          routeVersionId: '00000000-0000-0000-0000-000000000002',
          geometryVersion: 1, // wrong
          byteSize: 1000,
          contentHash: validHash,
          localUri: 'file:///route.zip',
        },
        manifest,
      ),
    ).toBe('stale');
  });

  it('marks exact package as ready', () => {
    expect(
      evaluateOfflinePackage(
        {
          packageId: 'pkg-abc',
          routeId: '00000000-0000-0000-0000-000000000001',
          routeVersionId: '00000000-0000-0000-0000-000000000002',
          geometryVersion: 2,
          byteSize: 1000,
          contentHash: validHash,
          localUri: 'file:///route.zip',
        },
        manifest,
      ),
    ).toBe('ready');
  });

  it('marks packageId mismatch as stale', () => {
    expect(
      evaluateOfflinePackage(
        {
          packageId: 'pkg-old',
          routeId: '00000000-0000-0000-0000-000000000001',
          routeVersionId: '00000000-0000-0000-0000-000000000002',
          geometryVersion: 2,
          byteSize: 1000,
          contentHash: validHash,
          localUri: 'file:///route.zip',
        },
        manifest,
      ),
    ).toBe('stale');
  });

  it('builds deterministic file name', () => {
    expect(offlinePackageFileName(manifest)).toBe(
      `route-00000000-0000-0000-0000-000000000001-pkg-abc.zip`,
    );
  });

  it('resolves local pmtiles URI', () => {
    expect(resolvePmtilesUri(manifest, 'file:///route.zip')).toBe(
      'pmtiles://file:///route.zip/map.pmtiles',
    );
  });

  it('throws when trying to resolve remote URI without local file', () => {
    expect(() => resolvePmtilesUri(manifest)).toThrow('Remote PMTiles not supported');
  });
});
