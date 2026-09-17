function parseNumber(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${label} in GPX`);
  return parsed;
}

export function parseGpxTrack(xml) {
  if (typeof xml !== 'string' || !xml.trim()) throw new Error('GPX is empty');
  const points = [];
  const pointTag = /<(?:\w+:)?(?:trkpt|rtept)\b([^>]*)>/gi;
  let match;
  while ((match = pointTag.exec(xml)) !== null) {
    const attrs = match[1];
    const latMatch = /\blat\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const lonMatch = /\blon\s*=\s*["']([^"']+)["']/i.exec(attrs);
    if (!latMatch || !lonMatch) continue;
    const lat = parseNumber(latMatch[1], 'latitude');
    const lon = parseNumber(lonMatch[1], 'longitude');
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) throw new Error('GPX coordinate out of range');
    points.push([lon, lat]);
  }
  if (points.length < 2) throw new Error('GPX must contain at least two valid track points');
  return points;
}

function coordinateText([lon, lat]) {
  return `${Number(lon)} ${Number(lat)}`;
}

export function toLineStringWkt(points) {
  if (!Array.isArray(points) || points.length < 2) throw new Error('LineString needs at least two points');
  return `SRID=4326;LINESTRING(${points.map(coordinateText).join(',')})`;
}

export function startPointWkt(points) {
  if (!Array.isArray(points) || points.length < 1) throw new Error('Start point is missing');
  return `SRID=4326;POINT(${coordinateText(points[0])})`;
}
