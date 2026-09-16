# Mágina Aventura Admin Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure Next.js administration application that lets authorized operators manage Mágina Aventura routes, media, users, community, gamification, rewards/QR, notifications and audit history.

**Architecture:** Add `apps/admin` to the existing pnpm workspace and keep Supabase as the shared backend. Reuse existing route tables, add dedicated authorization/administration tables through migrations, enforce RBAC in RLS and server actions, and keep all sensitive mutations server/database controlled.

**Tech Stack:** Node 22.13+, pnpm 10.15.0, TypeScript 6, Next.js 16.3.3, React 19.2.3, Supabase JS 2.116.0, Supabase SSR 0.12.7, Vitest, pgTAP.

**Spec:** `docs/superpowers/specs/2026-09-16-admin-platform-design.md`

## Global Constraints

- Never commit to `main`; use `feat/admin-v1`.
- Never expose service-role/secret keys in browser code.
- New public tables require explicit grants plus RLS.
- Authorization data must not use user-editable metadata.
- Route CMS must reuse existing route/checkpoint/discovery tables.
- Sensitive mutations must append audit events.
- XP and olives must be ledger-driven; no untracked balance overwrite.
- QR redemption must be atomic and one-time.

---

### Task 1: Admin application shell and dependency integration

**Files:**
- Create: `apps/admin/package.json`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/next.config.ts`
- Create: `apps/admin/src/app/layout.tsx`
- Create: `apps/admin/src/app/page.tsx`
- Create: `apps/admin/src/app/globals.css`
- Create: `apps/admin/src/lib/navigation.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: workspace package `@magina-aventura/admin` with `dev`, `build`, `typecheck`, `test` scripts.
- Produces: `ADMIN_NAV_ITEMS` navigation contract used by authenticated layout.

- [ ] Write a Vitest test asserting required navigation modules and unique hrefs.
- [ ] Run Admin test and confirm RED because navigation module does not exist.
- [ ] Create pinned package/config files and minimal layout/navigation.
- [ ] Run test and typecheck; confirm GREEN.
- [ ] Commit `feat(admin): add admin application shell`.

### Task 2: Supabase SSR session and RBAC foundation

**Files:**
- Create: `apps/admin/src/lib/supabase/server.ts`
- Create: `apps/admin/src/lib/supabase/client.ts`
- Create: `apps/admin/src/lib/auth/roles.ts`
- Create: `apps/admin/src/lib/auth/roles.test.ts`
- Create: `apps/admin/src/lib/auth/require-admin.ts`
- Create: `supabase/migrations/202609160001_admin_roles.sql`
- Create: `supabase/tests/admin_roles_rls.test.sql`

**Interfaces:**
- Produces: `AdminRole = 'super_admin' | 'admin' | 'route_manager' | 'moderator' | 'partner'`.
- Produces: `can(role, capability): boolean` and `requireAdmin(capability)`.
- Database produces: `admin_roles`, `user_admin_roles`, helper authorization function and RLS policies.

- [ ] Write failing role/capability unit tests.
- [ ] Write failing pgTAP tests proving ordinary authenticated users cannot read/write admin role tables and route managers cannot grant roles.
- [ ] Add role migration with explicit Data API grants and RLS.
- [ ] Implement role capability matrix and server guard.
- [ ] Run unit/database tests; confirm GREEN.
- [ ] Commit `feat(admin): add secure role foundation`.

### Task 3: Audit log foundation

**Files:**
- Create: `supabase/migrations/202609160002_admin_audit.sql`
- Create: `supabase/tests/admin_audit.test.sql`
- Create: `apps/admin/src/lib/audit/types.ts`
- Create: `apps/admin/src/app/(protected)/audit/page.tsx`

**Interfaces:**
- Database produces append-only `admin_audit_log`.
- Produces action names such as `route.publish`, `role.assign`, `moderation.resolve`, `reward.redeem`.

