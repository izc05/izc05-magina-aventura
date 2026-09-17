# Plan 06D — Challenges + Seasons Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build deterministic, configurable season resolution and challenge progress for verified Mágina Aventura activities.

**Architecture:** Keep all logic in `@magina-aventura/domain`. Challenge definitions carry their own time windows and metric targets; daily/weekly are scheduled definitions rather than hard-coded calendar logic. Municipal challenges filter verified activities by municipality. Season challenges bind to an active configured season. No Supabase, Admin, reward ledger or UI changes are allowed here.

**Tech Stack:** TypeScript 6, Vitest, pnpm monorepo.

**Spec:** `docs/superpowers/plans/2026-09-15-magina-aventura-roadmap.md` — Plan 06.

## Global Constraints

- Do not modify `main` directly.
- Do not touch `apps/admin`, `apps/mobile`, Supabase migrations, Community, GPS, reward redemption or olive transactions.
- Only verified activities are accepted as inputs.
- Definitions are configuration inputs; production targets are not hard-coded.
- Time windows use ISO timestamps with inclusive start and exclusive end.
- Duplicate activity IDs count once through the existing aggregate contract.
- Completed challenge IDs are never emitted again as reward candidates.

---

### Task 1: Season resolution

**Files:**
- Create: `packages/domain/src/gamification/challenge-progress.test.ts`
- Create: `packages/domain/src/gamification/challenge-progress.ts`

**Interfaces:**
- `SeasonDefinition { id, name, startsAt, endsAt, active }`
- `resolveActiveSeason(at, seasons): SeasonDefinition | null`

- [ ] Write tests for active/inactive seasons, inclusive start, exclusive end and deterministic overlap resolution.
- [ ] Run CI and verify RED because `./challenge-progress` does not exist.
- [ ] Implement minimal season resolution: valid active windows only; choose latest `startsAt`, then lexical `id` on ties.
- [ ] Verify GREEN.

### Task 2: Configurable challenge progress

**Files:**
- Modify: `packages/domain/src/gamification/challenge-progress.test.ts`
- Modify: `packages/domain/src/gamification/challenge-progress.ts`

**Interfaces:**
- `ChallengeScope = 'daily' | 'weekly' | 'municipal' | 'season'`
- `ChallengeMetric` reuses aggregate metrics: completed activities, distance, ascent, discoveries, checkpoints, distinct routes and municipalities.
- `ChallengeDefinition { id, title, description, scope, metric, target, startsAt, endsAt, active, municipalityId, seasonId }`
- `projectActiveChallengeProgress(activities, challenges, seasons, asOf, completedChallengeIds)` returns progress projections.

- [ ] Add tests proving daily/weekly windows, municipal filtering, season binding, deduplication, target clamping, AND-free single-metric progress, completed-id exclusion and deterministic ordering.
- [ ] Verify RED for missing behavior.
- [ ] Implement minimal projection using `aggregateAdventureStats` after filtering by challenge window, `asOf`, municipality and season.
- [ ] Return `current`, `target`, `percentage`, `completed`, and stable `sourceKey = challenge:<id>:completion`.
- [ ] Verify GREEN.

### Task 3: Public package surface and isolation review

**Files:**
- Modify: `packages/domain/src/index.ts`

- [ ] Export the challenge/season API.
- [ ] Run full CI on final HEAD.
- [ ] Confirm changed files are limited to this plan, challenge module/test and domain index.
- [ ] Keep the PR stacked on `feat/06c-badge-eligibility-foundation`; do not merge out of dependency order.

## Self-review

This plan closes Plan 06 challenge categories and seasons at the pure-domain layer. Ranking scoring remains Plan 06E. Persistence/reward transactions remain outside this PR.