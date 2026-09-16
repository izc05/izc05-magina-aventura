# Community Mobile V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real, read-only route community experience to the Expo app using the existing secure Community Foundation V1.

**Architecture:** Keep community access behind a small feature repository. Public reads use PostgREST over `fetch` with the existing Expo-safe Supabase configuration. UI consumes one route-scoped snapshot and never fabricates content or exposes raw geometry.

**Tech Stack:** Expo Router, React Native, TypeScript, Vitest, Supabase/PostgREST, PostgreSQL/pgTAP.

**Spec:** `docs/superpowers/specs/2026-09-16-community-mobile-v1-design.md`

## Global Constraints

- Branch: `feat/04-community-mobile`; base: `feat/03-community-foundation`.
- Do not touch `main`.
- No fake community photos/users/reviews/incidents.
- No mobile write flows until session/auth exists.
- No `@supabase/supabase-js` dependency for V1 public reads.
- Never request raw photo `location` or incident `position`.
- Community incidents must stay visually/textually distinct from official alerts.

---

### Task 1: Community public-read contract

**Files:**
- Create: `apps/mobile/src/features/community/community-types.ts`
- Create: `apps/mobile/src/features/community/community-summary.ts`
- Test: `apps/mobile/src/features/community/community-summary.test.ts`

**Interfaces:**
- Produces `RouteCommunitySnapshot`, `CommunityPhoto`, `RouteCommunityReview`, `RouteCommunityComment`, `RouteCommunityIncident`.
- Produces `summarizeRouteCommunity(snapshot)` returning counts, average rating or `null`, and active incident count.

- [ ] Write tests proving zero-content summaries remain zero/null and review averages are derived from real ratings.
- [ ] Run mobile Vitest and verify RED because the module is missing.
- [ ] Implement minimal types and summary function.
- [ ] Run tests and verify GREEN.
- [ ] Commit.

### Task 2: Media configuration and URL resolver

**Files:**
- Create: `apps/mobile/src/features/community/community-media.ts`
- Test: `apps/mobile/src/features/community/community-media.test.ts`

**Interfaces:**
- Produces `readCommunityMediaBaseUrl(env): string | null`.
- Produces `resolveCommunityPhotoUrl(baseUrl, objectKey): string`.

- [ ] Write tests for missing config, HTTPS enforcement, trailing-slash normalization and path-segment encoding.
- [ ] Verify RED.
- [ ] Implement minimal resolver.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 3: Public PostgREST repository

**Files:**
- Create: `apps/mobile/src/features/community/community-repository.ts`
- Create: `apps/mobile/src/features/community/postgrest-community-repository.ts`
- Test: `apps/mobile/src/features/community/postgrest-community-repository.test.ts`

**Interfaces:**
- `CommunityRepository.getRouteCommunity(routeId: string): Promise<RouteCommunityLoadResult>`.
- `RouteCommunityLoadResult` is `{ state: 'unavailable' } | { state: 'ready'; snapshot: RouteCommunitySnapshot }`.
- Factory accepts `fetchFn` for tests and reads `SupabasePublicConfig` supplied by caller.

- [ ] Write tests proving absent Supabase config returns `unavailable` without network access.
- [ ] Write tests capturing the four request URLs and asserting selects omit `location` and `position`.
- [ ] Write tests proving responses combine into one snapshot.
- [ ] Verify RED.
- [ ] Implement parallel PostgREST reads with publishable-key headers and explicit safe field lists.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 4: Anonymous database contract

**Files:**
- Create: `supabase/tests/database/community_public_read_test.sql`
- If required after RED only, create a new migration under `supabase/migrations/` granting the minimum read permissions needed by anon.

**Interfaces:**
- Anonymous role can read approved public community rows for a published route.
- Anonymous role cannot read pending photo content or raw geometry.

- [ ] Add pgTAP fixtures and anonymous-read assertions.
- [ ] Run CI/DB test and verify RED if privileges are incomplete.
- [ ] Add only the minimum migration required by the failing assertions.
- [ ] Re-run DB tests and verify GREEN.
- [ ] Commit.

### Task 5: Route Community screen

**Files:**
- Create: `apps/mobile/app/routes/[slug]/community.tsx`
- Modify: `apps/mobile/app/routes/[slug].tsx`
- Reuse: `apps/mobile/src/theme/tokens.ts`

**Interfaces:**
- Screen loads route with `getDevelopmentRouteBySlug(slug)` and repository by `route.id`.
- Sections: `Fotos`, `Opiniones`, `Avisos`.

- [ ] Add the screen with loading/unavailable/error/empty/ready states and no invented data.
- [ ] Render real R2 images only when `EXPO_PUBLIC_COMMUNITY_MEDIA_BASE_URL` resolves; otherwise neutral placeholders.
- [ ] Show review average/counts from `summarizeRouteCommunity`.
- [ ] Label route incidents `COMUNIDAD` and include non-official disclaimer.
- [ ] Add `Comunidad` navigation card to route detail above `Preparar aventura`.
- [ ] Run TypeScript, unit tests and Expo Android prebuild.
- [ ] Commit.

### Task 6: Draft PR and full verification

**Files:** none beyond any fixes found by verification.

- [ ] Open Draft PR from `feat/04-community-mobile` to `feat/03-community-foundation`.
- [ ] Run/inspect full CI `verify` on final HEAD.
- [ ] If any gate fails, fix via RED/GREEN without widening scope.
- [ ] Re-read spec and compare changed files against requirements.
- [ ] Leave PR Draft and `main` untouched.
