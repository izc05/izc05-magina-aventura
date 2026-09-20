import type {
  AdventureDefinition,
  OfflineRoutePackageManifest,
  RouteMapPayload,
} from '@magina-aventura/contracts';

export interface RouteMapRepository {
  /** Returns a downloaded editorial definition, never a generated fallback. */
  getAdventureDefinition(slug: string): Promise<AdventureDefinition | null>;
  getMapPayload(slug: string): Promise<RouteMapPayload | null>;
  getOfflineManifest(slug: string): Promise<OfflineRoutePackageManifest | null>;
}
