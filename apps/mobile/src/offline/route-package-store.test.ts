import { describe, expect, it, vi } from 'vitest';
import type { OfflineAdventureManifestV1 } from '@magina-aventura/contracts';

import { downloadRoutePackage } from './route-package-store';

const validHash = 'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234';

const manifest: OfflineAdventureManifestV1 = {
  schemaVersion: 'offline-package.v1',
  packageId: 'pkg-1',
  routeId: '00000000-0000-0000-0000-000000000001',
  routeVersionId: '00000000-0000-0000-0000-000000000002',
  geometryVersion: 1,
  mapAssetVersion: 1,
  createdAt: new Date().toISOString(),
  contentHash: validHash,
  safetySnapshotUpdatedAt: null,
  weatherSnapshotUpdatedAt: null,
};

function fakePort(md5: string | null = validHash) {
  return {
    download: vi.fn(async () => ({ uri: 'file:///route.zip', size: 100, md5 })),
    remove: vi.fn(async () => undefined),
    computeHash: vi.fn(async () => validHash),
    readMetadata: vi.fn(async () => null),
    writeMetadata: vi.fn(async () => undefined),
  };
}

describe('downloadRoutePackage', () => {
  it('persists a verified package', async () => {
    const port = fakePort();
    const installed = await downloadRoutePackage(port, manifest, 'https://cdn.example.test/pkg.zip');

    expect(installed.localUri).toBe('file:///route.zip');
    expect(installed.packageId).toBe(manifest.packageId);
    expect(installed.routeVersionId).toBe(manifest.routeVersionId);
    expect(port.writeMetadata).toHaveBeenCalledWith(installed);
  });

  it('removes file on checksum mismatch', async () => {
    const port = fakePort('wrong-hash');
    // computeHash also returns validHash, but md5 from download doesn't match
    port.computeHash = vi.fn(async () => 'wrong-hash');

    await expect(
      downloadRoutePackage(port, manifest, 'https://cdn.example.test/pkg.zip'),
    ).rejects.toThrow('checksum mismatch');
    expect(port.remove).toHaveBeenCalledWith('file:///route.zip');
  });

  it('keeps previous ready package if download fails', async () => {
    const port = fakePort();
    port.download = vi.fn(async () => { throw new Error('Network error'); });

    await expect(
      downloadRoutePackage(port, manifest, 'https://cdn.example.test/pkg.zip'),
    ).rejects.toThrow('Network error');
    // writeMetadata not called, previous state preserved
    expect(port.writeMetadata).not.toHaveBeenCalled();
  });
});
