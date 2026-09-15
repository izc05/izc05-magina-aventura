import type { RouteMapRepository } from './route-map-repository';

export const developmentRouteMapRepository: RouteMapRepository = {
  async getMapPayload() {
    return null;
  },

  async getOfflineManifest() {
    return null;
  },
};
