import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildControlCenterState,
  isRc1ReadyForRelease,
  getBlockingGates,
} from '../src/core/rc1-control-center.mjs';

describe('RC1 Control Center', () => {
  const SHA = 'abc123def456';

  it('builds state with all gates BLOCKED when no evidence exists', () => {
    const state = buildControlCenterState(SHA, []);

    assert.equal(state.candidateSha, SHA);
    assert.ok(state.gates.length > 0);

    const blockedOrManual = state.gates.filter(
      (g) => g.state === 'BLOCKED' || g.state === 'MANUAL',
    );
    assert.equal(blockedOrManual.length, state.gates.length);
  });

  it('marks gates as READY when matching evidence passes for exact SHA', () => {
    const evidence = [
      { gate_id: 'canonical-catalog', candidate_sha: SHA, kind: 'CI', passed: true, reference: 'run-42', recorded_at: '2026-09-17T12:00:00Z' },
      { gate_id: 'gps-runtime', candidate_sha: SHA, kind: 'CI', passed: true, reference: null, recorded_at: '2026-09-17T12:00:00Z' },
    ];

    const state = buildControlCenterState(SHA, evidence);

    const catalog = state.gates.find((g) => g.id === 'canonical-catalog');
    assert.equal(catalog.state, 'READY');
    assert.equal(catalog.reference, 'run-42');

    const gps = state.gates.find((g) => g.id === 'gps-runtime');
    assert.equal(gps.state, 'READY');
  });

  it('ignores evidence from different candidate SHA', () => {
    const evidence = [
      { gate_id: 'canonical-catalog', candidate_sha: 'wrong-sha', kind: 'CI', passed: true, reference: null, recorded_at: '2026-09-17T12:00:00Z' },
    ];

    const state = buildControlCenterState(SHA, evidence);

    const catalog = state.gates.find((g) => g.id === 'canonical-catalog');
    assert.equal(catalog.state, 'BLOCKED');
  });

  it('keeps manual gates as MANUAL until evidence is provided', () => {
    const state = buildControlCenterState(SHA, []);

    const physicalGps = state.gates.find((g) => g.id === 'physical-gps-field');
    assert.equal(physicalGps.state, 'MANUAL');

    const cuadros = state.gates.find((g) => g.id === 'cuadros-adventure-ready');
    assert.equal(cuadros.state, 'MANUAL');
  });

  it('reports release not ready when gates are blocked', () => {
    const state = buildControlCenterState(SHA, []);

    assert.equal(isRc1ReadyForRelease(state), false);
    assert.ok(getBlockingGates(state).length > 0);
  });

  it('reports release ready when all gates pass', () => {
    const allEvidence = [
      'canonical-catalog', 'cuadros-adventure-ready', 'offline-e2e',
      'gps-runtime', 'physical-gps-field', 'server-validation',
      'weather', 'safety-emergency', 'observability',
    ].map((gateId) => ({
      gate_id: gateId,
      candidate_sha: SHA,
      kind: gateId.includes('physical') || gateId.includes('cuadros') ? 'MANUAL' : 'CI',
      passed: true,
      reference: null,
      recorded_at: '2026-09-17T12:00:00Z',
    }));

    const state = buildControlCenterState(SHA, allEvidence);

    assert.equal(isRc1ReadyForRelease(state), true);
    assert.deepEqual(getBlockingGates(state), []);
  });

  it('includes APK and environment metadata', () => {
    const state = buildControlCenterState(SHA, [], {
      apkArtifact: 'magina-aventura-rc1.apk',
      apkHash: 'sha256:deadbeef',
      environment: 'staging',
    });

    assert.equal(state.apkArtifact, 'magina-aventura-rc1.apk');
    assert.equal(state.apkHash, 'sha256:deadbeef');
    assert.equal(state.environment, 'staging');
  });
});
