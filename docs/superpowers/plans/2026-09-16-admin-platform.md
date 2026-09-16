# Mágina Aventura Admin Platform Implementation Plan

**Branch:** `feat/admin-v1`  
**PR:** #8  
**Spec:** `docs/superpowers/specs/2026-09-16-admin-platform-design.md`

## Goal

Deliver a secure Super Admin control plane for Mágina Aventura so routes, maps, users, multimedia, public community/chat, gamification, olives, rewards/QR, notifications, safety, roles, settings and audit history can be operated without changing mobile code.

## Architecture actually implemented

`apps/admin` is a dependency-free static web application built with HTML, CSS and native ES modules. It uses Supabase Auth/Data API/Storage with only the public project URL and publishable key in the browser. Authorization and sensitive mutations are enforced in Supabase RLS and narrowly scoped RPCs. This avoids introducing a second framework/toolchain into the existing pnpm monorepo while keeping CI frozen-lockfile compatible.

## Global constraints

- [x] No direct work on `main`; implementation remains on `feat/admin-v1`.
- [x] No secret/service-role credential is shipped to browser code.
- [x] Admin/public tables use explicit grants and RLS.
- [x] Authorization is stored in database role tables, not editable user metadata.
- [x] Route CMS reuses canonical route/checkpoint/discovery entities.
- [x] Sensitive mutations are audited.
- [x] Olives are append-only ledger transactions.
- [x] QR redemption is atomic and one-time.
- [x] Private messages are not exposed as a general administrator inbox.

## 1 · Admin shell, Auth and RBAC

- [x] Protected login with Supabase email/password Auth.
- [x] Session stored in `sessionStorage`.
- [x] Refresh-token retry after access-token expiry.
- [x] Logout clears local session and attempts remote revocation.
- [x] Roles: `super_admin`, `admin`, `route_manager`, `moderator`, `partner`.
- [x] Capability-aware navigation/actions.
- [x] Database capability checks and role-scoped RLS.
- [x] Explicit capability whitelist for ordinary Admin to avoid future privilege creep.
- [x] Partner/almazara scoping.
- [x] Prevent revocation of the final Super Admin.
- [x] Node tests for navigation/roles and shell module wiring.

## 2 · Route CMS and map content

- [x] Route list/create/edit lifecycle.
- [x] Draft → review → published → archived state machine.
- [x] Versioned route content and geometry.
- [x] Published-route edits return the route to review rather than silently mutating production content.
- [x] GPX import and PostGIS LineString persistence.
- [x] Checkpoint management with radius/required/active fields.
- [x] Discovery management for flora, fauna, heritage, olive, tradition and landscape.
- [x] XP/olive rewards on route content.
- [x] Visual route editor for placing checkpoints/discoveries on the trace.
- [x] Route hero/gallery/safety/discovery media links.
- [x] PMTiles/offline-map asset metadata per geometry version.
- [x] Publication validation and audit history.
- [x] Temporary route closure without archive/delete through blocking safety incidents.
- [x] Public `route_adventure_gate(route_id)` contract for adventure-start availability.

## 3 · Multimedia

- [x] Private Supabase Storage `media` bucket.
- [x] Upload workflow.
- [x] Metadata: title, MIME, size, alt text and tags.
- [x] Reuse of media across routes.
- [x] Archive workflow instead of destructive removal by default.
- [x] Filename normalization/transliteration tests.
- [x] Anonymous/authenticated read limited by RLS to active media attached to published routes.

## 4 · Users, community and moderation

- [x] Safe user list without passwords/Auth secrets.
- [x] Per-user operational overview.
- [x] Moderation states: active / warned / suspended.
- [x] Suspend/warn/reactivate actions.
- [x] Public community moderation.
- [x] Public channel chat with global/route/municipality scope.
- [x] Message reporting and moderation.
- [x] Suspended-user posting protection.
- [x] Report resolution/dismissal.
- [x] No general reader for private conversations.

## 5 · Gamification and olives

- [x] Levels.
- [x] Badges.
- [x] Challenges.
- [x] Seasons and XP/olive multipliers.
- [x] Discovery collections and completion rewards.
- [x] Append-only `olive_transactions` ledger.
- [x] Audited administrative olive adjustments.
- [x] Direct Data API INSERT/UPDATE/DELETE revoked from the olive ledger for authenticated clients.

