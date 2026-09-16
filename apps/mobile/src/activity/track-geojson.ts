import type { LocationSample } from '@magina-aventura/contracts';

export interface ActivityTrackFeature {
  type: 'Feature';
  properties: {
    kind: 'activity-track';
  };
  geometry: {
    type: 'LineString';
    coordinates: [longitude: number, latitude: number][];
  };
}

export function trackToGeoJson(
  samples: readonly LocationSample[],
): ActivityTrackFeature {
  return {
    type: 'Feature',
    properties: { kind: 'activity-track' },
    geometry: {
      type: 'LineString',
      coordinates: samples
        .filter((sample) => sample.validForMetrics)
        .sort((left, right) => left.sequence - right.sequence)
        .map((sample) => [sample.longitude, sample.latitude]),
    },
  };
}
