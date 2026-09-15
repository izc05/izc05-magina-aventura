import { describe, expect, it } from 'vitest';
import { parseGpx } from './gpx';

const valid = `<?xml version="1.0"?>
<gpx version="1.1" creator="test"><trk><trkseg>
<trkpt lat="37.7000" lon="-3.5000"><ele>900</ele></trkpt>
<trkpt lat="37.7010" lon="-3.4990"><ele>905</ele></trkpt>
</trkseg></trk></gpx>`;

describe('parseGpx', () => {
  it('normalizes GPX track points', () => {
    const result = parseGpx(valid, 'route-test', 2);

    expect(result.line.geometry.coordinates).toEqual([
      [-3.5, 37.7],
      [-3.499, 37.701],
    ]);
    expect(result.elevationsM).toEqual([900, 905]);
    expect(result.start).toEqual([-3.5, 37.7]);
    expect(result.bounds).toEqual([-3.5, 37.7, -3.499, 37.701]);
    expect(result.line.properties).toEqual({
      routeId: 'route-test',
      geometryVersion: 2,
    });
  });

  it('rejects empty GPX', () => {
    expect(() => parseGpx('<gpx version="1.1"/>', 'route-test', 1)).toThrow(
      'GPX contains no route coordinates',
    );
  });

  it('rejects malformed XML', () => {
    expect(() => parseGpx('<gpx><trk>', 'route-test', 1)).toThrow(
      'Invalid GPX XML',
    );
  });

  it('rejects invalid coordinates', () => {
    const invalid = '<gpx><trk><trkseg><trkpt lat="91" lon="0"/><trkpt lat="0" lon="1"/></trkseg></trk></gpx>';
    expect(() => parseGpx(invalid, 'route-test', 1)).toThrow('Invalid latitude');
  });

  it('rejects track points with missing longitude', () => {
    const invalid = '<gpx><trk><trkseg><trkpt lat="37.7"/><trkpt lat="37.71" lon="-3.4"/></trkseg></trk></gpx>';
    expect(() => parseGpx(invalid, 'route-test', 1)).toThrow('Invalid longitude');
  });
});
