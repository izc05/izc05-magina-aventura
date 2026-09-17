export type BetaGateMode = 'automatic' | 'manual';

export type BetaGateStatus =
  | 'READY'
  | 'BLOCKED'
  | 'MANUAL'
  | 'NOT_APPLICABLE';

export type BetaCandidateState = 'READY' | 'BLOCKED' | 'MANUAL';

export type BetaGateArea =
  | 'integration'
  | 'ci'
  | 'android'
  | 'gps-field'
  | 'supabase'
  | 'admin'
  | 'community'
  | 'rewards'
  | 'content';

export type BetaGateEvidenceKind =
  | 'ci'
  | 'manual'
  | 'commit'
  | 'android-build'
  | 'supabase'
  | 'content';

export interface BetaGateEvidence {
  gateId: string;
  kind: BetaGateEvidenceKind;
  candidateSha: string;
  passed: boolean;
  reference: string;
}

export interface BetaGateDefinition {
  id: string;
  area: BetaGateArea;
  mode: BetaGateMode;
  required: boolean;
  summary: string;
}

export interface EvaluatedBetaGate extends BetaGateDefinition {
  status: BetaGateStatus;
  evidence: BetaGateEvidence[];
  blockers: string[];
}

const evaluated = (
  definition: BetaGateDefinition,
  status: BetaGateStatus,
  evidence: BetaGateEvidence[],
  blockers: string[],
): EvaluatedBetaGate => ({
  ...definition,
  status,
  evidence,
  blockers,
});

export function evaluateBetaGate(
  definition: BetaGateDefinition,
  candidateSha: string,
  evidence: BetaGateEvidence[],
): EvaluatedBetaGate {
  const currentEvidence = evidence.filter(
    (item) =>
      item.gateId === definition.id && item.candidateSha === candidateSha,
  );

  if (!definition.required) {
    return evaluated(definition, 'NOT_APPLICABLE', currentEvidence, []);
  }

  if (definition.mode === 'manual') {
    const manualEvidence = currentEvidence.filter(
      (item) => item.kind === 'manual',
    );

    if (manualEvidence.some((item) => item.passed)) {
      return evaluated(definition, 'READY', currentEvidence, []);
    }

    return evaluated(
      definition,
      'MANUAL',
      currentEvidence,
      manualEvidence.length > 0
        ? ['manual-evidence-failed']
        : ['manual-evidence-required'],
    );
  }

  if (currentEvidence.length === 0) {
    return evaluated(definition, 'BLOCKED', [], ['missing-current-evidence']);
  }

  if (currentEvidence.some((item) => item.passed)) {
    return evaluated(definition, 'READY', currentEvidence, []);
  }

  return evaluated(definition, 'BLOCKED', currentEvidence, [
    'current-evidence-failed',
  ]);
}

export function deriveBetaCandidateState(
  gates: EvaluatedBetaGate[],
): BetaCandidateState {
  if (gates.some((gate) => gate.required && gate.status === 'BLOCKED')) {
    return 'BLOCKED';
  }

  if (gates.some((gate) => gate.required && gate.status === 'MANUAL')) {
    return 'MANUAL';
  }

  return 'READY';
}