- [ ] Write pgTAP tests proving normal users cannot insert/read audit rows and admin clients cannot update/delete existing rows.
- [ ] Add table, indexes, explicit grants and RLS.
- [ ] Add read-only audit page for allowed admins.
- [ ] Run tests/typecheck; confirm GREEN.
- [ ] Commit `feat(admin): add immutable audit log`.

### Task 4: Route CMS

**Files:**
- Create: `apps/admin/src/app/(protected)/routes/page.tsx`
- Create: `apps/admin/src/app/(protected)/routes/new/page.tsx`
- Create: `apps/admin/src/app/(protected)/routes/[id]/page.tsx`
- Create: `apps/admin/src/features/routes/actions.ts`
- Create: `apps/admin/src/features/routes/route-form.tsx`
- Create: `apps/admin/src/features/routes/validation.ts`
- Create: `apps/admin/src/features/routes/validation.test.ts`
- Create: `supabase/migrations/202609160003_admin_route_policies.sql`
- Create: `supabase/tests/admin_route_policies.test.sql`

**Interfaces:**
- Reuses existing `routes`, `route_versions`, `route_geometries`, `checkpoints`, `discoveries`.
- Produces server actions `createRouteDraft`, `updateRouteDraft`, `publishRoute`, `archiveRoute`.

- [ ] Write failing validation tests for title/slug/status/difficulty/rewards.
- [ ] Write failing pgTAP tests for route-manager CRUD and public published-only access.
- [ ] Add admin route policies without weakening public policies.
- [ ] Implement list/create/edit/publish/archive actions with audit writes.
- [ ] Implement route form and status controls.
- [ ] Run tests/typecheck; confirm GREEN.
- [ ] Commit `feat(admin): add route cms`.

### Task 5: GPX, checkpoints, discoveries and multimedia

**Files:**
- Create: `apps/admin/src/features/routes/gpx-import.tsx`
- Create: `apps/admin/src/features/routes/map-content-editor.tsx`
- Create: `apps/admin/src/features/media/media-library.tsx`
- Create: `apps/admin/src/features/media/actions.ts`
- Create: `supabase/migrations/202609160004_admin_media.sql`
- Create: `supabase/tests/admin_media.test.sql`

**Interfaces:**
- Consumes existing `@magina-aventura/route-import` package.
- Produces `media_assets` metadata and Storage `media` bucket permissions.
- Produces route media association records.

- [ ] Write failing tests for accepted GPX/import output and media authorization.
- [ ] Add media metadata/storage policies with RLS and explicit grants.
- [ ] Implement GPX import into route geometry version.
- [ ] Implement checkpoint/discovery CRUD with coordinate/radius validation.
- [ ] Implement media upload/select/archive workflow.
- [ ] Run tests/typecheck/database tests; confirm GREEN.
- [ ] Commit `feat(admin): add map content and media management`.

### Task 6: Users, community and moderation

**Files:**
- Create: `apps/admin/src/app/(protected)/users/page.tsx`
- Create: `apps/admin/src/app/(protected)/moderation/page.tsx`
- Create: `apps/admin/src/features/moderation/actions.ts`
- Create: `supabase/migrations/202609160005_moderation_admin.sql`
- Create: `supabase/tests/moderation_admin.test.sql`

**Interfaces:**
- Produces moderation cases/actions that can attach to community content when those tables are present.
- Produces user administrative state (`active`, `warned`, `suspended`).

- [ ] Write failing moderation state-transition tests.
- [ ] Add moderation tables/RLS and audit requirements.
- [ ] Implement user list and safe operational details without auth secrets.
- [ ] Implement report resolve/hide/restore/warn/suspend actions.
- [ ] Verify no general private-message reader is exposed.
- [ ] Run tests/typecheck; confirm GREEN.
- [ ] Commit `feat(admin): add user and moderation console`.

### Task 7: Gamification and olives ledger

