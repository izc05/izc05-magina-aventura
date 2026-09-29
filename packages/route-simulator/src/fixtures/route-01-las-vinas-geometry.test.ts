import { describe, expect, it } from 'vitest';

import { distanceMeters } from '@magina-aventura/geo';

import { route01CuadrosContent } from './route-01-cuadros';
import {
  route01LasVinasBounds,
  route01LasVinasCoordinates,
  route01LasVinasGeometryMetadata,
  route01LasVinasStart,
} from './route-01-las-vinas-geometry';
import {
  interpolatePosition,
  routeLengthMeters,
  scaleAdventureCheckpointsToGeometry,
} from '../simulator';

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

  it('projects all eight authored checkpoints monotonically onto the official line', () => {
    const scaled = scaleAdventureCheckpointsToGeometry(
      route01CuadrosContent,
      geometry,
    );
    const routeMeters = routeLengthMeters(geometry);

    expect(scaled.checkpoints).toHaveLength(8);
    expect(scaled.checkpoints[0]?.progressMeters).toBe(0);
    expect(scaled.checkpoints.at(-1)?.progressMeters).toBeCloseTo(
      routeMeters,
      5,
    );

    for (let index = 1; index < scaled.checkpoints.length; index += 1) {
      expect(scaled.checkpoints[index]!.progressMeters).toBeGreaterThan(
        scaled.checkpoints[index - 1]!.progressMeters,
      );
    }

    for (const checkpoint of scaled.checkpoints) {
      const position = interpolatePosition(
        geometry,
        checkpoint.progressMeters,
      );
      expect(Number.isFinite(position[0])).toBe(true);
      expect(Number.isFinite(position[1])).toBe(true);
      expect(position[0]).toBeGreaterThanOrEqual(route01LasVinasBounds[0]);
      expect(position[0]).toBeLessThanOrEqual(route01LasVinasBounds[2]);
      expect(position[1]).toBeGreaterThanOrEqual(route01LasVinasBounds[1]);
      expect(position[1]).toBeLessThanOrEqual(route01LasVinasBounds[3]);
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
