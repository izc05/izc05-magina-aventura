import type { OfflineAdventureManifestV1 } from '@magina-aventura/contracts';

export interface InstalledRoutePackage {
  packageId: string;
  routeId: string;
  routeVersionId: string;
  geometryVersion: number;
  byteSize: number;
  contentHash: string;
  localUri: string;
}

export type OfflinePackageState =
  | 'not-downloaded'
  | 'downloading'
  | 'verifying'
  | 'ready'
  | 'failed'
  | 'stale';

export function evaluateOfflinePackage(
  installed: InstalledRoutePackage | null,
  manifest: OfflineAdventureManifestV1,
): OfflinePackageState {
  if (!installed) return 'not-downloaded';

  const matches =
    installed.packageId === manifest.packageId &&
    installed.routeId === manifest.routeId &&
    installed.routeVersionId === manifest.routeVersionId &&
    installed.geometryVersion === manifest.geometryVersion &&
    installed.contentHash === manifest.contentHash;

  return matches ? 'ready' : 'stale';
}

export function offlinePackageFileName(manifest: OfflineAdventureManifestV1): string {
  return `route-${manifest.routeId}-${manifest.packageId}.zip`;
}

export function resolvePmtilesUri(
  manifest: OfflineAdventureManifestV1,
  localUri?: string,
): string {
  if (localUri) {
    if (!localUri.startsWith('file://')) {
      throw new Error('PMTiles local URI must use file://');
    }
    return `pmtiles://${localUri}/map.pmtiles`;
  }

  // No remote PMTiles fallback in V1 manifest; package must be downloaded first
  throw new Error('Remote PMTiles not supported in V1 offline manifest');
}