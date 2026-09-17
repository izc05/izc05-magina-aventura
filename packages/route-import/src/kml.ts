import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type { GeoJsonPosition, RouteLineFeature } from '@magina-aventura/contracts';
import { calculateRouteBounds, validateRouteLineFeature, calculateTrackMetrics } from '@magina-aventura/geo';
import type { ImportedRouteGeometry } from './gpx';

function findLineStringCoordinates(node: unknown): string | null {
  if (node === null || node === undefined) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findLineStringCoordinates(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== 'object') return null;

  const record = node as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    const localName = key.includes(':') ? key.split(':').pop()! : key;
    if (localName === 'LineString' && value && typeof value === 'object') {
      const line = value as Record<string, unknown>;
      for (const [lineKey, lineValue] of Object.entries(line)) {
        const lineLocalName = lineKey.includes(':') ? lineKey.split(':').pop()! : lineKey;
        if (lineLocalName === 'coordinates' && typeof lineValue === 'string') {
          return lineValue;
        }
      }
    }
    const nested = findLineStringCoordinates(value);
    if (nested) return nested;
  }
  return null;
}

function parseCoordinateTuple(raw: string): { position: GeoJsonPosition; elevation: number | null } {
  const parts = raw.split(',').map((part) => part.trim());
  if (parts.length < 2) throw new Error('Invalid KML coordinate');

  const longitude = Number(parts[0]);
  const latitude = Number(parts[1]);
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('Invalid longitude');
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('Invalid latitude');
  }

  let elevation: number | null = null;
  if (parts.length > 2 && parts[2] !== '') {
    const parsedElevation = Number(parts[2]);
    elevation = Number.isFinite(parsedElevation) ? parsedElevation : null;
  }

  return { position: [longitude, latitude], elevation };
}

export function parseKml(xml: string, routeId: string, geometryVersion: number): ImportedRouteGeometry {
  if (XMLValidator.validate(xml) !== true) throw new Error('Invalid KML XML');

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true,
  });
  const document = parser.parse(xml) as unknown;
  const coordinateText = findLineStringCoordinates(document);
  if (!coordinateText) throw new Error('KML contains no route LineString');

  const tuples = coordinateText
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(parseCoordinateTuple);
  if (tuples.length < 2) throw new Error('KML contains no route LineString');

  const coordinates = tuples.map((tuple) => tuple.position);
  const elevationsM = tuples.map((tuple) => tuple.elevation);
  const line: RouteLineFeature = {
    type: 'Feature',
    properties: { routeId, geometryVersion },
    geometry: { type: 'LineString', coordinates },
  };
  validateRouteLineFeature(line);

  return {
    line,
    start: coordinates[0]!,
    bounds: calculateRouteBounds(coordinates),
    elevationsM,
    metrics: calculateTrackMetrics(line, elevationsM),
  };
}
