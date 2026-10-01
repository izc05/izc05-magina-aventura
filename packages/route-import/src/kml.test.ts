import { describe, expect, it } from 'vitest';
import { parseKml } from './kml';

const valid = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><LineString><coordinates>
-3.5000,37.7000,900 -3.4990,37.7010,905 -3.4980,37.7020
</coordinates></LineString></Placemark></Document></kml>`;

describe('parseKml', () => {
  it('normalizes KML LineString coordinates', () => {
    const result = parseKml(valid, 'route-test', 3);
    expect(result.line.geometry.coordinates).toEqual([
      [-3.5, 37.7],
      [-3.499, 37.701],
      [-3.498, 37.702],
    ]);
    expect(result.elevationsM).toEqual([900, 905, null]);
    expect(result.start).toEqual([-3.5, 37.7]);
    expect(result.bounds).toEqual([-3.5, 37.7, -3.498, 37.702]);
    expect(result.line.properties).toEqual({ routeId: 'route-test', geometryVersion: 3 });
  });

  it('rejects KML without a LineString', () => {
    expect(() => parseKml('<kml><Placemark><Point><coordinates>-3.5,37.7</coordinates></Point></Placemark></kml>', 'route-test', 1)).toThrow('KML contains no route LineString');
  });

  it('rejects malformed XML', () => {
    expect(() => parseKml('<kml><Document>', 'route-test', 1)).toThrow('Invalid KML XML');
  });

  it('rejects invalid longitude and latitude', () => {
    const invalid = '<kml><Placemark><LineString><coordinates>181,37.7 0,37.8</coordinates></LineString></Placemark></kml>';
    expect(() => parseKml(invalid, 'route-test', 1)).toThrow('Invalid longitude');
  });
});
