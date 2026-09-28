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

export interface CollectionHistoryEntry {
  discoveryId: string;
  category: DiscoveryCategory;
  rarityCode: string;
  discoveredAt: string;
}

export interface CollectionProgressProjection {
  overall: CollectionProgressValue;
  categories: Record<DiscoveryCategory, CollectionProgressValue>;
  history: CollectionHistoryEntry[];
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
  const earliestUnlockById = new Map<string, DiscoveryUnlock>();

  for (const unlock of unlocks) {
    if (!catalogById.has(unlock.discoveryId)) continue;

    const previous = earliestUnlockById.get(unlock.discoveryId);
    if (
      previous === undefined ||
      Date.parse(unlock.discoveredAt) < Date.parse(previous.discoveredAt)
    ) {
      earliestUnlockById.set(unlock.discoveryId, unlock);
    }
  }

  const unlockedIds = new Set(earliestUnlockById.keys());

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

  const history: CollectionHistoryEntry[] = [...earliestUnlockById.entries()]
    .map(([discoveryId, unlock]) => {
      const discovery = catalogById.get(discoveryId)!;
      return {
        discoveryId,
        category: discovery.category,
        rarityCode: discovery.rarityCode,
        discoveredAt: unlock.discoveredAt,
      };
    })
    .sort((a, b) => {
      const timeDifference = Date.parse(b.discoveredAt) - Date.parse(a.discoveredAt);
      return timeDifference !== 0
        ? timeDifference
        : a.discoveryId.localeCompare(b.discoveryId);
    });

  return { overall, categories, history };
}
