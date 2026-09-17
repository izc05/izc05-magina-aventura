# Plan 08A Beta Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure, deterministic beta-readiness domain that projects automatic/manual evidence and dependency state into an auditable `BLOCKED | MANUAL | READY` report for the Android internal beta.

**Architecture:** Keep Plan 08A isolated inside `@magina-aventura/domain`. The domain accepts already-fetched CI/PR/manual evidence as plain data, evaluates freshness/dependencies/profile requirements without network or GitHub/Supabase I/O, and emits a deterministic report. Adapters that fetch GitHub/Supabase evidence remain outside this slice so no product lane or secrets are touched.

**Tech Stack:** TypeScript 6, Vitest 3, pnpm 10, existing `@magina-aventura/domain` package.

**Spec:** `docs/superpowers/specs/2026-09-16-08a-beta-readiness-design.md`

## Global Constraints

- Do not touch GPS algorithms, mobile visuals, Supabase schemas, Admin, reward QR, or Community behavior.
- Do not add automatic merge behavior.
- Manual gates can become `READY` only from manual evidence.
- Evidence tied to a stale head/candidate SHA does not satisfy the gate.
- Overall precedence is `BLOCKED` > `MANUAL` > `READY`.
- Missing required automatic evidence is `BLOCKED`; missing required manual evidence is `MANUAL`.
- `NOT_APPLICABLE` is valid only when the selected candidate profile marks the gate optional/deferred.
- Output ordering must be deterministic.
- Keep `main` untouched until explicit integration authorization.

---

## File Structure

- Create `packages/domain/src/readiness/beta-readiness.ts` — types and gate evaluation.
- Create `packages/domain/src/readiness/beta-readiness.test.ts` — core RED/GREEN tests.
- Create `packages/domain/src/readiness/dependency-readiness.ts` — dependency/parent-chain evaluation.
- Create `packages/domain/src/readiness/dependency-readiness.test.ts` — dependency tests.
- Create `packages/domain/src/readiness/beta-report.ts` — profile projection and deterministic report.
- Create `packages/domain/src/readiness/beta-report.test.ts` — report/profile tests.
- Modify `packages/domain/src/index.ts` — public exports only after tests prove the APIs.

---

### Task 1: Core gate model and precedence

**Files:**
- Create: `packages/domain/src/readiness/beta-readiness.test.ts`
- Create: `packages/domain/src/readiness/beta-readiness.ts`

**Interfaces:**
- Produces:
```ts
export type BetaGateMode = 'automatic' | 'manual';
export type BetaGateStatus = 'READY' | 'BLOCKED' | 'MANUAL' | 'NOT_APPLICABLE';
export type BetaCandidateState = 'READY' | 'BLOCKED' | 'MANUAL';

export interface BetaGateEvidence {
  kind: 'ci' | 'manual' | 'commit' | 'android-build' | 'supabase' | 'content';
  candidateSha: string;
  passed: boolean;
  reference: string;
}

export interface BetaGateDefinition {
  id: string;
  area: 'integration' | 'ci' | 'android' | 'gps-field' | 'supabase' | 'admin' | 'community' | 'rewards' | 'content';
  mode: BetaGateMode;
  required: boolean;
  summary: string;
}

export interface EvaluatedBetaGate extends BetaGateDefinition {
  status: BetaGateStatus;
  evidence: BetaGateEvidence[];
  blockers: string[];
}

export function evaluateBetaGate(
  definition: BetaGateDefinition,
  candidateSha: string,
  evidence: BetaGateEvidence[],
): EvaluatedBetaGate;

export function deriveBetaCandidateState(gates: EvaluatedBetaGate[]): BetaCandidateState;
```

- [ ] **Step 1: Write failing tests**

Add tests proving:
```ts
it('blocks a required automatic gate when evidence is missing');
it('keeps a required manual gate manual when evidence is missing');
it('does not let CI evidence satisfy a manual gate');
it('ignores stale evidence from another candidate SHA');
it('marks an optional gate NOT_APPLICABLE');
it('uses BLOCKED over MANUAL over READY for candidate state');
```

