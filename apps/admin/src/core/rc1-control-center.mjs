/**
 * RC1 Control Center — Admin readiness dashboard.
 *
 * Displays candidate SHA, APK info, staging environment, and gate statuses.
 * Gate states: READY | BLOCKED | MANUAL | NOT_APPLICABLE
 */

/** @typedef {'READY' | 'BLOCKED' | 'MANUAL' | 'NOT_APPLICABLE'} GateState */

/**
 * @typedef {Object} RC1Gate
 * @property {string} id
 * @property {string} label
 * @property {GateState} state
 * @property {string | null} reference
 * @property {string | null} recordedAt
 */

/**
 * @typedef {Object} RC1ControlCenterState
 * @property {string} candidateSha
 * @property {string | null} apkArtifact
 * @property {string | null} apkHash
 * @property {string} environment
 * @property {readonly RC1Gate[]} gates
 */

/** @type {readonly {id: string, label: string, autoKind: 'CI' | 'MANUAL' | null}[]} */
const RC1_GATES = [
  { id: 'canonical-catalog', label: 'Catálogo canónico', autoKind: 'CI' },
  { id: 'cuadros-adventure-ready', label: 'Cuadros ADVENTURE_READY', autoKind: 'MANUAL' },
  { id: 'offline-e2e', label: 'Offline end-to-end', autoKind: 'CI' },
  { id: 'gps-runtime', label: 'GPS runtime', autoKind: 'CI' },
  { id: 'physical-gps-field', label: 'Physical GPS field gate', autoKind: 'MANUAL' },
  { id: 'server-validation', label: 'Server validation', autoKind: 'CI' },
  { id: 'weather', label: 'Weather', autoKind: 'CI' },
  { id: 'safety-emergency', label: 'Safety/Emergency', autoKind: 'CI' },
  { id: 'observability', label: 'Observability', autoKind: 'CI' },
];

/**
 * Builds the Control Center state from raw evidence rows.
 *
 * @param {string} candidateSha
 * @param {{gate_id: string, candidate_sha: string, kind: string, passed: boolean, reference: string | null, recorded_at: string}[]} evidenceRows
 * @param {{apkArtifact?: string | null, apkHash?: string | null, environment?: string}} options
 * @returns {RC1ControlCenterState}
 */
export function buildControlCenterState(candidateSha, evidenceRows, options = {}) {
  const evidenceByGate = new Map();
  for (const row of evidenceRows) {
    if (row.candidate_sha === candidateSha) {
      evidenceByGate.set(row.gate_id, row);
    }
  }

  const gates = RC1_GATES.map((gate) => {
    const evidence = evidenceByGate.get(gate.id);

    if (!evidence) {
      return {
        id: gate.id,
        label: gate.label,
        state: gate.autoKind === 'MANUAL' ? 'MANUAL' : 'BLOCKED',
        reference: null,
        recordedAt: null,
      };
    }

    return {
      id: gate.id,
      label: gate.label,
      state: evidence.passed ? 'READY' : 'BLOCKED',
      reference: evidence.reference ?? null,
      recordedAt: evidence.recorded_at ?? null,
    };
  });

  return {
    candidateSha,
    apkArtifact: options.apkArtifact ?? null,
    apkHash: options.apkHash ?? null,
    environment: options.environment ?? 'dev',
    gates,
  };
}

/**
 * Returns true only if all non-MANUAL gates are READY.
 *
 * @param {RC1ControlCenterState} state
 * @returns {boolean}
 */
export function isRc1ReadyForRelease(state) {
  return state.gates.every(
    (g) => g.state === 'READY' || g.state === 'NOT_APPLICABLE',
  );
}

/**
 * Returns an array of gate IDs that are blocking the release.
 *
 * @param {RC1ControlCenterState} state
 * @returns {string[]}
 */
export function getBlockingGates(state) {
  return state.gates
    .filter((g) => g.state === 'BLOCKED' || g.state === 'MANUAL')
    .map((g) => g.id);
}
