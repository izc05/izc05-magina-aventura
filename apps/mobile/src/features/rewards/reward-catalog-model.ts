export type RewardCatalogFilterId = 'all' | 'digital' | 'physical';
export type RewardCatalogKind = 'digital' | 'physical' | 'experience' | 'coupon';
export type RewardCatalogRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type RewardCatalogCardStatus = 'owned' | 'available' | 'locked';

export interface RewardCatalogEligibility {
  eligible: boolean;
  reasons: string[];
}

export interface RewardCatalogItemInput {
  id: string;
  name: string;
  kind: RewardCatalogKind;
  rarity: RewardCatalogRarity;
  priceOlives: number;
  partnerName: string | null;
  owned: boolean;
  eligibility: RewardCatalogEligibility;
}

export interface RewardCatalogFilter {
  id: RewardCatalogFilterId;
  label: string;
}

export interface RewardCatalogCardModel {
  id: string;
  name: string;
  kind: RewardCatalogKind;
  kindLabel: string;
  rarity: RewardCatalogRarity;
  rarityLabel: string;
  priceLabel: string;
  partnerLabel: string | null;
  status: RewardCatalogCardStatus;
  statusLabel: string;
  actionLabel: string;
}

export interface RewardCatalogModel {
  activeFilter: RewardCatalogFilterId;
  balanceLabel: string;
  filters: RewardCatalogFilter[];
  cards: RewardCatalogCardModel[];
  emptyLabel: string;
}

export interface RewardCatalogModelInput {
  items: RewardCatalogItemInput[];
  activeFilter: RewardCatalogFilterId;
  availableOlives: number;
}

const FILTERS: RewardCatalogFilter[] = [
  { id: 'all', label: 'Todos' },
  { id: 'digital', label: 'Digitales' },
  { id: 'physical', label: 'Productos locales' },
];

const REASON_LABELS: Record<string, string> = {
  'out-of-stock': 'Agotado',
  'insufficient-olives': 'Te faltan aceitunas',
  'level-required': 'Requiere más nivel',
  'stage-required': 'Haz crecer tu olivo',
  'badge-required': 'Requiere una insignia',
  'challenge-required': 'Completa el reto',
  'not-started': 'Próximamente',
  expired: 'Finalizado',
  inactive: 'No disponible',
  'user-limit-reached': 'Límite alcanzado',
};

const REASON_PRIORITY = [
  'out-of-stock',
  'insufficient-olives',
  'level-required',
  'stage-required',
  'badge-required',
  'challenge-required',
  'not-started',
  'expired',
  'inactive',
  'user-limit-reached',
] as const;

function nonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

function formatNumber(value: number): string {
  return String(nonNegativeInteger(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function kindLabel(kind: RewardCatalogKind): string {
  switch (kind) {
    case 'digital':
      return 'Digital';
    case 'physical':
      return 'Producto local';
    case 'experience':
      return 'Experiencia local';
    case 'coupon':
      return 'Ventaja';
  }
}

function rarityLabel(rarity: RewardCatalogRarity): string {
  switch (rarity) {
    case 'common':
      return 'Común';
    case 'rare':
      return 'Raro';
    case 'epic':
      return 'Épico';
    case 'legendary':
      return 'Legendario';
  }
}

function lockedLabel(reasons: string[]): string {
  for (const reason of REASON_PRIORITY) {
    if (reasons.includes(reason)) {
      return REASON_LABELS[reason] ?? 'No disponible';
    }
  }

  return 'No disponible';
}

function actionForAvailable(kind: RewardCatalogKind): string {
  switch (kind) {
    case 'digital':
      return 'Desbloquear';
    case 'physical':
      return 'Reservar';
    case 'experience':
    case 'coupon':
      return 'Canjear';
  }
}

function buildCard(item: RewardCatalogItemInput): RewardCatalogCardModel {
  const owned = item.owned;
  const available = !owned && item.eligibility.eligible;
  const status: RewardCatalogCardStatus = owned
    ? 'owned'
    : available
      ? 'available'
      : 'locked';

  return {
    id: item.id,
    name: item.name.trim() || 'Recompensa de Mágina',
    kind: item.kind,
    kindLabel: kindLabel(item.kind),
    rarity: item.rarity,
    rarityLabel: rarityLabel(item.rarity),
    priceLabel: `${formatNumber(item.priceOlives)} 🫒`,
    partnerLabel: item.partnerName?.trim() || null,
    status,
    statusLabel:
      status === 'owned'
        ? 'Desbloqueado'
        : status === 'available'
          ? 'Disponible'
          : lockedLabel(item.eligibility.reasons),
    actionLabel:
      status === 'owned'
        ? 'Usar'
        : status === 'available'
          ? actionForAvailable(item.kind)
          : 'Ver requisito',
  };
}

function includedByFilter(
  item: RewardCatalogItemInput,
  filter: RewardCatalogFilterId,
): boolean {
  if (filter === 'all') {
    return true;
  }

  return item.kind === filter;
}

export function buildRewardCatalogModel(
  input: RewardCatalogModelInput,
): RewardCatalogModel {
  const activeFilter = FILTERS.some((filter) => filter.id === input.activeFilter)
    ? input.activeFilter
    : 'all';

  return {
    activeFilter,
    balanceLabel: `${formatNumber(input.availableOlives)} 🫒`,
    filters: FILTERS.map((filter) => ({ ...filter })),
    cards: input.items
      .filter((item) => includedByFilter(item, activeFilter))
      .map(buildCard),
    emptyLabel: 'No hay recompensas en esta categoría',
  };
}
