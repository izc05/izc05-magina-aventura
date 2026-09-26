import type { GeoJsonPosition } from '@magina-aventura/contracts';
import type { RouteMapRepository } from './route-map-repository';
import type { EnhancedRoutePayload } from '../../map/map-layers';

const mockTrackCoordinates: GeoJsonPosition[] = [
  [-3.413, 37.823],
  [-3.415, 37.825],
  [-3.418, 37.828],
  [-3.421, 37.831],
  [-3.425, 37.833],
  [-3.428, 37.836],
  [-3.432, 37.839],
  [-3.435, 37.842],
];

const mockElevationProfile = [
  { distanceKm: 0.0, elevationM: 640 },
  { distanceKm: 1.2, elevationM: 685 },
  { distanceKm: 2.5, elevationM: 730 },
  { distanceKm: 3.8, elevationM: 810 },
  { distanceKm: 5.1, elevationM: 890 },
  { distanceKm: 6.4, elevationM: 950 },
  { distanceKm: 7.5, elevationM: 1010 },
  { distanceKm: 8.7, elevationM: 1052 },
];

export const mockRoutePayload: EnhancedRoutePayload = {
  routeId: 'dev-bedmar-cuadros-001',
  slug: 'sendero-de-cuadros-dev',
  geometryVersion: 1,
  start: [-3.413, 37.823],
  bounds: [-3.44, 37.81, -3.40, 37.85],
  line: {
    type: 'Feature',
    properties: {
      routeId: 'dev-bedmar-cuadros-001',
      geometryVersion: 1,
    },
    geometry: {
      type: 'LineString',
      coordinates: mockTrackCoordinates,
    },
  },
  checkpoints: [
    {
      id: 'cp-start',
      name: 'Inicio: Ermita de Cuadros',
      position: [-3.413, 37.823],
      triggerRadiusM: 25,
      required: true,
    },
    {
      id: 'cp-mid',
      name: 'Mirador del Adarve',
      position: [-3.421, 37.831],
      triggerRadiusM: 20,
      required: true,
    },
    {
      id: 'cp-finish',
      name: 'Nacimiento del Río Cuadros',
      position: [-3.435, 37.842],
      triggerRadiusM: 30,
      required: true,
    },
  ],
  discoveryHints: [
    { id: 'poi-1', category: 'flora' },
    { id: 'poi-2', category: 'olive' },
    { id: 'poi-3', category: 'heritage' },
  ],
  pois: [
    {
      id: 'poi-1',
      category: 'flora',
      name: 'Bosque de Adarves & Oleastros',
      description: 'Especies autóctonas mediterráneas de Sierra Mágina',
      position: [-3.416, 37.826],
      altitudeM: 660,
    },
    {
      id: 'poi-2',
      category: 'olive',
      name: 'Olivares Centenarios de Bedmar',
      description: 'Tradición olivarera amparada por la D.O. Sierra Mágina',
      position: [-3.423, 37.833],
      altitudeM: 780,
    },
    {
      id: 'poi-3',
      category: 'heritage',
      name: 'Torre del Cuadros',
      description: 'Fortificación defensiva medieval del siglo IX',
      position: [-3.430, 37.838],
      altitudeM: 920,
    },
    {
      id: 'poi-4',
      category: 'landscape',
      name: 'Mirador de la Garganta',
      description: 'Panorámica de los picos calcáreos de la sierra',
      position: [-3.434, 37.841],
      altitudeM: 1030,
    },
  ],
  elevationProfile: mockElevationProfile,
  hikerPosition: [-3.421, 37.831],
  hikerHeadingDeg: 65,
  mapAsset: null,
};

const knownDevSlugs = [
  'sendero-de-cuadros-dev',
  'subida-pico-magina-dev',
  'cueva-del-agua-dev',
];

export const developmentRouteMapRepository: RouteMapRepository = {
  async getMapPayload(slug?: string) {
    if (!slug) return mockRoutePayload;
    if (!knownDevSlugs.includes(slug)) return null;

    return {
      ...mockRoutePayload,
      slug,
    };
  },

  async getOfflineManifest(slug?: string) {
    if (slug && !knownDevSlugs.includes(slug)) return null;

    return {
      manifestVersion: 1,
      routeId: 'dev-bedmar-cuadros-001',
      contentVersion: 1,
      geometryVersion: 1,
      map: {
        id: 'asset-bedmar-001',
        objectKey: 'maps/bedmar.pmtiles',
        remoteUrl: 'https://cdn.magina-aventura.es/maps/bedmar.pmtiles',
        styleTemplateUrl: 'https://cdn.magina-aventura.es/styles/magina-olive.json',
        byteSize: 4194304,
        md5: 'a1b2c3d4e5f6',
        minZoom: 10,
        maxZoom: 16,
        bounds: [-3.44, 37.81, -3.40, 37.85],
      },
    };
  },
};
