import test from 'node:test';
import assert from 'node:assert/strict';
import { sniffTrackFormat, parseTrackText, sha256Hex } from '../src/core/track-import.mjs';

const gpx = `<?xml version="1.0"?><gpx><trk><trkseg><trkpt lat="37.7" lon="-3.5"/><trkpt lat="37.71" lon="-3.49"/></trkseg></trk></gpx>`;
const kml = `<?xml version="1.0"?><kml><Document><Placemark><LineString><coordinates>-3.5,37.7,900 -3.49,37.71,905</coordinates></LineString></Placemark></Document></kml>`;

test('sniffTrackFormat detects GPX and KML from XML content', () => {
  assert.equal(sniffTrackFormat(gpx), 'gpx');
  assert.equal(sniffTrackFormat(kml), 'kml');
  assert.throws(() => sniffTrackFormat('<xml/>'), /GPX o KML/i);
});

test('parseTrackText normalizes GPX and KML to PostGIS WKT', () => {
  assert.deepEqual(parseTrackText(gpx), {
    format: 'gpx',
    points: [[-3.5,37.7],[-3.49,37.71]],
    geometryWkt: 'SRID=4326;LINESTRING(-3.5 37.7,-3.49 37.71)'
  });
  assert.deepEqual(parseTrackText(kml), {
    format: 'kml',
    points: [[-3.5,37.7],[-3.49,37.71]],
    geometryWkt: 'SRID=4326;LINESTRING(-3.5 37.7,-3.49 37.71)'
  });
});

test('sha256Hex creates a stable lowercase digest', async () => {
  assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
