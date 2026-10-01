import { parseGpxTrack, toLineStringWkt } from './gpx.mjs';

function parseNumber(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Coordenada KML inválida: ${label}`);
  return parsed;
}

export function sniffTrackFormat(xml) {
  if (typeof xml !== 'string' || !xml.trim()) throw new Error('El archivo de track está vacío');
  if (/<(?:\w+:)?gpx\b/i.test(xml)) return 'gpx';
  if (/<(?:\w+:)?kml\b/i.test(xml)) return 'kml';
  throw new Error('El archivo no parece GPX o KML');
}

export function parseKmlTrack(xml) {
  const lineMatch = /<(?:\w+:)?LineString\b[\s\S]*?<(?:\w+:)?coordinates\b[^>]*>([\s\S]*?)<\/(?:\w+:)?coordinates>[\s\S]*?<\/(?:\w+:)?LineString>/i.exec(xml);
  if (!lineMatch) throw new Error('KML sin LineString válido');
  const points = lineMatch[1]
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((tuple) => {
      const [rawLon, rawLat] = tuple.split(',');
      const lon = parseNumber(rawLon, 'longitud');
      const lat = parseNumber(rawLat, 'latitud');
      if (lon < -180 || lon > 180) throw new Error('Longitud KML fuera de rango');
      if (lat < -90 || lat > 90) throw new Error('Latitud KML fuera de rango');
      return [lon, lat];
    });
  if (points.length < 2) throw new Error('KML necesita al menos dos puntos');
  return points;
}

export function parseTrackText(xml) {
  const format = sniffTrackFormat(xml);
  const points = format === 'gpx' ? parseGpxTrack(xml) : parseKmlTrack(xml);
  return { format, points, geometryWkt: toLineStringWkt(points) };
}

export async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
