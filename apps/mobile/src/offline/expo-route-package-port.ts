import { Directory, File, Paths } from 'expo-file-system';
import type { InstalledRoutePackage } from '@magina-aventura/offline-sync';

import type { RoutePackagePort } from './route-package-port';

const root = new Directory(Paths.document, 'magina-aventura', 'routes');

function ensureRoot() {
  if (!root.exists) {
    root.create({ intermediates: true, idempotent: true });
  }
}

function metadataFile(routeId: string) {
  return new File(root, `route-${routeId}.json`);
}

export const expoRoutePackagePort: RoutePackagePort = {
  async download(remoteUrl, fileName) {
    ensureRoot();
    const target = new File(root, fileName);
    const file = await File.downloadFileAsync(remoteUrl, target, { idempotent: true });

    return {
      uri: file.uri,
      size: file.size,
      md5: file.md5,
    };
  },

  async remove(uri) {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  },

  async readMetadata(routeId) {
    ensureRoot();
    const file = metadataFile(routeId);
    if (!file.exists) return null;

    return JSON.parse(await file.text()) as InstalledRoutePackage;
  },

  async writeMetadata(metadata) {
    ensureRoot();
    const file = metadataFile(metadata.routeId);
    file.write(JSON.stringify(metadata));
  },
};
