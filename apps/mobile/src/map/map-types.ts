import type { GeoJsonPosition, RouteMapPayload } from '@magina-aventura/contracts';
import type { MapLayerVisibility, MapThemeId, EnhancedRoutePayload } from './map-layers';
import type { PassportGpsTraceMapData } from '../activity/passport-gps-trace';

export interface RouteMapProps {
  payload: EnhancedRoutePayload | RouteMapPayload | null;
  mapStyle?: string | Record<string, unknown>;
  baseMapOnly?: boolean;
  attribution?: boolean;
  developmentMode?: boolean;
  themeId?: MapThemeId;
  layerVisibility?: Partial<MapLayerVisibility>;
  showLayerControls?: boolean;
  onThemeChange?: (themeId: MapThemeId) => void;
  onLayerVisibilityChange?: (visibility: MapLayerVisibility) => void;
  height?: number;
  /** Current device sample for technical base-map mode only; never a track. */
  deviceLocation?: GeoJsonPosition | null;
  /** Local personal session geometry; rendered only in base-map mode. */
  personalSessionTrace?: PassportGpsTraceMapData | null;
}
