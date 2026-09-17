import { describe, expect, it } from 'vitest';
import {
  deriveBetaCandidateState,
  evaluateBetaGate,
  type BetaGateDefinition,
  type BetaGateEvidence,
} from './beta-readiness';

const automaticGate: BetaGateDefinition = {
  id: 'ci-domain',
  area: 'ci',
  mode: 'automatic',
  required: true,
  summary: 'Domain CI is green for the candidate',
};

const manualGate: BetaGateDefinition = {
  id: 'gps-field',
  area: 'gps-field',
  mode: 'manual',
  required: true,
  summary: 'Physical Android GPS field test',
};

const evidence = (
  gateId: string,
  kind: BetaGateEvidence['kind'],
  candidateSha: string,
  passed = true,
): BetaGateEvidence => ({
  gateId,
  kind,
  candidateSha,
  passed,
  reference: `${gateId}:${kind}:${candidateSha}`,
});

describe('evaluateBetaGate', () => {
  it('blocks a required automatic gate when evidence is missing', () => {
    expect(evaluateBetaGate(automaticGate, 'sha-new', [])).toMatchObject({
      status: 'BLOCKED',
      blockers: ['missing-current-evidence'],
    });
  });

  it('keeps a required manual gate manual when evidence is missing', () => {
    expect(evaluateBetaGate(manualGate, 'sha-new', [])).toMatchObject({
      status: 'MANUAL',
      blockers: ['manual-evidence-required'],
    });
  });

  it('does not let CI evidence satisfy a manual gate', () => {
    expect(
      evaluateBetaGate(manualGate, 'sha-new', [
        evidence('gps-field', 'ci', 'sha-new'),
      ]),
    ).toMatchObject({
      status: 'MANUAL',
      blockers: ['manual-evidence-required'],
    });
  });

  it('ignores stale evidence from another candidate SHA', () => {
    const result = evaluateBetaGate(automaticGate, 'sha-new', [
      evidence('ci-domain', 'ci', 'sha-old'),
    ]);

    expect(result.status).toBe('BLOCKED');
    expect(result.evidence).toEqual([]);
  });

  it('ignores evidence that belongs to a different gate', () => {
    const result = evaluateBetaGate(automaticGate, 'sha-new', [
      evidence('android-build', 'ci', 'sha-new'),
    ]);

    expect(result.status).toBe('BLOCKED');
    expect(result.evidence).toEqual([]);
  });

  it('marks an optional gate NOT_APPLICABLE', () => {
    expect(
      evaluateBetaGate({ ...automaticGate, required: false }, 'sha-new', []),
    ).toMatchObject({
      status: 'NOT_APPLICABLE',
      blockers: [],
    });
  });

  it('requires passing current evidence for an automatic gate', () => {
    expect(
      evaluateBetaGate(automaticGate, 'sha-new', [
        evidence('ci-domain', 'ci', 'sha-new', false),
      ]),
    ).toMatchObject({
      status: 'BLOCKED',
      blockers: ['current-evidence-failed'],
    });
  });

  it('marks current passing evidence READY', () => {
    expect(
      evaluateBetaGate(automaticGate, 'sha-new', [
        evidence('ci-domain', 'ci', 'sha-new'),
      ]),
    ).toMatchObject({ status: 'READY', blockers: [] });

    expect(
      evaluateBetaGate(manualGate, 'sha-new', [
        evidence('gps-field', 'manual', 'sha-new'),
      ]),
    ).toMatchObject({ status: 'READY', blockers: [] });
  });
});

describe('deriveBetaCandidateState', () => {
  it('uses BLOCKED over MANUAL over READY for candidate state', () => {
    const ready = evaluateBetaGate(automaticGate, 'sha', [
      evidence('ci-domain', 'ci', 'sha'),
    ]);
    const manual = evaluateBetaGate(manualGate, 'sha', []);
    const blocked = evaluateBetaGate(automaticGate, 'sha', []);

    expect(deriveBetaCandidateState([ready])).toBe('READY');
    expect(deriveBetaCandidateState([ready, manual])).toBe('MANUAL');
    expect(deriveBetaCandidateState([ready, manual, blocked])).toBe('BLOCKED');
  });
});
