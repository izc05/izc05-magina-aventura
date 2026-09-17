import { describe, expect, it } from 'vitest';

import type { LevelDefinition } from '../gamification/level-progression';
import {
  projectOliveTree,
  type OliveTreeStageDefinition,
} from './olive-tree-progression';

const levels: LevelDefinition[] = [
  { level: 50, name: 'Leyenda', minXp: 20_000, rewardOlives: 0, active: true },
  { level: 31, name: 'Maduro', minXp: 8_000, rewardOlives: 0, active: true },
  { level: 26, name: 'Adulto', minXp: 5_000, rewardOlives: 0, active: true },
  { level: 21, name: 'Fuerte', minXp: 3_500, rewardOlives: 0, active: true },
  { level: 1, name: 'Inicio', minXp: 0, rewardOlives: 0, active: true },
];

const stages: OliveTreeStageDefinition[] = [
  { id: 'legend', name: 'Leyenda de Mágina', minLevel: 46, active: true },
  { id: 'mature', name: 'Olivo maduro', minLevel: 31, active: true },
  { id: 'adult', name: 'Olivo adulto', minLevel: 26, active: true },
  { id: 'strong', name: 'Olivo fuerte', minLevel: 21, active: true },
  { id: 'sprout', name: 'Brote', minLevel: 1, active: true },
];

describe('projectOliveTree', () => {
  it('projects the tree stage from the existing XP level', () => {
    const result = projectOliveTree(5_000, levels, stages);

    expect(result.level).toBe(26);
    expect(result.levelName).toBe('Adulto');
    expect(result.stage?.id).toBe('adult');
    expect(result.nextStage?.id).toBe('mature');
    expect(result.levelsToNextStage).toBe(5);
  });

  it('ignores inactive stages and input order', () => {
    const result = projectOliveTree(8_000, levels, [
      ...stages,
      { id: 'centenary', name: 'No disponible', minLevel: 30, active: false },
    ]);

    expect(result.stage?.id).toBe('mature');
    expect(result.nextStage?.id).toBe('legend');
  });

  it('returns no stage before the first configured level is reached', () => {
    const delayedLevels: LevelDefinition[] = [
      { level: 1, name: 'Inicio', minXp: 100, rewardOlives: 0, active: true },
    ];

    const result = projectOliveTree(40, delayedLevels, stages);

    expect(result.level).toBeNull();
    expect(result.stage).toBeNull();
    expect(result.nextStage).toBeNull();
    expect(result.levelsToNextStage).toBeNull();
  });

  it('keeps legend as the terminal visual stage at the highest level', () => {
    const result = projectOliveTree(25_000, levels, stages);

    expect(result.level).toBe(50);
    expect(result.stage?.id).toBe('legend');
    expect(result.nextStage).toBeNull();
    expect(result.levelsToNextStage).toBeNull();
    expect(result.levelProgressPercentage).toBe(100);
  });

  it('normalizes invalid XP through the existing level progression rules', () => {
    const result = projectOliveTree(Number.NaN, levels, stages);

    expect(result.totalXp).toBe(0);
    expect(result.level).toBe(1);
    expect(result.stage?.id).toBe('sprout');
  });
});
