import {
  projectLevelProgress,
  type LevelDefinition,
} from '../gamification/level-progression';

export type OliveTreeStageId =
  | 'sprout'
  | 'sapling'
  | 'young'
  | 'developing'
  | 'strong'
  | 'adult'
  | 'mature'
  | 'centenary'
  | 'monumental'
  | 'legend';

export interface OliveTreeStageDefinition {
  id: OliveTreeStageId;
  name: string;
  minLevel: number;
  active: boolean;
}

export interface OliveTreeProjection {
  totalXp: number;
  level: number | null;
  levelName: string | null;
  levelProgressPercentage: number;
  stage: OliveTreeStageDefinition | null;
  nextStage: OliveTreeStageDefinition | null;
  levelsToNextStage: number | null;
}

function activeStages(
  stages: OliveTreeStageDefinition[],
): OliveTreeStageDefinition[] {
  return stages
    .filter((stage) => stage.active && Number.isFinite(stage.minLevel))
    .map((stage) => ({
      ...stage,
      minLevel: Math.max(1, Math.floor(stage.minLevel)),
    }))
    .sort(
      (left, right) =>
        left.minLevel - right.minLevel || left.id.localeCompare(right.id),
    );
}

export function projectOliveTree(
  totalXp: number,
  levels: LevelDefinition[],
  stages: OliveTreeStageDefinition[],
): OliveTreeProjection {
  const levelProgress = projectLevelProgress(totalXp, levels);
  const currentLevel = levelProgress.currentLevel;

  if (currentLevel === null) {
    return {
      totalXp: levelProgress.totalXp,
      level: null,
      levelName: null,
      levelProgressPercentage: levelProgress.progressPercentage,
      stage: null,
      nextStage: null,
      levelsToNextStage: null,
    };
  }

  const configuredStages = activeStages(stages);
  let stage: OliveTreeStageDefinition | null = null;
  let nextStage: OliveTreeStageDefinition | null = null;

  for (const definition of configuredStages) {
    if (definition.minLevel <= currentLevel.level) {
      stage = definition;
      continue;
    }

    nextStage = definition;
    break;
  }

  if (stage === null && configuredStages.length > 0) {
    nextStage = configuredStages[0]!;
  }

  return {
    totalXp: levelProgress.totalXp,
    level: currentLevel.level,
    levelName: currentLevel.name,
    levelProgressPercentage: levelProgress.progressPercentage,
    stage,
    nextStage,
    levelsToNextStage:
      nextStage === null
        ? null
        : Math.max(0, nextStage.minLevel - currentLevel.level),
  };
}
