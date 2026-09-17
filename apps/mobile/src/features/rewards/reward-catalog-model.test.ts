import { describe, expect, it } from 'vitest';

import {
  buildRewardCatalogModel,
  type RewardCatalogItemInput,
} from './reward-catalog-model';

describe('buildRewardCatalogModel', () => {
  const items: RewardCatalogItemInput[] = [
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
      id: 'digital-wall',
      name: 'Muro de Piedra Legendario',
      kind: 'digital',
      rarity: 'legendary',
      priceOlives: 5000,
      partnerName: null,
      owned: false,
      eligibility: { eligible: false, reasons: ['insufficient-olives'] },
    },
  ];

  it('builds premium reward cards without recomputing eligibility in the UI', () => {
    const model = buildRewardCatalogModel({
      items,
      activeFilter: 'all',
      availableOlives: 4200,
    });

    expect(model.balanceLabel).toBe('4.200 🫒');
    expect(model.cards).toHaveLength(3);

    expect(model.cards[0]).toMatchObject({
      id: 'digital-dawn',
      kindLabel: 'Digital',
      rarityLabel: 'Raro',
      priceLabel: '800 🫒',
      status: 'owned',
      statusLabel: 'Desbloqueado',
      actionLabel: 'Usar',
    });

    expect(model.cards[1]).toMatchObject({
      id: 'physical-aove',
      kindLabel: 'Producto local',
      rarityLabel: 'Épico',
      priceLabel: '3.500 🫒',
      status: 'available',
      statusLabel: 'Disponible',
      actionLabel: 'Reservar',
      partnerLabel: 'Almazara de Mágina',
    });

    expect(model.cards[2]).toMatchObject({
      id: 'digital-wall',
      status: 'locked',
      statusLabel: 'Te faltan aceitunas',
      actionLabel: 'Ver requisito',
    });
  });

  it('filters digital and physical rewards without mutating the source order', () => {
    const digital = buildRewardCatalogModel({
      items,
      activeFilter: 'digital',
      availableOlives: 4200,
    });
    const physical = buildRewardCatalogModel({
      items,
      activeFilter: 'physical',
      availableOlives: 4200,
    });

    expect(digital.cards.map((card) => card.id)).toEqual([
      'digital-dawn',
      'digital-wall',
    ]);
    expect(physical.cards.map((card) => card.id)).toEqual(['physical-aove']);
    expect(items.map((item) => item.id)).toEqual([
      'digital-dawn',
      'physical-aove',
      'digital-wall',
    ]);
  });

  it('translates the most useful domain rejection into a user-facing status', () => {
    const reasons = [
      ['out-of-stock', 'Agotado'],
      ['level-required', 'Requiere más nivel'],
      ['stage-required', 'Haz crecer tu olivo'],
      ['badge-required', 'Requiere una insignia'],
      ['challenge-required', 'Completa el reto'],
      ['not-started', 'Próximamente'],
      ['expired', 'Finalizado'],
      ['inactive', 'No disponible'],
    ] as const;
    const template = items[2]!;

    for (const [reason, expected] of reasons) {
      const model = buildRewardCatalogModel({
        items: [
          {
            ...template,
            id: `reward-${reason}`,
            eligibility: { eligible: false, reasons: [reason] },
          },
        ],
        activeFilter: 'all',
        availableOlives: 10_000,
      });

      expect(model.cards[0]?.statusLabel).toBe(expected);
    }
  });

  it('exposes all supported filters in a stable order', () => {
    const model = buildRewardCatalogModel({
      items: [],
      activeFilter: 'all',
      availableOlives: 0,
    });

    expect(model.filters.map((filter) => filter.id)).toEqual([
      'all',
      'digital',
      'physical',
    ]);
    expect(model.emptyLabel).toBe('No hay recompensas en esta categoría');
  });
});