## 6 · Almazaras, rewards and QR

- [x] Partner/almazara catalogue.
- [x] Reward creation and stock.
- [x] Olive price and per-user limit.
- [x] Valid-from / valid-until policy.
- [x] Reward activation/deactivation.
- [x] Advanced reward editor loaded in the Admin shell.
- [x] Reservation consumes stock and olives atomically.
- [x] Reservation cancellation/expiry restores stock and olives.
- [x] Configurable reservation duration.
- [x] Opaque QR token with persisted hash only.
- [x] One-time redemption.
- [x] Partner-scoped redemption.
- [x] Manual token validation.
- [x] Camera/image QR reading when `BarcodeDetector` is available.

## 7 · Notifications, safety and configuration

- [x] Notification drafts and publication lifecycle.
- [x] Audiences: all, route followers, municipality followers and administrative role.
- [x] Device registration/topic subscription schema.
- [x] Delivery fan-out queue.
- [x] Service-role-only delivery claim/complete boundary.
- [x] Raw push tokens hidden from Admin UI.
- [x] Route safety incident creation/resolution.
- [x] Public users see only active incidents belonging to published routes.
- [x] Dedicated Admin workflow to close/reopen a route temporarily for new adventures.
- [x] Auditable JSON settings/feature flags.
- [x] Public/private setting visibility.
- [x] Maintenance/community/rewards/weather/checkpoint/reservation settings.

## 8 · Dashboard, audit and exports

- [x] Dashboard KPIs for users, routes, moderation, chat, rewards, redemptions and olives.
- [x] Read-only immutable Admin audit log.
- [x] Audit events for privileged operations.
- [x] Direct authenticated INSERT/UPDATE/DELETE revoked from audit log.
- [x] Direct audit-writer execution revoked from `anon`/`authenticated`.
- [x] Audit coverage includes route geometries, route media and gamification catalogs.
- [x] CSV helper/export support for operational data.

## 9 · Security and hosting hardening

- [x] CSP / frame denial / nosniff headers for static hosting.
- [x] Restrictive camera Permissions-Policy.
- [x] Runtime config generated from deployment environment.
- [x] Config generator accepts modern publishable keys or legacy JWT only when `role=anon`.
- [x] RLS on exposed administrative tables.
- [x] Fixed search path in privileged database functions.
- [x] Service-only notification dispatcher RPCs are not executable by `anon`/`authenticated`.
- [x] Private media bucket with published-route read boundary.
- [x] Security pgTAP coverage for immutable audit/olive ledgers, capabilities, public media and safety boundaries.

## 10 · CI and release closure

- [x] Root TypeScript typecheck.
- [x] Existing package/mobile unit tests remain green in verified runs.
- [x] Admin `.mjs` syntax check.
- [x] Admin Node test suite.
- [x] Expo Android prebuild validation.
- [x] Pure-package boundary validation.
- [x] Local Supabase start/reset from an empty database.
- [x] pgTAP database contract suite has passed repeatedly during hardening.
- [ ] Latest head: full GitHub Actions run green after final route-closure/docs hardening.
- [ ] Final PR review: no unresolved review threads/findings.
- [ ] Mark PR #8 ready for review once latest CI is green.

## 11 · Live environment boundary

These steps require account/environment choices and are intentionally not performed implicitly by the feature branch:

- [ ] Select/create the production or staging Supabase project.
- [ ] Apply migrations to that project.
- [ ] Create the first Auth account and bootstrap one `super_admin` row.
- [ ] Configure `SUPABASE_URL` + publishable key in hosting.
- [ ] Deploy `apps/admin` behind the chosen Admin hostname.
- [ ] Smoke-test login, route edit/publish, media upload, suspension, temporary closure/reopen, QR redemption and notification publication against the live project.
- [ ] Merge PR #8 into `main` only after explicit approval.

## Definition of nearly closed

The feature is considered **nearly closed** when the latest feature-branch head passes the complete CI matrix and PR #8 has no unresolved code/security findings. Live Supabase provisioning, first-account bootstrap, hosting smoke test and merge remain the only environment/approval-dependent steps.
