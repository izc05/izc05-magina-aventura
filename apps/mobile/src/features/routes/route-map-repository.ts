import type {
  OfflineAdventureManifestV1,
  RouteMapPayload,
} from '@magina-aventura/contracts';

export interface RouteMapRepository {
  getMapPayload(slug: string): Promise<RouteMapPayload | null>;
  getOfflineManifest(slug: string): Promise<OfflineAdventureManifestV1 | null>;
}
