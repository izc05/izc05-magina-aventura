import type { OliveTreeDashboardInput } from './olive-tree-dashboard-model';
import type { RewardCatalogItemInput } from './reward-catalog-model';

// Temporary development repository for isolated Plan 08 screens.
// Production adapters will replace this fixture with authenticated Supabase data.
export const developmentOliveTreeDashboard: OliveTreeDashboardInput = {
  treeName: 'Mi Olivo de Mágina',
  level: 18,
  levelName: 'Raíces de Mágina',
  stageName: 'Olivo en desarrollo',
  progressPercentage: 64,
  nextStageName: 'Olivo fuerte',
  levelsToNextStage: 3,
  availableOlives: 4200,
  reservedOlives: 3500,
  lifetimeGrantedOlives: 8200,
  ownedDigitalRewards: 4,
};

export const developmentRewardItems: RewardCatalogItemInput[] = [
  {
    id: 'digital-dawn',
    name: 'Amanecer entre Olivos',
    kind: 'digital',
    rarity: 'rare',
    priceOlives: 800,
    partnerName: null,
    owned: true,
    eligibility: { eligible: false, reasons: ['user-limit-reached'] },
  },
  {
    id: 'physical-aove',
    name: 'AOVE Sierra Mágina · 500 ml',
    kind: 'physical',
    rarity: 'epic',
    priceOlives: 3500,
    partnerName: 'Almazara de Mágina',
    owned: false,
    eligibility: { eligible: true, reasons: [] },
  },
  {
    id: 'digital-stone-wall',
    name: 'Muro de Piedra Legendario',
    kind: 'digital',
    rarity: 'legendary',
    priceOlives: 5000,
    partnerName: null,
    owned: false,
    eligibility: { eligible: false, reasons: ['insufficient-olives'] },
  },
  {
    id: 'physical-tasting',
    name: 'Visita y cata de AOVE',
    kind: 'physical',
    rarity: 'legendary',
    priceOlives: 6500,
    partnerName: 'Productores de Sierra Mágina',
    owned: false,
    eligibility: { eligible: false, reasons: ['level-required'] },
  },
];
