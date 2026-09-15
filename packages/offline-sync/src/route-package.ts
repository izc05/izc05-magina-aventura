import type { OfflineRoutePackageManifest } from '@magina-aventura/contracts';

export interface InstalledRoutePackage {
  routeId: string;
  contentVersion: number;
  geometryVersion: number;
  byteSize: number;
  md5: string | null;
  localUri: string;
}

export type OfflinePackageState = 'not-downloaded' | 'ready' | 'stale';

export function evaluateOfflinePackage(
  installed: InstalledRoutePackage | null,
  manifest: OfflineRoutePackageManifest,
): OfflinePackageState {
  if (!installed) return 'not-downloaded';

  const checksumMatches = manifest.map.md5 === null || installed.md5 === manifest.map.md5;
  const matches =
    installed.routeId === manifest.routeId &&
    installed.contentVersion === manifest.contentVersion &&
    installed.geometryVersion === manifest.geometryVersion &&
    installed.byteSize === manifest.map.byteSize &&
    checksumMatches;

  return matches ? 'ready' : 'stale';
}

export function offlinePackageFileName(manifest: OfflineRoutePackageManifest): string {
  return `route-${manifest.routeId}-g${manifest.geometryVersion}.pmtiles`;
}

export function resolvePmtilesUri(
  manifest: OfflineRoutePackageManifest,
  localUri?: string,
): string {
  if (localUri) {
    if (!localUri.startsWith('file://')) {
      throw new Error('PMTiles local URI must use file://');
    }
    return `pmtiles://${localUri}`;
  }

  if (!manifest.map.remoteUrl.startsWith('https://')) {
    throw new Error('PMTiles remote URL must use HTTPS');
  }

  return `pmtiles://${manifest.map.remoteUrl}`;
}