Representative assertion:
```ts
expect(evaluateBetaGate(autoGate, 'sha-new', [])).toMatchObject({
  status: 'BLOCKED',
  blockers: ['missing-current-evidence'],
});
```

- [ ] **Step 2: Run RED**

Run:
```bash
pnpm --filter @magina-aventura/domain test -- beta-readiness.test.ts
```
Expected: FAIL because `./beta-readiness` does not exist.

- [ ] **Step 3: Implement minimal core logic**

Required behavior:
```ts
const current = evidence.filter((item) => item.candidateSha === candidateSha);
if (!definition.required) return { ...definition, status: 'NOT_APPLICABLE', evidence: current, blockers: [] };
if (definition.mode === 'manual') {
  const passingManual = current.some((item) => item.kind === 'manual' && item.passed);
  return passingManual
    ? { ...definition, status: 'READY', evidence: current, blockers: [] }
    : { ...definition, status: 'MANUAL', evidence: current, blockers: ['manual-evidence-required'] };
}
const passing = current.some((item) => item.passed);
return passing
  ? { ...definition, status: 'READY', evidence: current, blockers: [] }
  : { ...definition, status: 'BLOCKED', evidence: current, blockers: ['missing-current-evidence'] };
```

`deriveBetaCandidateState` returns `BLOCKED` if any required gate is blocked, otherwise `MANUAL` if any gate is manual, otherwise `READY`.

- [ ] **Step 4: Run GREEN**

Run the focused test command, then:
```bash
pnpm --filter @magina-aventura/domain test
pnpm --filter @magina-aventura/domain typecheck
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/readiness/beta-readiness.ts packages/domain/src/readiness/beta-readiness.test.ts
git commit -m "feat: add beta readiness gate model"
```

---

### Task 2: Dependency-aware integration gates

**Files:**
- Create: `packages/domain/src/readiness/dependency-readiness.test.ts`
- Create: `packages/domain/src/readiness/dependency-readiness.ts`

**Interfaces:**
- Consumes: `BetaGateStatus`.
- Produces:
```ts
export interface IntegrationNode {
  id: string;
  parentId?: string;
  headSha: string;
  integrated: boolean;
  retargetedToIntegratedParent: boolean;
}

export interface IntegrationReadiness {
  id: string;
  status: 'READY' | 'BLOCKED';
  blockers: string[];
}

export function evaluateIntegrationChain(nodes: IntegrationNode[]): IntegrationReadiness[];
```

- [ ] **Step 1: Write failing tests**

Add tests proving:
```ts
it('blocks a child while its required parent is neither integrated nor retargeted');
it('allows a child when the parent is integrated');
it('allows a child explicitly retargeted onto an integrated parent state');
it('returns deterministic ordering by node id');
it('blocks duplicate ids and missing parent references deterministically');
```

- [ ] **Step 2: Run RED**

```bash
pnpm --filter @magina-aventura/domain test -- dependency-readiness.test.ts
```
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement minimal dependency evaluator**

Rules:
- Sort by `id` before returning results.
- Duplicate IDs produce `BLOCKED` with `duplicate-node-id`.
- Missing parent ID produces `BLOCKED` with `missing-parent:<id>`.
- A root is `READY` when `integrated === true` or when it is the currently evaluated head with no parent dependency.
- A child is `READY` only when its parent is integrated, or `retargetedToIntegratedParent === true`.
- No mutation, network access, merges, or PR writes.

- [ ] **Step 4: Run GREEN**

Run focused test, then package test/typecheck.

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/readiness/dependency-readiness.ts packages/domain/src/readiness/dependency-readiness.test.ts
git commit -m "feat: add dependency readiness evaluation"
```

---

### Task 3: Candidate profiles and deterministic readiness report

**Files:**
- Create: `packages/domain/src/readiness/beta-report.test.ts`
- Create: `packages/domain/src/readiness/beta-report.ts`

**Interfaces:**
- Consumes: `evaluateBetaGate`, `deriveBetaCandidateState`, `evaluateIntegrationChain`.
- Produces:
```ts
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

