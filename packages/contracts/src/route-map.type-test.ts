import type { RouteMapPayload } from './route-map';

const publicRouteMapPayload: RouteMapPayload = {
  routeId: 'route-1',
  slug: 'bedmar-test',
  geometryVersion: 1,
  line: {
    type: 'Feature',
    properties: { routeId: 'route-1', geometryVersion: 1 },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-3.5, 37.7],
        [-3.49, 37.71],
      ],
    },
  },
  start: [-3.5, 37.7],
  bounds: [-3.5, 37.7, -3.49, 37.71],
  checkpoints: [],
  discoveryHints: [
    {
      id: 'discovery-1',
      category: 'flora',
    },
  ],
  mapAsset: {
    id: 'asset-1',
    objectKey: 'routes/bedmar-test/v1/map.pmtiles',
    remoteUrl: 'https://cdn.example.test/routes/bedmar-test/v1/map.pmtiles',
    styleTemplateUrl: 'https://cdn.example.test/styles/magina-v1.json',
    byteSize: 1024,
    md5: null,
    minZoom: 10,
    maxZoom: 16,
    bounds: [-3.5, 37.7, -3.49, 37.71],
  },
};

void publicRouteMapPayload;
