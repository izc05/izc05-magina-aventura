import type { RouteLineFeature } from '@magina-aventura/contracts';

export function validateRouteLineFeature(
  feature: RouteLineFeature,
): RouteLineFeature {
  const coordinates = feature.geometry.coordinates;

  if (coordinates.length < 2) {
    throw new Error('Route requires at least two coordinates');
  }

  for (const [longitude, latitude] of coordinates) {
    if (longitude < -180 || longitude > 180) {
      throw new Error('Invalid longitude');
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('Invalid latitude');
    }
  }

  return feature;
}
