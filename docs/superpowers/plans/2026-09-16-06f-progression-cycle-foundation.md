# Plan 06F — Verified Progression Cycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compose the Plan 06 engines so one verified activity deterministically projects XP, level progression, aggregate stats, badge candidates, challenge completion and all configured rankings in one pure-domain cycle.

**Architecture:** Add a thin orchestrator in `@magina-aventura/domain` that delegates to the already-tested XP, level, stats, badge, challenge and ranking modules. It does not persist, transact rewards or duplicate domain rules. The result is a set of deterministic candidates that Plan 07 can later commit server-side exactly once.

**Tech Stack:** TypeScript 6, Vitest, pnpm monorepo.

**Spec:** `docs/superpowers/plans/2026-09-15-magina-aventura-roadmap.md` — Plan 06 completion criterion.

## Global Constraints

- Do not modify `main` directly.
- Do not touch Admin, mobile, Supabase, Community, GPS or reward transactions.
- Reuse existing Plan 06 modules; do not reimplement scoring/progression formulas in the orchestrator.
- Ranking policies and XP policies remain runtime configuration.
- Retry of the same activity must not double XP or aggregate stats.
- `asOf` for challenge/ranking projection is the verified activity timestamp.
- Current user activity replaces any stale current-user entry supplied in ranking participants.

---

### Task 1: End-to-end progression contract

**Files:**
- Create: `packages/domain/src/gamification/progression-cycle.test.ts`
- Create: `packages/domain/src/gamification/progression-cycle.ts`

**Interfaces:**
- `VerifiedProgressionCycleInput` consumes current XP/stat representations, prior verified activities, XP history, total XP, levels, badges, challenges, seasons, ranking participants/policies/scopes and prior badge/challenge completions.
- `projectVerifiedProgressionCycle(input)` returns XP award, previous/next level projection, crossed levels, aggregate stats, new badges, challenge progress/completion candidates and ranking projections.

- [ ] Write a failing test proving one verified activity updates all Plan 06 outputs in the same cycle.
- [ ] Write a failing retry test proving duplicate XP is rejected while stats/rankings remain idempotent and prior badge/challenge completion is not re-emitted.
- [ ] Run CI and verify RED because `./progression-cycle` does not exist.
- [ ] Implement the minimum orchestrator using existing public functions only.
- [ ] Verify GREEN.

### Task 2: Public package surface and Plan 06 completion review

**Files:**
- Modify: `packages/domain/src/index.ts`

- [ ] Export the progression cycle API.
- [ ] Run final full CI.
- [ ] Confirm changed files are limited to this plan, progression module/test and domain index.
- [ ] Keep the PR stacked on `feat/06e-rankings-foundation`.
- [ ] Verify the roadmap criterion: a verified activity deterministically projects XP, badge, challenge and ranking changes.

## Self-review

This is the final pure-domain composition for Plan 06. Persistence, authoritative server validation, olive transactions, outbox and QR reward redemption remain Plan 07 responsibilities rather than being hidden in the gamification engine.