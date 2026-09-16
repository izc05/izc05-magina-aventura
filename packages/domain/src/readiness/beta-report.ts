import {
  deriveBetaCandidateState,
  evaluateBetaGate,
  type BetaCandidateState,
  type BetaGateDefinition,
  type BetaGateEvidence,
  type EvaluatedBetaGate,
} from './beta-readiness';
import {
  evaluateIntegrationChain,
  type IntegrationNode,
  type IntegrationReadiness,
} from './dependency-readiness';

export interface BetaCandidateProfile {
  id: 'android-internal-beta' | 'public-beta';
  requiredGateIds: string[];
  deferredGateIds: string[];
}

export interface BetaReadinessInput {
  candidateSha: string;
  profile: BetaCandidateProfile;
  gateDefinitions: BetaGateDefinition[];
  evidence: BetaGateEvidence[];
  integrationNodes: IntegrationNode[];
}

export interface BetaReadinessReport {
  candidate: string;
  profile: BetaCandidateProfile['id'];
  state: BetaCandidateState;
  automatic: { ready: number; blocked: number };
  manual: { ready: number; remaining: number };
  gates: EvaluatedBetaGate[];
  integration: IntegrationReadiness[];
}

export const ANDROID_INTERNAL_BETA_PROFILE: BetaCandidateProfile = {
  id: 'android-internal-beta',
  requiredGateIds: [
    'android-build',
    'android-smoke',
    'backend-auth',
    'exploration',
    'gps-field',
    'gps-runtime',
    'pilot-content',
    'progression',
    'reward-domain',
    'route-core',
    'visual-navigation',
  ],
  deferredGateIds: ['community-write', 'reward-qr-redemption'],
};

const syntheticGate = (
  id: string,
  required: boolean,
): EvaluatedBetaGate => ({
  id,
  area: 'integration',
  mode: 'automatic',
  required,
  summary: required
    ? `Missing gate definition: ${id}`
    : `Deferred gate: ${id}`,
  status: required ? 'BLOCKED' : 'NOT_APPLICABLE',
  evidence: [],
  blockers: required ? ['missing-gate-definition'] : [],
});

export function buildBetaReadinessReport(
  input: BetaReadinessInput,
): BetaReadinessReport {
  const requiredIds = new Set(input.profile.requiredGateIds);
  const deferredIds = new Set(input.profile.deferredGateIds);
  const definitions = new Map(
    input.gateDefinitions.map((definition) => [definition.id, definition]),
  );
  const selectedIds = [...new Set([...requiredIds, ...deferredIds])].sort(
    (a, b) => a.localeCompare(b),
  );

  const gates = selectedIds.map((id): EvaluatedBetaGate => {
    const definition = definitions.get(id);
    const required = requiredIds.has(id);

    if (!definition) {
      return syntheticGate(id, required);
    }

    return evaluateBetaGate(
      {
        ...definition,
        required: required || !deferredIds.has(id),
      },
      input.candidateSha,
      input.evidence,
    );
  });

  const integration = evaluateIntegrationChain(input.integrationNodes);
  const integrationBlocked = integration.some(
    (item) => item.status === 'BLOCKED',
  );
  const gateState = deriveBetaCandidateState(gates);
  const state: BetaCandidateState = integrationBlocked ? 'BLOCKED' : gateState;

  const requiredAutomatic = gates.filter(
    (gate) => gate.required && gate.mode === 'automatic',
  );
  const requiredManual = gates.filter(
    (gate) => gate.required && gate.mode === 'manual',
  );

  return {
    candidate: input.candidateSha,
    profile: input.profile.id,
    state,
    automatic: {
      ready: requiredAutomatic.filter((gate) => gate.status === 'READY').length,
      blocked: requiredAutomatic.filter((gate) => gate.status === 'BLOCKED')
        .length,
    },
    manual: {
      ready: requiredManual.filter((gate) => gate.status === 'READY').length,
      remaining: requiredManual.filter((gate) => gate.status !== 'READY').length,
    },
    gates,
    integration,
  };
}
