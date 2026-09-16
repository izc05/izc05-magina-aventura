import { describe, expect, it } from 'vitest';

import {
  levelsCrossed,
  projectLevelProgress,
  type LevelDefinition,
} from './level-progression';

const levels: LevelDefinition[] = [
  {
    level: 4,
    name: 'Cumbre',
    minXp: 1500,
    rewardOlives: 40,
    active: true,
  },
  {
    level: 2,
    name: 'Senda',
    minXp: 500,
    rewardOlives: 10,
    active: false,
  },
  {
    level: 1,
    name: 'Inicio',
    minXp: 0,
    rewardOlives: 0,
    active: true,
  },
  {
    level: 3,
    name: 'Sierra',
    minXp: 1000,
    rewardOlives: 25,
    active: true,
  },
];

describe('projectLevelProgress', () => {
  it('resolves active levels by minXp regardless of input order', () => {
    const result = projectLevelProgress(750, levels);

    expect(result.currentLevel?.level).toBe(1);
    expect(result.nextLevel?.level).toBe(3);
    expect(result.xpIntoCurrentLevel).toBe(750);
    expect(result.xpToNextLevel).toBe(250);
    expect(result.progressPercentage).toBe(75);
  });

  it('reports the top active level with full progress and no next level', () => {
    const result = projectLevelProgress(1800, levels);

    expect(result.currentLevel?.level).toBe(4);
    expect(result.nextLevel).toBeNull();
    expect(result.xpIntoCurrentLevel).toBe(300);
    expect(result.xpToNextLevel).toBeNull();
    expect(result.progressPercentage).toBe(100);
  });

  it('treats negative XP as zero', () => {
    const result = projectLevelProgress(-200, levels);

    expect(result.totalXp).toBe(0);
    expect(result.currentLevel?.level).toBe(1);
    expect(result.progressPercentage).toBe(0);
  });

  it('projects toward the first active threshold when no current level exists', () => {
    const delayedLevels: LevelDefinition[] = [
      {
        level: 1,
        name: 'Brote',
        minXp: 100,
        rewardOlives: 5,
        active: true,
      },
    ];

    const result = projectLevelProgress(40, delayedLevels);

    expect(result.currentLevel).toBeNull();
    expect(result.nextLevel?.level).toBe(1);
    expect(result.xpIntoCurrentLevel).toBe(40);
    expect(result.xpToNextLevel).toBe(60);
    expect(result.progressPercentage).toBe(40);
  });
});

describe('levelsCrossed', () => {
  it('returns every newly reached active level once with reward metadata', () => {
    expect(levelsCrossed(100, 1600, levels)).toEqual([
      {
        level: 3,
        name: 'Sierra',
        minXp: 1000,
        rewardOlives: 25,
        active: true,
      },
      {
        level: 4,
        name: 'Cumbre',
        minXp: 1500,
        rewardOlives: 40,
        active: true,
      },
    ]);
  });

  it('returns no crossed levels when XP does not increase', () => {
    expect(levelsCrossed(1000, 900, levels)).toEqual([]);
  });
});
