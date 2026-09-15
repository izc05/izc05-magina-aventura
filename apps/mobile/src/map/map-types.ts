export interface RouteMapCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteMapProps {
  start: RouteMapCoordinate;
  routeId: string;
  geometryVersion: number;
  developmentMode: boolean;
}