**Files:**
- Create: `supabase/migrations/202609160006_gamification_admin.sql`
- Create: `supabase/tests/gamification_ledger.test.sql`
- Create: `apps/admin/src/app/(protected)/gamification/page.tsx`
- Create: `apps/admin/src/features/gamification/actions.ts`
- Create: `apps/admin/src/features/gamification/ledger.ts`
- Create: `apps/admin/src/features/gamification/ledger.test.ts`

**Interfaces:**
- Produces levels, badges, challenges and `olive_transactions` append-only ledger.
- Produces `appendOliveAdjustment(userId, amount, reason)` server mutation with audit event.

- [ ] Write failing tests for ledger balance and invalid zero/unreasoned adjustments.
- [ ] Add schema/RLS ensuring users can read their own ledger while privileged writes are controlled.
- [ ] Implement gamification CRUD and audited administrative adjustments.
- [ ] Run unit/database tests; confirm GREEN.
- [ ] Commit `feat(admin): add gamification and olive ledger`.

### Task 8: Partners, rewards and QR redemption

**Files:**
- Create: `supabase/migrations/202609160007_rewards_redemption.sql`
- Create: `supabase/tests/rewards_redemption.test.sql`
- Create: `apps/admin/src/app/(protected)/rewards/page.tsx`
- Create: `apps/admin/src/app/(protected)/redemptions/page.tsx`
- Create: `apps/admin/src/features/rewards/actions.ts`
- Create: `apps/admin/src/features/rewards/state.ts`
- Create: `apps/admin/src/features/rewards/state.test.ts`

**Interfaces:**
- Produces partners, rewards, reward stock and redemptions.
- Redemption states: `reserved | redeemed | expired | cancelled`.
- Produces one-time opaque token redemption operation.

- [ ] Write failing state-transition tests and pgTAP double-redemption test.
- [ ] Add reward/redemption schema, RLS and atomic redeem function.
- [ ] Implement reward/stock management and partner-scoped access.
- [ ] Implement redemption validation/confirmation UI.
- [ ] Run tests; verify a token cannot be redeemed twice.
- [ ] Commit `feat(admin): add rewards and qr redemption`.

### Task 9: Notifications, safety and dashboard

**Files:**
- Create: `supabase/migrations/202609160008_notifications_safety.sql`
- Create: `apps/admin/src/app/(protected)/notifications/page.tsx`
- Create: `apps/admin/src/app/(protected)/safety/page.tsx`
- Create: `apps/admin/src/app/(protected)/dashboard/page.tsx`
- Create: `apps/admin/src/features/dashboard/queries.ts`

**Interfaces:**
- Produces notification records/audiences and route safety incidents.
- Dashboard consumes aggregate counts only; it does not bypass row-level authorization.

- [ ] Write failing database tests for notification/safety authorization.
- [ ] Add schema/RLS.
- [ ] Implement notification draft/publish and route open/close actions with audit events.
- [ ] Implement dashboard KPIs for routes, users, unresolved reports, active rewards and redemptions.
- [ ] Run tests/typecheck; confirm GREEN.
- [ ] Commit `feat(admin): add notifications safety and dashboard`.

### Task 10: CI, security review and pull request

**Files:**
- Modify: `.github/workflows/ci.yml` only if admin build is not already covered by recursive scripts.
- Modify: `README.md` or admin README with environment variable/setup instructions.

**Interfaces:**
- Final branch must pass workspace typecheck/tests, Next build and Supabase reset/pgTAP suite.

- [ ] Run/observe full CI on PR.
- [ ] Inspect Supabase advisors/security output where available.
- [ ] Confirm no secret/service-role value is referenced by client modules.
- [ ] Confirm all new public tables have explicit grants and RLS.
- [ ] Confirm route-public read policies remain published-only.
- [ ] Confirm audit rows are immutable and QR token reuse fails.
- [ ] Fix all CI/security findings.
- [ ] Open PR from `feat/admin-v1` to `main` with module checklist and migration summary.
