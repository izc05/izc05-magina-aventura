import { describe, expect, it } from 'vitest';
import {
  ANDROID_INTERNAL_BETA_PROFILE,
  buildBetaReadinessReport,
  type BetaCandidateProfile,
} from './beta-report';
import type {
  BetaGateDefinition,
  BetaGateEvidence,
} from './beta-readiness';

const automaticGate: BetaGateDefinition = {
  id: 'ci-domain',
  area: 'ci',
  mode: 'automatic',
  required: true,
  summary: 'Domain CI',
};

const manualGate: BetaGateDefinition = {
  id: 'gps-field',
  area: 'gps-field',
  mode: 'manual',
  required: true,
  summary: 'Physical GPS field test',
};

const profile = (
  requiredGateIds: string[],
  deferredGateIds: string[] = [],
): BetaCandidateProfile => ({
  id: 'android-internal-beta',
  requiredGateIds,
  deferredGateIds,
});

const evidence = (
  gateId: string,
  kind: BetaGateEvidence['kind'],
  candidateSha = 'candidate-sha',
  passed = true,
): BetaGateEvidence => ({
  gateId,
  kind,
  candidateSha,
  passed,
  reference: `${gateId}:${kind}:${candidateSha}`,
});

describe('ANDROID_INTERNAL_BETA_PROFILE', () => {
  it('defers community write and reward QR redemption', () => {
    expect(ANDROID_INTERNAL_BETA_PROFILE.deferredGateIds).toContain(
      'community-write',
    );
    expect(ANDROID_INTERNAL_BETA_PROFILE.deferredGateIds).toContain(
      'reward-qr-redemption',
    );
  });

  it('keeps the physical GPS field test required', () => {
    expect(ANDROID_INTERNAL_BETA_PROFILE.requiredGateIds).toContain(
      'gps-field',
    );
  });
});

describe('buildBetaReadinessReport', () => {
  it('returns BLOCKED when a required automatic gate lacks current evidence', () => {
    const report = buildBetaReadinessReport({
      candidateSha: 'candidate-sha',
      profile: profile(['ci-domain']),
      gateDefinitions: [automaticGate],
      evidence: [],
      integrationNodes: [],
    });

    expect(report.state).toBe('BLOCKED');
    expect(report.automatic).toEqual({ ready: 0, blocked: 1 });
  });

  it('returns MANUAL when automatic gates pass but a physical gate remains', () => {
    const report = buildBetaReadinessReport({
      candidateSha: 'candidate-sha',
      profile: profile(['ci-domain', 'gps-field']),
      gateDefinitions: [automaticGate, manualGate],
      evidence: [evidence('ci-domain', 'ci')],
      integrationNodes: [],
    });

    expect(report.state).toBe('MANUAL');
    expect(report.automatic).toEqual({ ready: 1, blocked: 0 });
    expect(report.manual).toEqual({ ready: 0, remaining: 1 });
  });

  it('returns READY only when all required gates have current valid evidence', () => {
    const report = buildBetaReadinessReport({
      candidateSha: 'candidate-sha',
      profile: profile(['ci-domain', 'gps-field']),
      gateDefinitions: [automaticGate, manualGate],
      evidence: [
        evidence('ci-domain', 'ci'),
        evidence('gps-field', 'manual'),
      ],
      integrationNodes: [],
    });

    expect(report.state).toBe('READY');
    expect(report.manual).toEqual({ ready: 1, remaining: 0 });
  });

  it('does not let evidence for one gate satisfy another gate', () => {
    const report = buildBetaReadinessReport({
      candidateSha: 'candidate-sha',
      profile: profile(['ci-domain', 'android-build']),
      gateDefinitions: [
        automaticGate,
        {
          id: 'android-build',
          area: 'android',
          mode: 'automatic',
          required: true,
          summary: 'Android build',
        },
      ],
      evidence: [evidence('ci-domain', 'ci')],
      integrationNodes: [],
    });

    expect(report.gates.find((gate) => gate.id === 'android-build')?.status).toBe(
      'BLOCKED',
    );
  });

  it('marks deferred gates NOT_APPLICABLE', () => {
    const report = buildBetaReadinessReport({
      candidateSha: 'candidate-sha',
      profile: profile([], ['community-write']),
      gateDefinitions: [
        {
          id: 'community-write',
          area: 'community',
          mode: 'automatic',
          required: true,
          summary: 'Community authenticated writes',
        },
      ],
      evidence: [],
      integrationNodes: [],
    });

    expect(report.gates).toEqual([
      expect.objectContaining({
        id: 'community-write',
        required: false,
        status: 'NOT_APPLICABLE',
      }),
    ]);
    expect(report.state).toBe('READY');
  });

  it('synthesizes a blocker for a required gate with no definition', () => {
    const report = buildBetaReadinessReport({
      candidateSha: 'candidate-sha',
      profile: profile(['missing-gate']),
      gateDefinitions: [],
      evidence: [],
      integrationNodes: [],
    });

    expect(report.gates).toEqual([
      expect.objectContaining({
        id: 'missing-gate',
        status: 'BLOCKED',
        blockers: ['missing-gate-definition'],
      }),
    ]);
    expect(report.state).toBe('BLOCKED');
  });

  it('includes integration blockers in the overall state', () => {
    const report = buildBetaReadinessReport({
      candidateSha: 'candidate-sha',
      profile: profile(['ci-domain']),
      gateDefinitions: [automaticGate],
      evidence: [evidence('ci-domain', 'ci')],
      integrationNodes: [
        {
          id: 'parent',
          headSha: 'parent-sha',
          integrated: false,
          retargetedToIntegratedParent: false,
        },
        {
          id: 'child',
          parentId: 'parent',
          headSha: 'child-sha',
          integrated: false,
          retargetedToIntegratedParent: false,
        },
      ],
    });

    expect(report.state).toBe('BLOCKED');
    expect(report.integration[0]).toEqual({
      id: 'child',
      status: 'BLOCKED',
      blockers: ['parent-not-integrated:parent'],
    });
  });

  it('sorts gates and integration entries deterministically', () => {
    const report = buildBetaReadinessReport({
      candidateSha: 'candidate-sha',
      profile: profile(['zeta', 'alpha']),
      gateDefinitions: [
        { ...automaticGate, id: 'zeta' },
        { ...automaticGate, id: 'alpha' },
      ],
      evidence: [evidence('zeta', 'ci'), evidence('alpha', 'ci')],
      integrationNodes: [
        {
          id: 'zeta-node',
          headSha: 'z',
          integrated: false,
          retargetedToIntegratedParent: false,
        },
        {
          id: 'alpha-node',
          headSha: 'a',
          integrated: false,
          retargetedToIntegratedParent: false,
        },
      ],
    });

    expect(report.gates.map((gate) => gate.id)).toEqual(['alpha', 'zeta']);
    expect(report.integration.map((item) => item.id)).toEqual([
      'alpha-node',
      'zeta-node',
    ]);
  });
});
