import type { RouteMapPayload } from '@magina-aventura/contracts';
import type { MapLayerVisibility, MapThemeId, EnhancedRoutePayload } from './map-layers';

export interface RouteMapProps {
  payload: EnhancedRoutePayload | RouteMapPayload | null;
  mapStyle?: string | Record<string, unknown>;
  developmentMode?: boolean;
  themeId?: MapThemeId;
  layerVisibility?: Partial<MapLayerVisibility>;
  showLayerControls?: boolean;
  onThemeChange?: (themeId: MapThemeId) => void;
  onLayerVisibilityChange?: (visibility: MapLayerVisibility) => void;
  height?: number;
}
