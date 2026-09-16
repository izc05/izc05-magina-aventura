# Plan 06B — Adventure Stats Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic pure-domain projection of a user's verified adventure history so badges, challenges and rankings can later consume trusted aggregate statistics without reimplementing counting rules.

**Architecture:** Add one focused module to `@magina-aventura/domain`. It accepts already-verified activity records, deduplicates replays by `activityId`, clamps malformed negative metrics, sums physical/exploration totals, and derives deterministic unique route and municipality sets. It does not assign rank scores, badge criteria, XP or olives.

**Tech Stack:** TypeScript 6, Vitest, pnpm monorepo.

**Spec:** `docs/superpowers/plans/2026-09-15-magina-aventura-roadmap.md` — Plan 06.

## Global Constraints

- Do not modify `main` directly.
- Stack this work on `feat/06a-xp-levels-foundation` (PR #11).
- Do not touch `apps/admin`, `apps/mobile`, Supabase migrations, Community, GPS runtime, rewards or olive ledger.
- Inputs represent activities that have already passed verification; this module does not decide whether an activity is valid.
- Duplicate `activityId` records count exactly once to make replays/idempotent synchronization safe.
- Negative or non-finite metrics contribute zero.
- Null municipality IDs are ignored in municipality uniqueness.
- Unique route and municipality IDs are returned in deterministic lexical order so output does not depend on input ordering.

---

### Task 1: Aggregate verified adventure statistics

**Files:**
- Create: `packages/domain/src/gamification/adventure-stats.test.ts`
- Create: `packages/domain/src/gamification/adventure-stats.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**

```ts
export interface VerifiedAdventureStatInput {
  activityId: string;
  routeId: string;
  municipalityId: string | null;
  verifiedAt: string;
  distanceMeters: number;
  ascentMeters: number;
  discoveriesUnlocked: number;
  checkpointsReached: number;
}

export interface AdventureAggregateStats {
  completedActivities: number;
  distanceMeters: number;
  ascentMeters: number;
  discoveriesUnlocked: number;
  checkpointsReached: number;
  distinctRoutes: number;
  distinctMunicipalities: number;
  routeIds: string[];
  municipalityIds: string[];
}

export function aggregateAdventureStats(
  activities: VerifiedAdventureStatInput[],
): AdventureAggregateStats;
```

- [ ] **Step 1: Write failing tests**

Cover:
1. sums physical and exploration metrics across verified activities;
2. duplicate `activityId` records count only the first occurrence;
3. negative/non-finite numeric metrics contribute zero;
4. unique route IDs are deduplicated and sorted deterministically;
5. unique municipality IDs ignore nulls, deduplicate and sort deterministically;
6. empty input returns an all-zero projection and empty ID arrays;
7. caller input objects/array are not mutated.

- [ ] **Step 2: Verify RED in CI**

Expected failure: missing `./adventure-stats` module or missing API.

- [ ] **Step 3: Implement the minimum aggregator**

Rules:
- maintain a `Set` of seen activity IDs and skip later duplicates entirely;
- use only the first occurrence of each activity ID;
- normalize each numeric metric with finite check, clamp at zero and floor to an integer;
- increment `completedActivities` only for unique activity IDs;
- derive route and municipality uniqueness from unique activities only;
- sort returned route/municipality IDs lexically without mutating caller data;
- derive distinct counts from resulting arrays.

- [ ] **Step 4: Verify GREEN with full CI**

Typecheck, unit tests, Android prebuild, pure-package gate and Supabase contract tests must all pass.

---

### Task 2: Public package surface and isolation review

**Files:**
- Modify: `packages/domain/src/index.ts`
- Review: PR changed filenames

- [ ] **Step 1: Export `adventure-stats` from `@magina-aventura/domain`.**
- [ ] **Step 2: Run full CI on final HEAD.**
- [ ] **Step 3: Confirm the PR changes only this plan, the new module/tests and the domain export.**
- [ ] **Step 4: Keep the PR stacked on PR #11 and do not merge out of dependency order.**

## Self-review

- This plan covers the Plan 06 statistics prerequisites: accumulated distance, ascent, distinct routes/municipalities, plus discovery/checkpoint totals.
- Badge criteria, challenges, seasons and ranking formulas are intentionally deferred to separate plans so they can consume this stable projection.
- No product economy values, ranking weights or reward rules are introduced here.
