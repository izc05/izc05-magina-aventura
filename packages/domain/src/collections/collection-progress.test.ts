import { describe, expect, it } from 'vitest';

import {
  DISCOVERY_CATEGORIES,
  projectCollectionProgress,
  type CollectionDiscovery,
  type DiscoveryUnlock,
} from './collection-progress';

const catalog: CollectionDiscovery[] = [
  { id: 'flora-1', category: 'flora', rarityCode: 'local-common' },
  { id: 'fauna-1', category: 'fauna', rarityCode: 'local-common' },
  { id: 'heritage-1', category: 'heritage', rarityCode: 'singular' },
];

function unlock(
  discoveryId: string,
  discoveredAt = '2026-09-16T06:00:00.000Z',
): DiscoveryUnlock {
  return { discoveryId, discoveredAt };
}

describe('projectCollectionProgress', () => {
  it('counts duplicate unlocks once and ignores discovery ids outside the catalog', () => {
    const result = projectCollectionProgress(catalog, [
      unlock('flora-1'),
      unlock('flora-1', '2026-09-16T06:05:00.000Z'),
      unlock('unknown-1'),
    ]);

    expect(result.overall.total).toBe(3);
    expect(result.overall.unlocked).toBe(1);
    expect(result.overall.percentage).toBeCloseTo(100 / 3, 8);
  });

  it('returns independent progress for all six canonical discovery categories', () => {
    const result = projectCollectionProgress(catalog, [
      unlock('flora-1'),
      unlock('heritage-1'),
    ]);

    expect(Object.keys(result.categories)).toEqual([...DISCOVERY_CATEGORIES]);
    expect(result.categories.flora).toEqual({
      total: 1,
      unlocked: 1,
      percentage: 100,
    });
    expect(result.categories.fauna).toEqual({
      total: 1,
      unlocked: 0,
      percentage: 0,
    });
    expect(result.categories.heritage).toEqual({
      total: 1,
      unlocked: 1,
      percentage: 100,
    });
    expect(result.categories.olive).toEqual({
      total: 0,
      unlocked: 0,
      percentage: 0,
    });
    expect(result.categories.tradition).toEqual({
      total: 0,
      unlocked: 0,
      percentage: 0,
    });
    expect(result.categories.landscape).toEqual({
      total: 0,
      unlocked: 0,
      percentage: 0,
    });
  });

  it('uses zero percentages for an empty catalog', () => {
    const result = projectCollectionProgress([], [unlock('unknown-1')]);

    expect(result.overall).toEqual({ total: 0, unlocked: 0, percentage: 0 });
    for (const category of DISCOVERY_CATEGORIES) {
      expect(result.categories[category]).toEqual({
        total: 0,
        unlocked: 0,
        percentage: 0,
      });
    }
  });

  it('keeps the earliest unlock per discovery and sorts history newest-first with a stable tie break', () => {
    const result = projectCollectionProgress(catalog, [
      unlock('flora-1', '2026-09-16T06:05:00.000Z'),
      unlock('flora-1', '2026-09-16T06:00:00.000Z'),
      unlock('heritage-1', '2026-09-16T06:10:00.000Z'),
      unlock('fauna-1', '2026-09-16T06:10:00.000Z'),
      unlock('unknown-1', '2026-09-16T06:20:00.000Z'),
    ]);

    expect(result.history).toEqual([
      {
        discoveryId: 'fauna-1',
        category: 'fauna',
        rarityCode: 'local-common',
        discoveredAt: '2026-09-16T06:10:00.000Z',
      },
      {
        discoveryId: 'heritage-1',
        category: 'heritage',
        rarityCode: 'singular',
        discoveredAt: '2026-09-16T06:10:00.000Z',
      },
      {
        discoveryId: 'flora-1',
        category: 'flora',
        rarityCode: 'local-common',
        discoveredAt: '2026-09-16T06:00:00.000Z',
      },
    ]);
  });
});
