import { describe, expect, it } from 'vitest';
import {
  createGpxLocalPreview,
  GPX_LOCAL_PREVIEW_MAX_BYTES,
  GpxLocalPreviewValidationError,
} from './gpx-local-preview';
import { SYNTHETIC_TEST_ONLY_GPX } from './gpx-local-preview.test-fixture';

const FIXTURE_SIZE = SYNTHETIC_TEST_ONLY_GPX.length;

function expectInvalid(xml: string, reason: string, fileName = 'prueba.gpx', sizeBytes = xml.length) {
  try {
    createGpxLocalPreview(fileName, xml, sizeBytes);
    throw new Error('Expected GPX preview validation to fail');
  } catch (error) {
    expect(error).toBeInstanceOf(GpxLocalPreviewValidationError);
    expect((error as GpxLocalPreviewValidationError).reason).toBe(reason);
  }
}

describe('createGpxLocalPreview', () => {
  it('returns only the filename, present metadata, track/waypoint counts, and unverified provenance', () => {
    const preview = createGpxLocalPreview('archivo-sintetico.GPX', SYNTHETIC_TEST_ONLY_GPX, FIXTURE_SIZE);
    expect(preview).toEqual({
      fileName: 'archivo-sintetico.GPX',
      metadata: [
        { label: 'Versión GPX', value: '1.1' },
        { label: 'Creador declarado', value: 'fixture-de-prueba' },
        { label: 'Nombre declarado', value: 'Fixture sintético · solo pruebas' },
        {
          label: 'Descripción declarada',
          value: 'Contenido fabricado que no representa un sendero ni acredita autorización.',
        },
        { label: 'Autor declarado', value: 'Autoría sintética de prueba' },
      ],
      trackCount: 1,
      waypointCount: 2,
      provenanceStatus: 'Sin verificar / pendiente de autorización',
    });
    expect(Object.keys(preview)).toEqual([
      'fileName',
      'metadata',
      'trackCount',
      'waypointCount',
      'provenanceStatus',
    ]);
    expect(JSON.stringify(preview)).not.toMatch(/coordinates|elevations|distance|ascent|checkpoint|geometry|uri/i);
  });

  it('rejects a non-GPX filename before parsing content', () => {
    expectInvalid(SYNTHETIC_TEST_ONLY_GPX, 'wrong-extension', 'fixture.xml', FIXTURE_SIZE);
  });

  it('rejects an empty file and oversized local previews', () => {
    expectInvalid('', 'empty-file', 'empty.gpx', 0);
    expectInvalid(SYNTHETIC_TEST_ONLY_GPX, 'file-too-large', 'large.gpx', GPX_LOCAL_PREVIEW_MAX_BYTES + 1);
  });

  it('rejects malformed XML and a well-formed document whose root is not GPX', () => {
    expectInvalid('<gpx version="1.1"><trk>', 'invalid-xml');
    expectInvalid('<xml version="1.1"><trk /></xml>', 'not-gpx');
  });

  it('rejects unsupported GPX versions and structurally invalid count elements', () => {
    expectInvalid('<gpx version="2.0"><trk /></gpx>', 'unsupported-version');
    expectInvalid('<gpx version="1.1"><trk>not a GPX track object</trk></gpx>', 'invalid-gpx-structure');
  });

  it('rejects DTD and entity declarations before parsing', () => {
    const xml = '<!DOCTYPE gpx [<!ENTITY x "expanded">]><gpx version="1.1"><metadata><name>&x;</name></metadata></gpx>';
    expectInvalid(xml, 'unsafe-xml-declaration');
  });

  it('bounds displayed metadata text and omits absent fields', () => {
    const longName = 'x'.repeat(300);
    const xml = `<gpx version="1.1" creator=""><metadata><name>${longName}</name></metadata></gpx>`;
    const preview = createGpxLocalPreview('short.gpx', xml, xml.length);
    expect(preview.metadata).toEqual([
      { label: 'Versión GPX', value: '1.1' },
      { label: 'Nombre declarado', value: `${'x'.repeat(159)}…` },
    ]);
    expect(preview.trackCount).toBe(0);
    expect(preview.waypointCount).toBe(0);
  });
});
