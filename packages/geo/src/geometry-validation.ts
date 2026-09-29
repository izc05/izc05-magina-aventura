import type { RouteBounds, RouteLineFeature } from '@magina-aventura/contracts';
import { distanceMeters } from './distance';

export type GeometryValidationCode =
  | 'too_few_coordinates'
  | 'invalid_coordinate'
  | 'zero_length'
  | 'outside_acceptance_bounds'
  | 'suspicious_segment_gap';

export interface GeometryValidationIssue {
  code: GeometryValidationCode;
  message: string;
  coordinateIndex?: number;
}

export interface GeometryValidationOptions {
  acceptanceBounds?: RouteBounds;
  maxSegmentKm?: number;
}

const withinBounds = (
  longitude: number,
  latitude: number,
  bounds: RouteBounds,
): boolean => {
  const [west, south, east, north] = bounds;
  return (
    longitude >= west &&
    longitude <= east &&
    latitude >= south &&
    latitude <= north
  );
};

export function validateCanonicalGeometry(
  line: RouteLineFeature,
  options: GeometryValidationOptions = {},
): GeometryValidationIssue[] {
  const issues: GeometryValidationIssue[] = [];
  const coordinates = line.geometry.coordinates;
  const maxSegmentKm = options.maxSegmentKm ?? 5;

  if (coordinates.length < 2) {
    issues.push({
      code: 'too_few_coordinates',
      message: 'Canonical geometry requires at least two coordinates.',
    });
    return issues;
  }

  let totalDistanceM = 0;

  coordinates.forEach(([longitude, latitude], index) => {
    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180 ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      issues.push({
        code: 'invalid_coordinate',
        message: 'Coordinate is outside valid longitude/latitude ranges.',
        coordinateIndex: index,
      });
      return;
    }

    if (
      options.acceptanceBounds !== undefined &&
      !withinBounds(longitude, latitude, options.acceptanceBounds)
    ) {
      issues.push({
        code: 'outside_acceptance_bounds',
        message: 'Coordinate falls outside the supplied catalog acceptance bounds.',
        coordinateIndex: index,
      });
    }

    if (index === 0) return;

    const previous = coordinates[index - 1]!;
    const segmentM = distanceMeters(
      { longitude: previous[0], latitude: previous[1] },
      { longitude, latitude },
    );

    totalDistanceM += segmentM;

    if (segmentM / 1000 > maxSegmentKm) {
      issues.push({
        code: 'suspicious_segment_gap',
        message: `Segment exceeds ${maxSegmentKm} km between consecutive track points.`,
        coordinateIndex: index,
      });
    }
  });

  if (totalDistanceM === 0) {
    issues.push({
      code: 'zero_length',
      message: 'Canonical geometry has zero total length.',
    });
  }

  return issues;
}
