import type { AdventureTargetDefinition, RouteMapPayload } from '@magina-aventura/contracts';

export interface RouteMapProps {
  payload: RouteMapPayload | null;
  mapStyle: string | Record<string, unknown>;
  developmentMode: boolean;
  discoveryTargets?: readonly AdventureTargetDefinition[];
}
