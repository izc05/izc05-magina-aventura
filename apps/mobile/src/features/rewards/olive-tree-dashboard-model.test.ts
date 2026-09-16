import { describe, expect, it } from 'vitest';

import { buildOliveTreeDashboardModel } from './olive-tree-dashboard-model';

describe('buildOliveTreeDashboardModel', () => {
  it('keeps permanent tree progress separate from the spendable olive balance', () => {
    const model = buildOliveTreeDashboardModel({
      treeName: 'Mi Olivo de Mágina',
      level: 18,
      levelName: 'Raíces de Mágina',
      stageName: 'Olivo en desarrollo',
      progressPercentage: 64,
      nextStageName: 'Olivo fuerte',
      levelsToNextStage: 3,
      availableOlives: 1250,
      reservedOlives: 3500,
      lifetimeGrantedOlives: 8200,
      ownedDigitalRewards: 4,
    });

    expect(model.title).toBe('Mi Olivo de Mágina');
    expect(model.stageLabel).toBe('Olivo en desarrollo');
    expect(model.levelLabel).toBe('Nivel 18 · Raíces de Mágina');
    expect(model.progressPercentage).toBe(64);
    expect(model.availableOlivesLabel).toBe('1.250');
    expect(model.reservedOlivesLabel).toBe('3.500 reservadas');
    expect(model.nextMilestoneLabel).toBe('Olivo fuerte · dentro de 3 niveles');
    expect(model.historyLabel).toBe('8.200 🫒 ganadas en total');
    expect(model.collectionLabel).toBe('4 objetos desbloqueados');
  });

  it('clamps invalid progress and never derives the tree stage from wallet balances', () => {
    const richWallet = buildOliveTreeDashboardModel({
      treeName: '  ',
      level: 1,
      levelName: 'Primeros pasos',
      stageName: 'Brote',
      progressPercentage: 180,
      nextStageName: 'Plantón',
      levelsToNextStage: 4,
      availableOlives: 50_000,
      reservedOlives: 0,
      lifetimeGrantedOlives: 50_000,
      ownedDigitalRewards: 0,
    });

    const emptyWallet = buildOliveTreeDashboardModel({
      treeName: '',
      level: 1,
      levelName: 'Primeros pasos',
      stageName: 'Brote',
      progressPercentage: 180,
      nextStageName: 'Plantón',
      levelsToNextStage: 4,
      availableOlives: 0,
      reservedOlives: 0,
      lifetimeGrantedOlives: 50_000,
      ownedDigitalRewards: 0,
    });

    expect(richWallet.title).toBe('Mi Olivo');
    expect(richWallet.progressPercentage).toBe(100);
    expect(richWallet.stageLabel).toBe('Brote');
    expect(emptyWallet.stageLabel).toBe('Brote');
    expect(emptyWallet.levelLabel).toBe(richWallet.levelLabel);
    expect(emptyWallet.availableOlivesLabel).toBe('0');
  });

  it('shows a completed milestone when the tree has reached the final stage', () => {
    const model = buildOliveTreeDashboardModel({
      treeName: 'Leyenda',
      level: 50,
      levelName: 'Leyenda de Mágina',
      stageName: 'Leyenda de Mágina',
      progressPercentage: 100,
      nextStageName: null,
      levelsToNextStage: null,
      availableOlives: 900,
      reservedOlives: 0,
      lifetimeGrantedOlives: 24_000,
      ownedDigitalRewards: 12,
    });

    expect(model.nextMilestoneLabel).toBe('Etapa máxima alcanzada');
    expect(model.progressPercentage).toBe(100);
    expect(model.actions.map((action) => action.id)).toEqual([
      'rewards',
      'customize',
      'history',
      'achievements',
    ]);
  });
});
