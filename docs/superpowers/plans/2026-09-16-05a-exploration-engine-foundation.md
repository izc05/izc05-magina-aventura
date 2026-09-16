# Exploration Engine Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure, deterministic checkpoints/discoveries engine that can consume filtered GPS samples, reject unreliable proximity evidence, emit idempotent unlock observations, and later plug into mobile/offline/server persistence without coupling to React Native or Supabase.

**Architecture:** Add a new pure workspace package `@magina-aventura/exploration-engine`. The engine receives route targets, a caller-supplied reliability policy, prior target progress, and already-filtered `LocationSample` values from the GPS activity engine. It tracks consecutive valid proximity evidence and emits an observation only when a target first becomes eligible; no UI, network, storage, reward, or server-authority logic lives in this package.

**Tech Stack:** TypeScript 6, Vitest, workspace package contracts, `@magina-aventura/geo`.

**Spec:** `docs/superpowers/specs/2026-09-15-magina-aventura-product-design.md` (sections Discoveries, Checkpoints, Offline behavior) and `docs/superpowers/plans/2026-09-15-magina-aventura-roadmap.md` (Plan 05).

## Global Constraints

- Branch: `feat/05-discoveries-collections-foundation`; base: `feat/gps-activity-v1`.
- Do not touch `main` or `feat/04-community-mobile`.
- Pure package only: no Expo, React Native, Supabase, storage, network or UI imports.
- A single unreliable GPS sample must never unlock a target.
- Trigger radius, maximum acceptable accuracy, required consecutive evidence and maximum evidence gap are caller supplied; the engine does not hard-code product thresholds.
- Unlock output is provisional evidence only; final server confirmation/rewards stay outside this package.
- Reprocessing the same or later samples after a target is unlocked must not emit duplicate observations.

---

### Task 1: RED contract for checkpoint/discovery proximity

**Files:**
- Create: `packages/exploration-engine/package.json`
- Create: `packages/exploration-engine/tsconfig.json`
- Create: `packages/exploration-engine/src/proximity.test.ts`

**Interfaces under test:**
- `ExplorationTarget` with `id`, `kind`, `latitude`, `longitude`, `triggerRadiusMeters`.
- `ExplorationPolicy` with `maxAccuracyMeters`, `requiredConsecutiveSamples`, `maxEvidenceGapSeconds`.
- `evaluateExplorationSample(state, sample, targets, policy)` returns the next state plus newly emitted observations.

- [ ] Add package/test scaffolding only, with tests for outside-radius, poor-accuracy and required consecutive evidence.
- [ ] Push and verify CI RED because production module is missing.

### Task 2: GREEN deterministic proximity engine

**Files:**
- Create: `packages/exploration-engine/src/types.ts`
- Create: `packages/exploration-engine/src/proximity.ts`
- Create: `packages/exploration-engine/src/index.ts`

**Interfaces:**
- `ExplorationState` stores per-target consecutive evidence, last evidence timestamp and unlocked target ids.
- `ExplorationObservation` contains `targetId`, `kind`, `observedAt`, `sampleSequence`, `distanceMeters`, `accuracyMeters`.
- `createExplorationState(unlockedTargetIds?)` initializes deterministic state.

- [ ] Implement only behavior required by Task 1 tests.
- [ ] Verify typecheck/unit tests GREEN.

### Task 3: RED/GREEN anti-duplicate and gap-reset behavior

**Files:**
- Modify: `packages/exploration-engine/src/proximity.test.ts`
- Modify: `packages/exploration-engine/src/proximity.ts`

- [ ] Add failing tests proving an unlocked target never emits twice.
- [ ] Add failing test proving a gap greater than `maxEvidenceGapSeconds` resets the consecutive counter.
- [ ] Add failing test proving `validForMetrics: false` resets evidence and cannot unlock.
- [ ] Implement minimal behavior and verify GREEN.

### Task 4: RED/GREEN multi-target and observation idempotency contract

**Files:**
- Create: `packages/exploration-engine/src/observation.test.ts`
- Create: `packages/exploration-engine/src/observation.ts`
- Modify: `packages/exploration-engine/src/index.ts`

**Interfaces:**
- `explorationObservationKey(activityId, observation)` returns a stable key derived from activity id + target kind + target id.
- Multiple targets can be evaluated from the same sample without cross-contaminating evidence state.

- [ ] Add failing tests for stable key and independent checkpoint/discovery evaluation.
- [ ] Implement minimal behavior and verify GREEN.

### Task 5: Full verification and Draft PR

- [ ] Run/inspect repository `pnpm typecheck` and `pnpm test` through GitHub CI.
- [ ] Confirm pure-package boundary gate stays green.
- [ ] Compare changed files against this plan and keep UI/database/community untouched.
- [ ] Open Draft PR to `feat/gps-activity-v1`.
