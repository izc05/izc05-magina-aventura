import type { InstalledRoutePackage } from '@magina-aventura/offline-sync';

export interface RoutePackagePort {
  download(
    remoteUrl: string,
    fileName: string,
  ): Promise<{ uri: string; size: number; md5: string | null }>;
  remove(uri: string): Promise<void>;
  readMetadata(routeId: string): Promise<InstalledRoutePackage | null>;
  writeMetadata(metadata: InstalledRoutePackage): Promise<void>;
}
