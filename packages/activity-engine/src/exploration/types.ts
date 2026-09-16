export type ExplorationTargetKind = 'checkpoint' | 'discovery';

export interface ExplorationTarget {
  id: string;
  kind: ExplorationTargetKind;
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
  progressByTarget: Record<string, ExplorationTargetProgress>;
  unlockedTargetIds: string[];
}

export interface ExplorationObservation {
  targetId: string;
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
