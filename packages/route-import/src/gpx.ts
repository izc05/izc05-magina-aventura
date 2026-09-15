import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type {
  GeoJsonPosition,
  RouteBounds,
  RouteLineFeature,
} from '@magina-aventura/contracts';
import {
  calculateRouteBounds,
  validateRouteLineFeature,
} from '@magina-aventura/geo';

export interface ImportedRouteGeometry {
  line: RouteLineFeature;
  start: GeoJsonPosition;
  bounds: RouteBounds;
  elevationsM: Array<number | null>;
}

type GpxTrackPoint = {
  '@_lon'?: number | string;
  '@_lat'?: number | string;
  ele?: number | string;
};

type GpxSegment = { trkpt?: GpxTrackPoint | GpxTrackPoint[] };
type GpxTrack = { trkseg?: GpxSegment | GpxSegment[] };
type ParsedGpx = { gpx?: { trk?: GpxTrack | GpxTrack[] } };

const arrayify = <T>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

export function parseGpx(
  xml: string,
  routeId: string,
  geometryVersion: number,
): ImportedRouteGeometry {
  if (XMLValidator.validate(xml) !== true) {
    throw new Error('Invalid GPX XML');
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
  });

  const document = parser.parse(xml) as ParsedGpx;
  const points = arrayify(document.gpx?.trk)
    .flatMap((track) => arrayify(track.trkseg))
    .flatMap((segment) => arrayify(segment.trkpt));

  if (points.length < 2) {
    throw new Error('GPX contains no route coordinates');
  }

  const coordinates: GeoJsonPosition[] = points.map((point) => [
    Number(point['@_lon']),
    Number(point['@_lat']),
  ]);

  const elevationsM = points.map((point) => {
    if (point.ele === undefined || point.ele === '') {
      return null;
    }

    const elevation = Number(point.ele);
    return Number.isFinite(elevation) ? elevation : null;
  });

  const line: RouteLineFeature = {
    type: 'Feature',
    properties: {
      routeId,
      geometryVersion,
    },
    geometry: {
      type: 'LineString',
      coordinates,
    },
  };

  validateRouteLineFeature(line);

  return {
    line,
    start: coordinates[0]!,
    bounds: calculateRouteBounds(coordinates),
    elevationsM,
  };
}
