export type ExplorationTargetKind = 'checkpoint' | 'discovery';

export function explorationTargetKey(
  kind: ExplorationTargetKind,
  id: string,
): string {
  return `${kind}:${id}`;
}

export interface ExplorationTarget {
  id: string;
  kind: ExplorationTargetKind;
  /** Explicit content order; never inferred from array position or geography. */
  sequence: number;
  /** Whether this target is required by the adventure definition. */
  required: boolean;
  /** Explicit prerequisite target keys, e.g. checkpoint:<uuid>. */
  prerequisiteTargetKeys: string[];
  latitude: number;
  longitude: number;
  triggerRadiusMeters: number;
}

export interface ExplorationPolicy {
  maxAccuracyMeters: number;
  requiredConsecutiveSamples: number;
  maxEvidenceGapSeconds: number;
}

export interface ExplorationTargetProgress {
  consecutiveSamples: number;
  lastEvidenceAt: string | null;
}

export interface ExplorationState {
  progressByTargetKey: Record<string, ExplorationTargetProgress>;
  unlockedTargetKeys: string[];
  lastEvaluatedSequence: number;
}

export interface ExplorationObservation {
  targetId: string;
  targetKey: string;
  kind: ExplorationTargetKind;
  observedAt: string;
  sampleSequence: number;
  distanceMeters: number;
  accuracyMeters: number;
}

export interface ExplorationEvaluation {
  state: ExplorationState;
  observations: ExplorationObservation[];
}
