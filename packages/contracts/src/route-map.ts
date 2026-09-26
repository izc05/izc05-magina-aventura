export type GeoJsonPosition = readonly [longitude: number, latitude: number];

export type RouteBounds = readonly [
  west: number,
  south: number,
  east: number,
  north: number,
];

export interface RouteLineFeature {
  type: 'Feature';
  properties: {
    routeId: string;
    geometryVersion: number;
  };
  geometry: {
    type: 'LineString';
    coordinates: GeoJsonPosition[];
  };
}

export interface RouteMapCheckpoint {
  id: string;
  name: string;
  position: GeoJsonPosition | null;
  positionStatus?: 'control' | 'verified' | 'pending';
  triggerRadiusM: number;
  required: boolean;
}

export interface RouteMapDiscoveryHint {
  id: string;
  category:
    | 'flora'
    | 'fauna'
    | 'water'
    | 'heritage'
    | 'olive'
    | 'tradition'
    | 'landscape';
}

export interface OfflineMapAsset {
  id: string;
  objectKey: string;
  remoteUrl: string;
  styleTemplateUrl: string;
  byteSize: number;
  md5: string | null;
  minZoom: number;
  maxZoom: number;
  bounds: RouteBounds;
}

export interface RouteMapPayload {
  routeId: string;
  slug: string;
  geometryVersion: number;
  line: RouteLineFeature;
  start: GeoJsonPosition;
  bounds: RouteBounds;
  checkpoints: RouteMapCheckpoint[];
  discoveryHints: RouteMapDiscoveryHint[];
  mapAsset: OfflineMapAsset | null;
}

export interface OfflineRoutePackageManifest {
  manifestVersion: 1;
  routeId: string;
  contentVersion: number;
  geometryVersion: number;
  map: OfflineMapAsset;
}
