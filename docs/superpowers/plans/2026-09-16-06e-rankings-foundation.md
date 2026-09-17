# Plan 06E — Rankings Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build deterministic Senderista, Explorador and Mágina rankings with weekly, monthly, season and all-time scopes over verified activities.

**Architecture:** Ranking calculation stays in `@magina-aventura/domain`. Scoring weights and repeat-route limits are runtime configuration, never product constants. Scope windows are resolved in UTC; season scope consumes the season definitions from Plan 06D. Entries derive from the canonical verified adventure aggregator and do not persist anything.

**Tech Stack:** TypeScript 6, Vitest, pnpm monorepo.

**Spec:** `docs/superpowers/plans/2026-09-15-magina-aventura-roadmap.md` — Plan 06.

## Global Constraints

- Do not modify `main` directly.
- Do not touch Admin, mobile, Supabase, Community, GPS or reward transactions.
- Only verified activity inputs are ranked.
- All scoring weights and repeat-route caps are configuration.
- Weekly scope starts Monday 00:00 UTC; monthly scope starts day 1 00:00 UTC.
- Season scope requires an active configured season.
- Future activities relative to `asOf` never count.
- Duplicate activity IDs count once.
- Equal scores share rank; lexical user ID is only a stable display-order tie breaker.

---

### Task 1: Ranking scope windows

**Files:**
- Create: `packages/domain/src/gamification/ranking.test.ts`
- Create: `packages/domain/src/gamification/ranking.ts`

**Interfaces:**
- `RankingScope = 'weekly' | 'monthly' | 'season' | 'all-time'`
- `resolveRankingWindow(scope, asOf, seasons)` returns an explicit UTC window or `null` for invalid season/time.

- [ ] Write failing tests for ISO-week, month, season and all-time windows.
- [ ] Verify RED because `./ranking` is missing.
- [ ] Implement minimal scope resolution.
- [ ] Verify GREEN.

### Task 2: Configurable three-family ranking engine

**Files:**
- Modify: `packages/domain/src/gamification/ranking.test.ts`
- Modify: `packages/domain/src/gamification/ranking.ts`

**Interfaces:**
- `RankingKind = 'senderista' | 'explorador' | 'magina'`
- `RankingMetric` reuses aggregate verified metrics.
- `RankingScorePolicy { kind, weights, maxCountedSameRoute }`
- `RankingParticipantInput { userId, activities }`
- `buildRanking(participants, kind, scope, policy, asOf, seasons)` returns ranked entries with score and aggregate stats.

- [ ] Test independent policies for Senderista/Explorador/Mágina.
- [ ] Test weekly/monthly/season/all-time filtering and future exclusion.
- [ ] Test duplicate activity protection and configurable same-route cap.
- [ ] Test inactive users omitted, negative/invalid weights clamped, deterministic ordering and shared rank on equal score.
- [ ] Implement the minimal engine using `aggregateAdventureStats`.
- [ ] Verify full CI GREEN.

### Task 3: Public package surface and isolation

**Files:**
- Modify: `packages/domain/src/index.ts`

- [ ] Export ranking APIs.
- [ ] Run final full CI.
- [ ] Confirm PR changes only plan, ranking module/test and domain index.
- [ ] Keep stacked on `feat/06d-challenges-seasons-foundation`.

## Self-review

This plan closes all ranking families and roadmap scopes plus configurable repeat-route protection. Plan 06F will compose XP, levels, badges, challenges and rankings into one deterministic verified-activity progression projection.