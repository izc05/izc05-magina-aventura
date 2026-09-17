import type { RouteMapPayload } from '@magina-aventura/contracts';

import type { RouteMapLayoutMode } from './map-layout';

export interface RouteMapProps {
  payload: RouteMapPayload | null;
  mapStyle: string | Record<string, unknown>;
  developmentMode: boolean;
  layout?: RouteMapLayoutMode;
}
