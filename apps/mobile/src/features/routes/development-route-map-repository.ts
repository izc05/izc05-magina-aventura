import type { RouteMapRepository } from './route-map-repository';
import {
  ma001PilotAliases,
  ma001PilotMapPayload,
  ma001PilotOfflineManifest,
} from './ma001-pilot-route';

/**
 * Local route source for the field-preview build.
 * The line comes from the official Junta KML. Checkpoint positions are still
 * control waypoints and are used only as provisional GPS targets in the pilot;
 * they must not be treated as final verified checkpoints before field validation.
 */
export const developmentRouteMapRepository: RouteMapRepository = {
  async getMapPayload(slug) {
    return ma001PilotAliases.has(slug) ? ma001PilotMapPayload : null;
  },
  async getOfflineManifest(slug) {
    return ma001PilotAliases.has(slug) ? ma001PilotOfflineManifest : null;
  },
};
