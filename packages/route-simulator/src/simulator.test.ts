import { describe, expect, it } from 'vitest';
import { route01CuadrosContent } from './fixtures/route-01-cuadros';
import { advanceBySteps, advanceReplay, createSimulator, interpolatePosition, jumpToCheckpoint, routeLengthMeters, snapshot } from './simulator';

const geometry = { coordinates: [[-3.4, 37.7], [-3.4, 37.74], [-3.39, 37.78]] as [number, number][] };

describe('QA route simulator', () => {
  it('interpolates and clamps positions deterministically', () => {
    expect(interpolatePosition(geometry, -1)).toEqual(geometry.coordinates[0]);
    expect(interpolatePosition(geometry, routeLengthMeters(geometry) + 1)).toEqual(geometry.coordinates.at(-1));
    expect(interpolatePosition(geometry, routeLengthMeters(geometry) / 2)).not.toEqual(geometry.coordinates[0]);
  });

  it('replays at selectable speed without changing the source geometry', () => {
    const initial = createSimulator(route01CuadrosContent, geometry, 'replay-test');
    const x1 = advanceReplay(route01CuadrosContent, geometry, initial, 10_000, 1);
    const x10 = advanceReplay(route01CuadrosContent, geometry, initial, 10_000, 10);
    expect(x10.progressMeters).toBeGreaterThan(x1.progressMeters);
    expect(x10.context).toMatchObject({ qaSimulated: true, watermark: 'SIMULACIÓN QA', mode: 'replay', publicEffectsEnabled: false });
  });

  it('advances a virtual route by steps, never the real GPS position', () => {
    const initial = createSimulator(route01CuadrosContent, geometry);
    const walked = advanceBySteps(route01CuadrosContent, geometry, initial, 100);
    expect(walked.context.mode).toBe('walk_to_advance');
    expect(walked.context.qaSimulated).toBe(true);
    expect(walked.progressMeters).toBe(75);
  });

  it('jumps to a checkpoint and unlocks its discovery in prerequisite order', () => {
    const initial = createSimulator(route01CuadrosContent, geometry);
    const jumped = jumpToCheckpoint(route01CuadrosContent, geometry, initial, 'sistillos');
    expect(jumped.reachedCheckpointIds).toEqual(['portal-cuadros', 'corredor-adelfas', 'sistillos']);
    expect(jumped.unlockedDiscoveryIds).toContain('sistillos-discovery');
    expect(snapshot(jumped)).toMatchObject({ qaSimulated: true, publicAchievementEligible: false, rankingEligible: false, sponsorRedemptionEligible: false });
  });

  it('resolves prerequisite chains independently of checkpoint array order', () => {
    const reordered = {
      ...route01CuadrosContent,
      checkpoints: [...route01CuadrosContent.checkpoints].reverse(),
    };
    const initial = createSimulator(reordered, geometry);
    const jumped = jumpToCheckpoint(reordered, geometry, initial, 'sistillos');

    expect(jumped.reachedCheckpointIds).toEqual(['portal-cuadros', 'corredor-adelfas', 'sistillos']);
    expect(jumped.unlockedDiscoveryIds).toContain('sistillos-discovery');
  });

  it('is idempotent when replaying the same timestamp', () => {
    const initial = createSimulator(route01CuadrosContent, geometry);
    const a = advanceReplay(route01CuadrosContent, geometry, initial, 4_000, 4);
    const b = advanceReplay(route01CuadrosContent, geometry, initial, 4_000, 4);
    expect(b).toEqual(a);
  });
});
