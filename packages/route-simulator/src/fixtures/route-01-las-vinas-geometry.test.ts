import { describe, expect, it } from 'vitest';

import { distanceMeters } from '@magina-aventura/geo';

import {
  route01LasVinasBounds,
  route01LasVinasCoordinates,
  route01LasVinasGeometryMetadata,
  route01LasVinasStart,
} from './route-01-las-vinas-geometry';
import { routeLengthMeters } from '../simulator';

describe('ROUTE-01 official Las Viñas geometry', () => {
  const geometry = { coordinates: route01LasVinasCoordinates };

  it('pins the verified source identity and point count', () => {
    expect(route01LasVinasGeometryMetadata.officialCode).toBe('724');
    expect(route01LasVinasGeometryMetadata.geometryVersion).toBe(1);
    expect(route01LasVinasGeometryMetadata.sourceAssetSha256).toBe(
      '126ddddb1eb9ec62297e66be9138dd51b6a7042ff80fc06fd2d2fb24043faa59',
    );
    expect(route01LasVinasCoordinates).toHaveLength(400);
  });

  it('matches the verified official route length within one metre', () => {
    expect(routeLengthMeters(geometry)).toBeCloseTo(8720.382, 0);
  });

  it('is circular and has no suspicious >250 m segment jumps', () => {
    const start = route01LasVinasCoordinates[0]!;
    const end = route01LasVinasCoordinates.at(-1)!;
    expect(
      distanceMeters(
        { latitude: start[1], longitude: start[0] },
        { latitude: end[1], longitude: end[0] },
      ),
    ).toBeLessThan(5);

    for (let index = 1; index < route01LasVinasCoordinates.length; index += 1) {
      const previous = route01LasVinasCoordinates[index - 1]!;
      const current = route01LasVinasCoordinates[index]!;
      const segment = distanceMeters(
        { latitude: previous[1], longitude: previous[0] },
        { latitude: current[1], longitude: current[0] },
      );
      expect(segment).toBeLessThanOrEqual(250);
    }
  });

  it('pins verified start and bounds', () => {
    expect(route01LasVinasStart).toEqual([
      -3.40866635259474,
      37.7875876188151,
    ]);
    expect(route01LasVinasBounds).toEqual([
      -3.42768246777392,
      37.7788030212631,
      -3.40662306017906,
      37.7934379160086,
    ]);
  });
});
