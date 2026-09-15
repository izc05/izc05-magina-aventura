import type {
  OfflineRoutePackageManifest,
  RouteMapPayload,
} from '@magina-aventura/contracts';

export interface RouteMapRepository {
  getMapPayload(slug: string): Promise<RouteMapPayload | null>;
  getOfflineManifest(slug: string): Promise<OfflineRoutePackageManifest | null>;
}
