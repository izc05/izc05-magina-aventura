import { describe, expect, it } from 'vitest';
import { buildPmtilesSourceUri, materializeMapStyle } from './map-style';

describe('PMTiles style materialization', () => {
  it('uses remote HTTPS PMTiles', () => {
    expect(buildPmtilesSourceUri('https://cdn.example.test/map.pmtiles'))
      .toBe('pmtiles://https://cdn.example.test/map.pmtiles');
  });

  it('prefers a local PMTiles file', () => {
    expect(buildPmtilesSourceUri(
      'https://cdn.example.test/map.pmtiles',
      'file:///data/map.pmtiles',
    )).toBe('pmtiles://file:///data/map.pmtiles');
  });

  it('replaces the archive token in style JSON', () => {
    const style = materializeMapStyle(
      JSON.stringify({
        version: 8,
        sources: { base: { type: 'vector', url: '__ROUTE_PMTILES__' } },
        layers: [],
      }),
      'pmtiles://https://cdn.example.test/map.pmtiles',
    ) as { sources: { base: { url: string } } };

    expect(style.sources.base.url)
      .toBe('pmtiles://https://cdn.example.test/map.pmtiles');
  });

  it('rejects non-HTTPS remote PMTiles URLs', () => {
    expect(() => buildPmtilesSourceUri('http://cdn.example.test/map.pmtiles'))
      .toThrow('PMTiles remote URL must use HTTPS');
  });

  it('rejects non-file local PMTiles URIs', () => {
    expect(() => buildPmtilesSourceUri(
      'https://cdn.example.test/map.pmtiles',
      '/data/map.pmtiles',
    )).toThrow('PMTiles local URI must use file://');
  });

  it('rejects unsupported style versions', () => {
    expect(() => materializeMapStyle(
      JSON.stringify({ version: 7, sources: {}, layers: [] }),
      'pmtiles://https://cdn.example.test/map.pmtiles',
    )).toThrow('Map style version must be 8');
  });
});
