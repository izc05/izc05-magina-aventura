import { describe, expect, it } from 'vitest';
import type { OfflineRoutePackageManifest } from '@magina-aventura/contracts';

import { evaluateOfflinePackage, offlinePackageFileName, resolvePmtilesUri } from './route-package';

const manifest: OfflineRoutePackageManifest = {
  manifestVersion: 1,
  routeId: 'route-1',
  contentVersion: 3,
  geometryVersion: 2,
  map: {
    id: 'asset-1',
    objectKey: 'routes/route-1/geometry/2/basemap.pmtiles',
    remoteUrl: 'https://cdn.example.test/map.pmtiles',
    styleTemplateUrl: 'https://cdn.example.test/style.json',
    byteSize: 1000,
    md5: 'abc',
    minZoom: 10,
    maxZoom: 16,
    bounds: [-3.5, 37.6, -3.4, 37.8],
  },
};

describe('route offline package', () => {
  it('marks missing package as not-downloaded', () => {
    expect(evaluateOfflinePackage(null, manifest)).toBe('not-downloaded');
  });

  it('marks geometry mismatch as stale', () => {
    expect(
      evaluateOfflinePackage(
        {
          routeId: 'route-1',
          contentVersion: 3,
          geometryVersion: 1,
          byteSize: 1000,
          md5: 'abc',
          localUri: 'file:///route.pmtiles',
        },
        manifest,
      ),
    ).toBe('stale');
  });

  it('marks exact package as ready', () => {
    expect(
      evaluateOfflinePackage(
        {
          routeId: 'route-1',
          contentVersion: 3,
          geometryVersion: 2,
          byteSize: 1000,
          md5: 'abc',
          localUri: 'file:///route.pmtiles',
        },
        manifest,
      ),
    ).toBe('ready');
  });

  it('builds deterministic file name and local source', () => {
    expect(offlinePackageFileName(manifest)).toBe('route-route-1-g2.pmtiles');
    expect(resolvePmtilesUri(manifest, 'file:///route.pmtiles')).toBe('pmtiles://file:///route.pmtiles');
  });
});
