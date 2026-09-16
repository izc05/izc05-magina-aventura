import type { RouteCommunitySnapshot } from './community-types';

export type RouteCommunityLoadResult =
  | { state: 'unavailable' }
  | { state: 'ready'; snapshot: RouteCommunitySnapshot };

export interface CommunityRepository {
  getRouteCommunity(routeId: string): Promise<RouteCommunityLoadResult>;
}
