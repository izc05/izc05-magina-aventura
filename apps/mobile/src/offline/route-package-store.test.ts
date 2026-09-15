import { describe, expect, it, vi } from 'vitest';
import type { OfflineRoutePackageManifest } from '@magina-aventura/contracts';

import { downloadRoutePackage } from './route-package-store';

const manifest: OfflineRoutePackageManifest = {
  manifestVersion: 1,
  routeId: 'route-1',
  contentVersion: 1,
  geometryVersion: 1,
  map: {
    id: 'asset-1',
    objectKey: 'routes/route-1/geometry/1/basemap.pmtiles',
    remoteUrl: 'https://cdn.example.test/map.pmtiles',
    styleTemplateUrl: 'https://cdn.example.test/style.json',
    byteSize: 100,
    md5: 'hash',
    minZoom: 10,
    maxZoom: 16,
    bounds: [-3.5, 37.6, -3.4, 37.8],
  },
};

function fakePort(size = 100, md5: string | null = 'hash') {
  return {
    download: vi.fn(async () => ({ uri: 'file:///route.pmtiles', size, md5 })),
    remove: vi.fn(async () => undefined),
    readMetadata: vi.fn(async () => null),
    writeMetadata: vi.fn(async () => undefined),
  };
}

describe('downloadRoutePackage', () => {
  it('persists a verified package', async () => {
    const port = fakePort();
    const installed = await downloadRoutePackage(port, manifest);

    expect(installed.localUri).toBe('file:///route.pmtiles');
    expect(port.writeMetadata).toHaveBeenCalledWith(installed);
  });

  it('removes file on size mismatch', async () => {
    const port = fakePort(99);

    await expect(downloadRoutePackage(port, manifest)).rejects.toThrow(
      'Downloaded PMTiles size mismatch',
    );
    expect(port.remove).toHaveBeenCalledWith('file:///route.pmtiles');
  });

  it('removes file on checksum mismatch', async () => {
    const port = fakePort(100, 'other');

    await expect(downloadRoutePackage(port, manifest)).rejects.toThrow(
      'Downloaded PMTiles checksum mismatch',
    );
    expect(port.remove).toHaveBeenCalledWith('file:///route.pmtiles');
  });
});