export function buildBetaReadinessReport(input: BetaReadinessInput): BetaReadinessReport;

export const ANDROID_INTERNAL_BETA_PROFILE: BetaCandidateProfile;
```

- [ ] **Step 1: Write failing tests**

Prove:
```ts
it('defers community-write and reward-qr gates for android internal beta');
it('keeps gps field evidence required for android internal beta');
it('returns BLOCKED when an automatic required gate lacks current evidence');
it('returns MANUAL when automatic gates pass but a physical gate remains');
it('returns READY only when all required gates have current valid evidence');
it('sorts gates and integration entries deterministically');
```

`ANDROID_INTERNAL_BETA_PROFILE` must require IDs for core route/navigation, Android build/smoke, GPS runtime/field, exploration/progression and required backend/auth; it must defer `community-write` and `reward-qr-redemption`.

- [ ] **Step 2: Run RED**

```bash
pnpm --filter @magina-aventura/domain test -- beta-report.test.ts
```
Expected: FAIL because `./beta-report` does not exist.

- [ ] **Step 3: Implement the report builder**

Requirements:
- Map profile required/deferred IDs over gate definitions.
- Unknown required IDs create a synthetic required automatic `BLOCKED` gate with blocker `missing-gate-definition`.
- Deferred IDs evaluate as `NOT_APPLICABLE`.
- Include dependency blockers in overall `BLOCKED` state.
- Count automatic/manual summaries from evaluated required gates only.
- Sort gates by `id`, integration results by `id`.
- Produce plain serializable data only.

- [ ] **Step 4: Run GREEN**

Run focused test, then package test/typecheck.

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/readiness/beta-report.ts packages/domain/src/readiness/beta-report.test.ts
git commit -m "feat: add beta readiness report projection"
```

---

### Task 4: Public exports and full repository verification

**Files:**
- Modify: `packages/domain/src/index.ts`

**Interfaces:**
- Export all Plan 08A public types/functions from `@magina-aventura/domain`.

- [ ] **Step 1: Add an export-facing failing assertion**

Extend one readiness test to import public APIs from `../index` rather than direct implementation paths for at least:
```ts
buildBetaReadinessReport
ANDROID_INTERNAL_BETA_PROFILE
```
This must fail until index exports are added.

- [ ] **Step 2: Run RED**

```bash
pnpm --filter @magina-aventura/domain test -- beta-report.test.ts
```
Expected: FAIL due missing exports.

- [ ] **Step 3: Add index exports**

Append:
```ts
export * from './readiness/beta-readiness';
export * from './readiness/dependency-readiness';
export * from './readiness/beta-report';
```

- [ ] **Step 4: Run GREEN and repository verification**

Run:
```bash
pnpm --filter @magina-aventura/domain test
pnpm --filter @magina-aventura/domain typecheck
pnpm test
pnpm typecheck
```
Then rely on repository CI for Android Expo prebuild, package-boundary verification and Supabase contract suite.

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/index.ts packages/domain/src/readiness/beta-report.test.ts
git commit -m "feat: export beta readiness domain"
```

- [ ] **Step 6: Open/refresh PR and verify CI**

PR must remain isolated from product lanes and target the approved Plan 08A base. Do not merge automatically. Mark Ready for Review only after the latest head has fully green CI.

---

## Self-review

- Spec coverage: gate statuses, precedence, stale evidence, manual-vs-CI separation, profile deferrals, dependency train, deterministic report and no-auto-merge constraints are covered.
- Deliberately excluded from this slice: GitHub/Supabase network adapters and physical/manual evidence collection UI; the spec allows evidence adapters/reporting to follow the pure domain, and this first Plan 08A implementation remains useful/testable without touching parallel lanes.
- Placeholder scan: no implementation step depends on TBD/TODO values.
- Type consistency: report interfaces consume the exact types produced by Tasks 1 and 2.
