export interface OfflineAdventureManifestV1 {
  schemaVersion: 'offline-package.v1';
  packageId: string;
  routeId: string;
  routeVersionId: string;
  geometryVersion: number;
  mapAssetVersion: number;
  createdAt: string;
  contentHash: string;
  safetySnapshotUpdatedAt: string | null;
  weatherSnapshotUpdatedAt: string | null;
}