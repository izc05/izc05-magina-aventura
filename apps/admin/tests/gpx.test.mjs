import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGpxTrack, toLineStringWkt, startPointWkt } from '../src/core/gpx.mjs';

const sample = `<?xml version="1.0"?><gpx><trk><trkseg>
<trkpt lat="37.765" lon="-3.412"><ele>820</ele></trkpt>
<trkpt lat="37.766" lon="-3.411"><ele>835</ele></trkpt>
<trkpt lat="37.767" lon="-3.410"><ele>840</ele></trkpt>
</trkseg></trk></gpx>`;

test('parses GPX track points in lon/lat order', () => {
  assert.deepEqual(parseGpxTrack(sample), [
    [-3.412, 37.765],
    [-3.411, 37.766],
    [-3.410, 37.767]
  ]);
});

test('builds PostGIS WKT line and start point', () => {
  const points = parseGpxTrack(sample);
  assert.equal(toLineStringWkt(points), 'SRID=4326;LINESTRING(-3.412 37.765,-3.411 37.766,-3.41 37.767)');
  assert.equal(startPointWkt(points), 'SRID=4326;POINT(-3.412 37.765)');
});

test('rejects a GPX without at least two valid track points', () => {
  assert.throws(() => parseGpxTrack('<gpx><trkpt lat="37" lon="-3" /></gpx>'), /at least two/i);
});
