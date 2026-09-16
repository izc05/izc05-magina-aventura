# Plan 06A — XP + Levels Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the pure-domain foundation that converts configured Admin level definitions and verified activities into deterministic level progress and XP awards, with duplicate/repeat-route farming protections.

**Architecture:** Keep all progression logic inside `@magina-aventura/domain` with no Supabase, UI, React Native, or Admin runtime dependencies. The Admin schema remains the source of configurable level thresholds (`level`, `name`, `min_xp`, `reward_olives`); the domain model mirrors those concepts in camelCase. XP values are supplied by policy at runtime rather than hard-coded product values. Olive rewards are metadata only in this plan and are not transacted here.

**Tech Stack:** TypeScript 6, Vitest, pnpm monorepo.

**Spec:** `docs/superpowers/plans/2026-09-15-magina-aventura-roadmap.md` — Plan 06. Admin alignment: `supabase/migrations/202609160001_admin_platform.sql` on `feat/admin-v1`.

## Global Constraints

- Do not modify `main` directly.
- Do not touch `apps/admin`, Community Mobile, Supabase migrations, reward redemption, or olive ledger in this plan.
- All XP formula values are configuration inputs; no final product XP numbers are embedded in production code.
- An activity must already be verified before it is accepted by this domain API.
- Duplicate activity IDs never produce XP twice.
- Repeated completions of the same route are limited by a configurable sliding time window.
- Level thresholds come from Admin-style definitions and may contain inactive rows.
- `rewardOlives` is exposed as level metadata only; Plan 07 owns auditable reward transactions.

---

### Task 1: Configured level projection

**Files:**
- Create: `packages/domain/src/gamification/level-progression.test.ts`
- Create: `packages/domain/src/gamification/level-progression.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**
- Consumes: `LevelDefinition[]` with `{ level, name, minXp, rewardOlives, active }` and a non-negative `totalXp`.
- Produces: `projectLevelProgress(totalXp, levels): LevelProgressProjection`.
- Projection includes current level, next active level, XP remaining, percentage within the current level band, and levels newly crossed between two XP totals via `levelsCrossed(previousXp, nextXp, levels)`.

- [ ] **Step 1: Write failing tests**

Cover:
1. active levels are resolved by `minXp`, independent of input order;
2. inactive levels are ignored;
3. progress between thresholds is deterministic and clamped 0..100;
4. top level reports no next level and 100% progress;
5. `levelsCrossed` returns each newly reached level once, including its `rewardOlives` metadata;
6. negative XP is treated as zero.

- [ ] **Step 2: Run the repository CI path and verify RED**

Expected failure: `Cannot find module './level-progression'` or missing exported API, with unrelated tests still type-correct up to that point.

- [ ] **Step 3: Implement the minimum level projection**

Implementation rules:
- filter inactive levels;
- sort by `minXp`, then `level` for deterministic ties;
- never mutate the caller's array;
- derive current level as the highest active definition with `minXp <= totalXp`;
- derive next level as the first higher threshold;
- if no current level exists, project toward the first active level;
- if no next level exists, progress is 100;
- return crossed levels where `previousXp < minXp <= nextXp`.

- [ ] **Step 4: Verify GREEN**

Run full CI. Typecheck, unit tests, Android prebuild, package-boundary checks, and database contract tests must all pass.

---

### Task 2: Verified-activity XP calculation and repeat-route guard

**Files:**
- Create: `packages/domain/src/gamification/activity-xp.test.ts`
- Create: `packages/domain/src/gamification/activity-xp.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**

```ts
export interface VerifiedActivityXpInput {
  activityId: string;
  routeId: string;
  municipalityId: string | null;
  verifiedAt: string;
  distanceMeters: number;
  ascentMeters: number;
  newDiscoveryCount: number;
}

export interface ActivityXpPolicy {
  baseVerifiedXp: number;
  distanceUnitMeters: number;
  xpPerDistanceUnit: number;
  ascentUnitMeters: number;
  xpPerAscentUnit: number;
  xpPerNewDiscovery: number;
  firstRouteBonusXp: number;
  firstMunicipalityBonusXp: number;
  repeatRouteWindowHours: number;
  maxRewardedSameRouteInWindow: number;
}

export interface ActivityXpAwardHistory {
  activityId: string;
  routeId: string;
  municipalityId: string | null;
  verifiedAt: string;
}
```

Produces `calculateVerifiedActivityXp(input, policy, history)` with a stable `sourceKey`, eligibility/rejection reason, component breakdown, and integer `totalXp`.

- [ ] **Step 1: Write failing tests**

Cover:
1. a first verified activity receives base + configured distance/ascent/discovery components;
2. first route and first municipality bonuses apply only when absent from history;
3. the same `activityId` is rejected as `duplicate-activity`;
4. same-route activity is rejected as `repeat-route-limit` after the configured count inside the sliding window;
5. the same route becomes eligible again after the configured window expires;
6. malformed negative metrics cannot create negative or bonus XP;
7. source key is stable for retries of the same verified activity.

- [ ] **Step 2: Run and verify RED**

Expected failure: missing `./activity-xp` implementation or missing API.

- [ ] **Step 3: Implement minimum deterministic calculator**

Rules:
- reject duplicate `activityId` before calculating XP;
- count previous same-route awards whose timestamps fall within `repeatRouteWindowHours` before `verifiedAt`;
- reject when count is already `>= maxRewardedSameRouteInWindow`;
- clamp numeric metrics/counts at zero;
- use complete units only: `floor(distanceMeters / distanceUnitMeters)` and `floor(ascentMeters / ascentUnitMeters)`;
- first-route bonus checks all history, not only the repeat window;
- first-municipality bonus requires non-null municipality and checks all history;
- return `sourceKey = activity:<activityId>:verified-xp`;
- all component XP and total XP are non-negative integers.

- [ ] **Step 4: Verify GREEN**

Run full CI and confirm no regressions.

---

### Task 3: Package surface and branch review

**Files:**
- Modify: `packages/domain/src/index.ts`
- Review only: all PR changed files

**Interfaces:**
- Public package exports both `level-progression` and `activity-xp` APIs.

- [ ] **Step 1: Export the gamification APIs from `@magina-aventura/domain`.**
- [ ] **Step 2: Run full CI on the final HEAD.**
- [ ] **Step 3: Inspect changed filenames and confirm no files under `apps/admin`, `apps/mobile`, `supabase/`, Community modules, or `main` were modified.**
- [ ] **Step 4: Keep the PR stacked on `feat/05b-collections-foundation`; do not merge out of dependency order.**

## Self-review

- Plan 06 coverage included here: configurable XP engine, levels, and a repeat-route farming limit.
- Intentionally deferred: badges/achievements, challenges, seasons, rankings, persistence, olive transactions, and server-side validation. Those are separate independently testable subsystems and should not be hidden inside this foundation PR.
- No placeholder values or final XP economy numbers are embedded.
