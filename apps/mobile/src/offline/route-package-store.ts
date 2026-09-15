import type { OfflineRoutePackageManifest } from '@magina-aventura/contracts';
import {
  offlinePackageFileName,
  type InstalledRoutePackage,
} from '@magina-aventura/offline-sync';

import type { RoutePackagePort } from './route-package-port';

export async function downloadRoutePackage(
  port: RoutePackagePort,
  manifest: OfflineRoutePackageManifest,
): Promise<InstalledRoutePackage> {
  const downloaded = await port.download(
    manifest.map.remoteUrl,
    offlinePackageFileName(manifest),
  );

  if (downloaded.size !== manifest.map.byteSize) {
    await port.remove(downloaded.uri);
    throw new Error('Downloaded PMTiles size mismatch');
  }

  if (manifest.map.md5 !== null && downloaded.md5 !== manifest.map.md5) {
    await port.remove(downloaded.uri);
    throw new Error('Downloaded PMTiles checksum mismatch');
  }

  const metadata: InstalledRoutePackage = {
    routeId: manifest.routeId,
    contentVersion: manifest.contentVersion,
    geometryVersion: manifest.geometryVersion,
    byteSize: downloaded.size,
    md5: downloaded.md5,
    localUri: downloaded.uri,
  };

  await port.writeMetadata(metadata);
  return metadata;
}
