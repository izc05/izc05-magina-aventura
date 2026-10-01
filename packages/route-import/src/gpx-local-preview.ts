import { XMLParser, XMLValidator } from 'fast-xml-parser';

export const GPX_LOCAL_PREVIEW_MAX_BYTES = 5 * 1024 * 1024;
const GPX_LOCAL_PREVIEW_MAX_TEXT_LENGTH = GPX_LOCAL_PREVIEW_MAX_BYTES;
const MAX_DISPLAY_TEXT_LENGTH = 160;

export type GpxLocalPreviewInvalidReason =
  | 'wrong-extension'
  | 'empty-file'
  | 'file-too-large'
  | 'unsafe-xml-declaration'
  | 'invalid-xml'
  | 'not-gpx'
  | 'unsupported-version'
  | 'invalid-gpx-structure';

export class GpxLocalPreviewValidationError extends Error {
  constructor(readonly reason: GpxLocalPreviewInvalidReason) {
    super(reason);
    this.name = 'GpxLocalPreviewValidationError';
  }
}

export interface GpxLocalPreviewMetadataField {
  label: string;
  value: string;
}

/** Deliberately excludes coordinates, geometry, metrics, checkpoints, and the source URI. */
export interface GpxLocalPreview {
  fileName: string;
  metadata: GpxLocalPreviewMetadataField[];
  trackCount: number;
  waypointCount: number;
  provenanceStatus: 'Sin verificar / pendiente de autorización';
}

type XmlRecord = Record<string, unknown>;

function isRecord(value: unknown): value is XmlRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function asSingleRecord(value: unknown): XmlRecord | null {
  const first = Array.isArray(value) ? value[0] : value;
  return isRecord(first) ? first : null;
}

function displayText(value: unknown): string | null {
  let candidate = value;
  if (isRecord(value)) candidate = value['#text'];
  if (typeof candidate !== 'string' && typeof candidate !== 'number') return null;
  const cleaned = String(candidate).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  return cleaned.length > MAX_DISPLAY_TEXT_LENGTH
    ? `${cleaned.slice(0, MAX_DISPLAY_TEXT_LENGTH - 1)}…`
    : cleaned;
}

function safeFileName(fileName: string): string {
  const baseName = fileName.split(/[\\/]/).pop()?.trim() ?? '';
  return displayText(baseName) ?? 'Archivo GPX';
}

function countElements(value: unknown): number {
  if (value === undefined) return 0;
  const values = Array.isArray(value) ? value : [value];
  if (values.some((entry) => !isRecord(entry))) {
    throw new GpxLocalPreviewValidationError('invalid-gpx-structure');
  }
  return values.length;
}

function metadataFields(gpx: XmlRecord): GpxLocalPreviewMetadataField[] {
  const metadata = asSingleRecord(gpx.metadata) ?? {};
  const author = asSingleRecord(metadata.author);
  const copyright = asSingleRecord(metadata.copyright);
  const candidates: Array<[string, unknown]> = [
    ['Versión GPX', gpx['@_version']],
    ['Creador declarado', gpx['@_creator']],
    ['Nombre declarado', metadata.name ?? gpx.name],
    ['Descripción declarada', metadata.desc ?? gpx.desc],
    ['Autor declarado', author?.name],
    ['Titular declarado', copyright?.['@_author']],
    ['Fecha declarada en metadatos', metadata.time],
    ['Palabras clave declaradas', metadata.keywords],
  ];
  return candidates.flatMap(([label, rawValue]) => {
    const value = displayText(rawValue);
    return value ? [{ label, value }] : [];
  });
}

/**
 * Validates only the selected file's extension, bounded XML content, GPX root,
 * and supported format version, then returns a display-only metadata summary.
 * It intentionally does not inspect or return track coordinates.
 */
export function createGpxLocalPreview(
  fileName: string,
  xml: string,
  sizeBytes: number,
): GpxLocalPreview {
  const displayFileName = safeFileName(fileName);
  if (!displayFileName.toLocaleLowerCase().endsWith('.gpx')) {
    throw new GpxLocalPreviewValidationError('wrong-extension');
  }
  if (sizeBytes === 0 || xml.length === 0) {
    throw new GpxLocalPreviewValidationError('empty-file');
  }
  if (sizeBytes > GPX_LOCAL_PREVIEW_MAX_BYTES || xml.length > GPX_LOCAL_PREVIEW_MAX_TEXT_LENGTH) {
    throw new GpxLocalPreviewValidationError('file-too-large');
  }
  // DTD/entity declarations are not needed by GPX and are rejected before either parser runs.
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml)) {
    throw new GpxLocalPreviewValidationError('unsafe-xml-declaration');
  }
  if (XMLValidator.validate(xml) !== true) {
    throw new GpxLocalPreviewValidationError('invalid-xml');
  }

  let parsed: unknown;
  try {
    parsed = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: false,
      removeNSPrefix: true,
      trimValues: true,
    }).parse(xml);
  } catch {
    throw new GpxLocalPreviewValidationError('invalid-xml');
  }

  const root = isRecord(parsed) ? parsed.gpx : undefined;
  const gpx = asSingleRecord(root);
  if (!gpx) throw new GpxLocalPreviewValidationError('not-gpx');

  const version = displayText(gpx['@_version']);
  if (version !== '1.0' && version !== '1.1') {
    throw new GpxLocalPreviewValidationError('unsupported-version');
  }
  if (gpx.metadata !== undefined && !asSingleRecord(gpx.metadata)) {
    throw new GpxLocalPreviewValidationError('invalid-gpx-structure');
  }

  return {
    fileName: displayFileName,
    metadata: metadataFields(gpx),
    trackCount: countElements(gpx.trk),
    waypointCount: countElements(gpx.wpt),
    provenanceStatus: 'Sin verificar / pendiente de autorización',
  };
}
