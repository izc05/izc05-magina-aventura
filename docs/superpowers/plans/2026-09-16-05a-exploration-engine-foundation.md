# Exploration Engine Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure, deterministic checkpoints/discoveries engine that consumes filtered GPS samples, rejects unreliable proximity evidence, and emits idempotent provisional unlock observations.

**Architecture:** Extend the existing pure `@magina-aventura/activity-engine` with an isolated `src/exploration/` module. The module receives route targets, caller-supplied reliability policy, prior exploration state, and filtered `LocationSample` values. It has no UI, network, storage, Supabase or reward-authority responsibilities, so it can later be reused by mobile offline tracking and server validation.

**Tech Stack:** TypeScript 6, Vitest, `@magina-aventura/contracts`, `@magina-aventura/geo`.

**Spec:** `docs/superpowers/specs/2026-09-15-magina-aventura-product-design.md` and Plan 05 in `docs/superpowers/plans/2026-09-15-magina-aventura-roadmap.md`.

## Global Constraints

- Branch: `feat/05-discoveries-collections-foundation`; base: `feat/gps-activity-v1`.
- Do not touch `main` or `feat/04-community-mobile`.
- Pure code only: no Expo, React Native, Supabase, storage, network or UI imports.
- A single unreliable GPS sample must never unlock a target.
- Trigger radius, maximum acceptable accuracy, required consecutive evidence and maximum evidence gap are caller supplied; no product thresholds are hard-coded.
- Output is provisional evidence only; final server confirmation and rewards stay outside this module.
- Reprocessing after unlock must not emit duplicate observations.

---

### Task 1: RED proximity contract

**Files:**
- Create: `packages/activity-engine/src/exploration/proximity.test.ts`

**Interfaces under test:**
- `ExplorationTarget`: `id`, `kind`, `latitude`, `longitude`, `triggerRadiusMeters`.
- `ExplorationPolicy`: `maxAccuracyMeters`, `requiredConsecutiveSamples`, `maxEvidenceGapSeconds`.
- `createExplorationState(unlockedTargetIds?)`.
- `evaluateExplorationSample(state, sample, targets, policy)` returning `{ state, observations }`.

- [ ] Add tests for outside-radius, poor-accuracy and required consecutive evidence.
- [ ] Push and verify CI RED because `./proximity` does not exist.

### Task 2: GREEN deterministic proximity engine

**Files:**
- Create: `packages/activity-engine/src/exploration/types.ts`
- Create: `packages/activity-engine/src/exploration/proximity.ts`
- Create: `packages/activity-engine/src/exploration/index.ts`

**Interfaces:**
- `ExplorationState` stores per-target consecutive evidence, last evidence timestamp and unlocked target ids.
- `ExplorationObservation`: `targetId`, `kind`, `observedAt`, `sampleSequence`, `distanceMeters`, `accuracyMeters`.

- [ ] Implement only behavior required by Task 1.
- [ ] Verify typecheck/unit tests GREEN in CI.

### Task 3: RED/GREEN anti-duplicate and gap reset

**Files:**
- Modify: `packages/activity-engine/src/exploration/proximity.test.ts`
- Modify: `packages/activity-engine/src/exploration/proximity.ts`

- [ ] Add failing test: unlocked target never emits twice.
- [ ] Add failing test: gap above `maxEvidenceGapSeconds` restarts consecutive evidence.
- [ ] Add failing test: `validForMetrics: false` clears evidence and cannot unlock.
- [ ] Implement minimal behavior and verify GREEN.

### Task 4: RED/GREEN observation idempotency + multi-target isolation

**Files:**
- Create: `packages/activity-engine/src/exploration/observation.test.ts`
- Create: `packages/activity-engine/src/exploration/observation.ts`
- Modify: `packages/activity-engine/src/exploration/index.ts`

**Interfaces:**
- `explorationObservationKey(activityId, observation)` returns a stable activity + kind + target id key.
- Checkpoint and discovery evidence counters remain independent when evaluated from the same sample.

- [ ] Add failing tests for stable idempotency key and independent target progress.
- [ ] Implement minimal behavior and verify GREEN.

### Task 5: Export + full verification + Draft PR

**Files:**
- Modify: `packages/activity-engine/src/index.ts`

- [ ] Export the exploration module.
- [ ] Inspect repository CI: `pnpm typecheck`, `pnpm test`, Android prebuild, pure-package boundary, Supabase tests.
- [ ] Confirm changed files stay inside plan/docs and the activity-engine exploration module.
- [ ] Open Draft PR to `feat/gps-activity-v1`.
