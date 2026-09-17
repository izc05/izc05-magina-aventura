export interface LevelDefinition {
  level: number;
  name: string;
  minXp: number;
  rewardOlives: number;
  active: boolean;
}

export interface LevelProgressProjection {
  totalXp: number;
  currentLevel: LevelDefinition | null;
  nextLevel: LevelDefinition | null;
  xpIntoCurrentLevel: number;
  xpToNextLevel: number | null;
  progressPercentage: number;
}

function normalizeXp(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function activeLevels(levels: LevelDefinition[]): LevelDefinition[] {
  return levels
    .filter((definition) => definition.active)
    .map((definition) => ({ ...definition }))
    .sort((left, right) => left.minXp - right.minXp || left.level - right.level);
}

function percentage(value: number, range: number): number {
  if (range <= 0) {
    return 100;
  }

  return Math.min(100, Math.max(0, (value / range) * 100));
}

export function projectLevelProgress(
  totalXpInput: number,
  levels: LevelDefinition[],
): LevelProgressProjection {
  const totalXp = normalizeXp(totalXpInput);
  const configuredLevels = activeLevels(levels);

  if (configuredLevels.length === 0) {
    return {
      totalXp,
      currentLevel: null,
      nextLevel: null,
      xpIntoCurrentLevel: totalXp,
      xpToNextLevel: null,
      progressPercentage: 0,
    };
  }

  let currentLevel: LevelDefinition | null = null;
  let nextLevel: LevelDefinition | null = null;

  for (const definition of configuredLevels) {
    if (definition.minXp <= totalXp) {
      currentLevel = definition;
      continue;
    }

    nextLevel = definition;
    break;
  }

  if (currentLevel === null) {
    const firstLevel = configuredLevels[0]!;
    return {
      totalXp,
      currentLevel: null,
      nextLevel: firstLevel,
      xpIntoCurrentLevel: totalXp,
      xpToNextLevel: Math.max(0, firstLevel.minXp - totalXp),
      progressPercentage: percentage(totalXp, firstLevel.minXp),
    };
  }

  const xpIntoCurrentLevel = Math.max(0, totalXp - currentLevel.minXp);

  if (nextLevel === null) {
    return {
      totalXp,
      currentLevel,
      nextLevel: null,
      xpIntoCurrentLevel,
      xpToNextLevel: null,
      progressPercentage: 100,
    };
  }

  const levelBand = nextLevel.minXp - currentLevel.minXp;

  return {
    totalXp,
    currentLevel,
    nextLevel,
    xpIntoCurrentLevel,
    xpToNextLevel: Math.max(0, nextLevel.minXp - totalXp),
    progressPercentage: percentage(xpIntoCurrentLevel, levelBand),
  };
}

export function levelsCrossed(
  previousXpInput: number,
  nextXpInput: number,
  levels: LevelDefinition[],
): LevelDefinition[] {
  const previousXp = normalizeXp(previousXpInput);
  const nextXp = normalizeXp(nextXpInput);

  if (nextXp <= previousXp) {
    return [];
  }

  return activeLevels(levels).filter(
    (definition) =>
      definition.minXp > previousXp && definition.minXp <= nextXp,
  );
}
