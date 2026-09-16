export const DISCOVERY_CATEGORIES = [
  'flora',
  'fauna',
  'heritage',
  'olive',
  'tradition',
  'landscape',
] as const;

export type DiscoveryCategory = (typeof DISCOVERY_CATEGORIES)[number];

export interface CollectionDiscovery {
  id: string;
  category: DiscoveryCategory;
  rarityCode: string;
}

export interface DiscoveryUnlock {
  discoveryId: string;
  discoveredAt: string;
}

export interface CollectionProgressValue {
  total: number;
  unlocked: number;
  percentage: number;
}

export interface CollectionProgressProjection {
  overall: CollectionProgressValue;
  categories: Record<DiscoveryCategory, CollectionProgressValue>;
}

function percentage(unlocked: number, total: number): number {
  return total === 0 ? 0 : (unlocked / total) * 100;
}

function emptyProgress(): CollectionProgressValue {
  return { total: 0, unlocked: 0, percentage: 0 };
}

export function projectCollectionProgress(
  catalog: CollectionDiscovery[],
  unlocks: DiscoveryUnlock[],
): CollectionProgressProjection {
  const categories: Record<DiscoveryCategory, CollectionProgressValue> = {
    flora: emptyProgress(),
    fauna: emptyProgress(),
    heritage: emptyProgress(),
    olive: emptyProgress(),
    tradition: emptyProgress(),
    landscape: emptyProgress(),
  };

  const catalogById = new Map(
    catalog.map((discovery) => [discovery.id, discovery] as const),
  );
  const unlockedIds = new Set(
    unlocks
      .map((unlock) => unlock.discoveryId)
      .filter((discoveryId) => catalogById.has(discoveryId)),
  );

  for (const discovery of catalog) {
    categories[discovery.category].total += 1;
    if (unlockedIds.has(discovery.id)) {
      categories[discovery.category].unlocked += 1;
    }
  }

  for (const category of DISCOVERY_CATEGORIES) {
    const progress = categories[category];
    progress.percentage = percentage(progress.unlocked, progress.total);
  }

  const overall = {
    total: catalog.length,
    unlocked: unlockedIds.size,
    percentage: percentage(unlockedIds.size, catalog.length),
  };

  return { overall, categories };
}
