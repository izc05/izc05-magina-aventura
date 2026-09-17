import type { OfflineAdventureManifestV1 } from '@magina-aventura/contracts';
import {
  offlinePackageFileName,
  type InstalledRoutePackage,
} from '@magina-aventura/offline-sync';
import type { RoutePackagePort } from './route-package-port';

export async function downloadRoutePackage(
  port: RoutePackagePort,
  manifest: OfflineAdventureManifestV1,
  remoteUrl: string,
): Promise<InstalledRoutePackage> {
  const downloaded = await port.download(
    remoteUrl,
    offlinePackageFileName(manifest),
  );

  // Compute hash if not provided by the download result
  let downloadedHash: string | null = downloaded.md5 ?? null;
  if (!downloadedHash) {
    try {
      downloadedHash = await port.computeHash(downloaded.uri);
    } catch {
      downloadedHash = null;
    }
  }

  if (manifest.contentHash && downloadedHash !== null && downloadedHash !== manifest.contentHash) {
    await port.remove(downloaded.uri);
    throw new Error('Downloaded package checksum mismatch');
  }

  const metadata: InstalledRoutePackage = {
    packageId: manifest.packageId,
    routeId: manifest.routeId,
    routeVersionId: manifest.routeVersionId,
    geometryVersion: manifest.geometryVersion,
    byteSize: downloaded.size,
    contentHash: downloadedHash ?? manifest.contentHash,
    localUri: downloaded.uri,
  };

  await port.writeMetadata(metadata);
  return metadata;
}