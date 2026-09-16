function assertPoint(point) {
  if (!Array.isArray(point) || point.length < 2) throw new Error('Punto de ruta inválido');
  const lng = Number(point[0]);
  const lat = Number(point[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) throw new Error('Coordenadas de ruta inválidas');
  return [lng, lat];
}

export function routeBounds(points) {
  if (!Array.isArray(points) || points.length < 2) throw new Error('La ruta necesita al menos dos puntos');
  const clean = points.map(assertPoint);
  const lngs = clean.map(([lng]) => lng);
  const lats = clean.map(([, lat]) => lat);
  return {
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats)
  };
}

function spans(bounds) {
  const lngSpan = bounds.maxLng - bounds.minLng || 0.000001;
  const latSpan = bounds.maxLat - bounds.minLat || 0.000001;
  return { lngSpan, latSpan };
}

export function pointToSvg(point, bounds, width, height, padding = 24) {
  const [lng, lat] = assertPoint(point);
  const { lngSpan, latSpan } = spans(bounds);
  const innerWidth = Math.max(1, width - padding * 2);
  const innerHeight = Math.max(1, height - padding * 2);
  return {
    x: padding + ((lng - bounds.minLng) / lngSpan) * innerWidth,
    y: height - padding - ((lat - bounds.minLat) / latSpan) * innerHeight
  };
}

export function svgToLngLat(x, y, bounds, width, height, padding = 24) {
  const { lngSpan, latSpan } = spans(bounds);
  const innerWidth = Math.max(1, width - padding * 2);
  const innerHeight = Math.max(1, height - padding * 2);
  const clampedX = Math.min(width - padding, Math.max(padding, Number(x)));
  const clampedY = Math.min(height - padding, Math.max(padding, Number(y)));
  const lng = bounds.minLng + ((clampedX - padding) / innerWidth) * lngSpan;
  const lat = bounds.minLat + ((height - padding - clampedY) / innerHeight) * latSpan;
  return [lng, lat];
}

export function polylinePoints(points, width, height, padding = 24) {
  const bounds = routeBounds(points);
  return points
    .map((point) => pointToSvg(point, bounds, width, height, padding))
    .map(({ x, y }) => `${Number(x.toFixed(2))},${Number(y.toFixed(2))}`)
    .join(' ');
}

export function municipalityOptions(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => row && row.active !== false && row.id && row.name)
    .map((row) => ({ value: String(row.id), label: String(row.name) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
}
