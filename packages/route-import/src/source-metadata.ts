export interface ImportedGeometrySource {
  sourceId: string;
  format: 'gpx' | 'geojson' | 'kml' | 'gml';
  importedAt: string;
  geometryVersion: number;
}

export function createImportedGeometrySource(input: {
  sourceId: string;
  format: ImportedGeometrySource['format'];
  importedAt: string;
  geometryVersion: number;
}): ImportedGeometrySource {
  if (!Number.isFinite(Date.parse(input.importedAt))) {
    throw new Error('Invalid importedAt date');
  }

  if (!Number.isInteger(input.geometryVersion) || input.geometryVersion < 1) {
    throw new Error('geometryVersion must be a positive integer');
  }

  return { ...input };
}
