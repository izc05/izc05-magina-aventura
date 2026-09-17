# Plan 06C — Badge Eligibility Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure-domain engine that evaluates configurable badge criteria against the verified aggregate adventure statistics from Plan 06B and emits only newly earned badge candidates.

**Architecture:** Keep eligibility logic inside `@magina-aventura/domain`. Badge identity aligns with Admin (`slug`, `name`, `description`, `active`), while criteria are supplied at runtime because the current Admin schema does not yet persist criterion definitions. This PR does not alter Admin tables or migrations. All criteria use aggregate statistics and AND semantics so badge behavior is deterministic and testable.

**Tech Stack:** TypeScript 6, Vitest, pnpm monorepo.

**Dependencies:** Plan 06B `aggregateAdventureStats`; current Admin `gamification_badges` identity fields.

## Global Constraints

- Stack on `feat/06b-adventure-stats-foundation` (PR #13).
- Do not touch `main`, `apps/admin`, `apps/mobile`, Supabase, Community, GPS, rewards or olives.
- Do not define product-final badge thresholds in production code.
- Badge criteria are runtime configuration inputs.
- Empty criteria never auto-unlock a badge.
- Inactive badges are ignored.
- Already unlocked slugs are never emitted again.
- Newly eligible badges are returned in deterministic slug order.
- This engine only determines eligibility; persistence and reward transactions are separate concerns.

---

### Task 1: Evaluate configured badge criteria

**Files:**
- Create: `packages/domain/src/gamification/badge-eligibility.test.ts`
- Create: `packages/domain/src/gamification/badge-eligibility.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**

```ts
export type BadgeMetric =
  | 'completedActivities'
  | 'distanceMeters'
  | 'ascentMeters'
  | 'discoveriesUnlocked'
  | 'checkpointsReached'
  | 'distinctRoutes'
  | 'distinctMunicipalities';

export interface BadgeCriterion {
  metric: BadgeMetric;
  minimum: number;
}

export interface BadgeDefinition {
  slug: string;
  name: string;
  description: string;
  active: boolean;
  criteria: BadgeCriterion[];
}

export interface EarnedBadgeCandidate {
  slug: string;
  name: string;
  description: string;
  sourceKey: string;
}

export function evaluateBadgeEligibility(
  stats: AdventureAggregateStats,
  definitions: BadgeDefinition[],
  alreadyUnlockedSlugs?: string[],
): EarnedBadgeCandidate[];
```

- [ ] **Step 1: Write failing tests**

Cover:
1. a single metric threshold unlocks exactly when met;
2. multiple criteria require all conditions (AND);
3. inactive definitions are ignored;
4. empty criteria do not unlock;
5. already unlocked badge slugs are omitted;
6. negative/non-finite minimums are normalized to zero but still require at least one criterion;
7. output is deterministic by badge slug regardless of definition order;
8. returned `sourceKey` is stable as `badge:<slug>:aggregate-stats`.

- [ ] **Step 2: Verify RED in CI**

Expected failure: missing `./badge-eligibility`.

- [ ] **Step 3: Implement minimum evaluator**

Rules:
- map allowed metrics directly to the trusted `AdventureAggregateStats` projection;
- normalize minimum with finite check, clamp to zero and floor;
- all criteria on a badge must pass;
- no criteria means not eligible;
- skip inactive or already-unlocked definitions;
- return lightweight identity + stable source key only;
- sort candidates lexically by slug;
- do not mutate inputs.

- [ ] **Step 4: Verify GREEN with full CI**

Typecheck, unit tests, Android prebuild, package boundaries and database contracts must all pass.

---

### Task 2: Public export and isolation review

- [ ] Export badge eligibility API from `packages/domain/src/index.ts`.
- [ ] Run full CI on final HEAD.
- [ ] Confirm changed files remain limited to this plan, badge engine/tests and domain export.
- [ ] Keep PR stacked on PR #13; no merge out of dependency order.

## Self-review

- This provides the deterministic badge engine required by Plan 06 without owning badge persistence or Admin UX.
- Current Admin badge identity remains compatible.
- Criteria persistence can be added later by the Admin stream without changing this evaluator contract.
- XP/olive rewards are intentionally not emitted here; Plan 07 owns auditable reward ledger behavior.
