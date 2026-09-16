# Community Foundation V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the secure database and moderation foundation for Mágina Aventura community photos, comments, reviews, incidents, reports and staff moderation without coupling the feature to the GPS branch.

**Architecture:** Extend the existing Supabase/PostgreSQL/PostGIS schema with a dedicated community subsystem. Keep staff privileges separate from editable profiles, store only media metadata for Cloudflare R2, expose privacy-safe read views, and perform staff moderation through audited security-definer RPCs. Use RLS plus guard triggers so ordinary users can manage only their own content and cannot mutate moderation-controlled fields.

**Tech Stack:** PostgreSQL 17, Supabase CLI 2.117.0, PostGIS, pgTAP, GitHub Actions CI, Node 22.13+, pnpm 10.

**Spec:** `docs/superpowers/specs/2026-09-15-community-foundation-v1-design.md`

## Global Constraints

- Work only on `feat/03-community-foundation`, stacked on `feat/02-platform-auth-geospatial`; do not touch `main`.
- No dependency on the GPS PR or unpublished activity tables.
- Photographs are stored in Cloudflare R2 later; PostgreSQL stores only `object_provider='r2'` and `object_key` metadata.
- Do not add an editable role field to `profiles`.
- Exact community photo/incident coordinates must not appear in public views.
- Every long-lived entity uses UUID primary keys.
- Moderation state changes by staff must be performed through audited RPCs.
- Ordinary users can modify only their own content and never moderation-controlled fields.
- Community incidents are community information, never official notices.
- New database behavior follows RED → GREEN → REFACTOR with pgTAP.
- Existing CI remains authoritative: typecheck, unit tests, Android Expo prebuild, pure package boundary check, Supabase reset and database tests.

---

## Target File Structure

```text
supabase/
  migrations/
    202609150010_community_schema.sql
    202609150011_community_security.sql
    202609150012_community_moderation.sql
  tests/database/
    community_schema_test.sql
    community_security_test.sql
    community_moderation_test.sql

docs/superpowers/
  specs/2026-09-15-community-foundation-v1-design.md
  plans/2026-09-15-05-community-foundation-v1.md
```

### Task 1: Community schema contracts and tables

**Files:**
- Create: `supabase/tests/database/community_schema_test.sql`
- Create after RED: `supabase/migrations/202609150010_community_schema.sql`

**Interfaces:**
- Consumes: existing `public.routes`, `public.discoveries`, `auth.users`, PostGIS `extensions.geometry`.
- Produces: `community_staff_role`, `community_staff_members`, `community_photos`, `route_comments`, `route_reviews`, `route_incidents`, `community_reports`, `moderation_actions`, and privacy-safe public views.

- [ ] **Step 1: Write the failing pgTAP schema contract**

Create tests that assert all seven tables plus `community_staff_role` exist, required key columns exist, `community_photos.object_key` is unique, one non-deleted review per `(route_id,user_id)` is enforced through a partial unique index, and `community_photos_public` / `route_incidents_public` do not expose `location`.

Use this shape:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);
select has_table('public', 'community_photos', 'community_photos exists');
select has_table('public', 'route_comments', 'route_comments exists');
select has_table('public', 'route_reviews', 'route_reviews exists');
select has_table('public', 'route_incidents', 'route_incidents exists');
select has_table('public', 'community_reports', 'community_reports exists');
select has_table('public', 'moderation_actions', 'moderation_actions exists');
select has_table('public', 'community_staff_members', 'community_staff_members exists');
select has_column('public', 'community_photos', 'object_key', 'photo object key exists');
select has_column('public', 'community_photos', 'activity_external_id', 'future activity link exists');
select has_column('public', 'route_incidents', 'position', 'internal incident position exists');
select has_column('public', 'moderation_actions', 'actor_user_id', 'audit actor exists');
select ok(to_regtype('public.community_staff_role') is not null, 'community staff role enum exists');
select ok(to_regclass('public.community_photos_public') is not null, 'public photo view exists');
select ok(to_regclass('public.route_incidents_public') is not null, 'public incident view exists');
select ok(not exists (
  select 1 from information_schema.columns
  where table_schema='public' and table_name='community_photos_public' and column_name='location'
), 'public photo view hides exact geometry');
select ok(not exists (
  select 1 from information_schema.columns
  where table_schema='public' and table_name='route_incidents_public' and column_name='position'
), 'public incident view hides exact geometry');
select ok(exists (
  select 1 from pg_indexes where schemaname='public' and tablename='community_photos' and indexname='community_photos_object_key_uidx'
), 'photo object key unique index exists');
select ok(exists (
  select 1 from pg_indexes where schemaname='public' and tablename='route_reviews' and indexname='route_reviews_active_user_route_uidx'
), 'one active review index exists');
select * from finish();
rollback;
```

- [ ] **Step 2: Open/update the Draft PR so CI executes the RED test**

Base: `feat/02-platform-auth-geospatial`; head: `feat/03-community-foundation`.

- [ ] **Step 3: Verify RED in GitHub Actions**

Expected: `verify` fails in `Database contract tests` because the new schema objects do not yet exist. A syntax/configuration failure does not count as valid RED.

- [ ] **Step 4: Implement the minimal schema migration**

Create `202609150010_community_schema.sql` with the exact fields and constraints from the spec, including:

```sql
create type public.community_staff_role as enum ('owner','admin','moderator');
```

Create all tables with UUID PKs/FKs, state checks, content length checks, timestamps, `object_provider` constrained to `r2`, unique object keys, partial unique active-review index, expected access-path indexes, and public privacy views that omit geometry.

- [ ] **Step 5: Verify GREEN**

Expected: schema pgTAP tests and all pre-existing database tests pass in CI.

- [ ] **Step 6: Commit**

Commit message: `feat(community): add community data model`

### Task 2: RLS, ownership and privilege guards

**Files:**
- Create: `supabase/tests/database/community_security_test.sql`
- Create after RED: `supabase/migrations/202609150011_community_security.sql`

**Interfaces:**
- Consumes: community tables from Task 1 and Supabase `auth.uid()` JWT context.
- Produces: RLS policies, `has_community_staff_role(...)`, protected moderation columns, soft-delete invariants, report-target validation and public read permissions.

- [ ] **Step 1: Write failing security tests**

The pgTAP test must create fixture auth users/routes inside a transaction and use `set local role authenticated; set_config('request.jwt.claim.sub', '<uuid>', true)` to prove:

```text
user A can create own comment/photo/review/incident/report
user A cannot update user B content
user cannot approve or feature own photo
user can soft-delete own content
normal user cannot insert/update community_staff_members
moderator/admin/owner checks distinguish roles
public views expose only approved/non-deleted content on published routes
invalid report target is rejected
duplicate open report by same reporter/target is rejected
featured photo requires approved + not deleted
```

- [ ] **Step 2: Verify RED**

Expected: CI database tests fail because RLS/helper/guards do not exist.

- [ ] **Step 3: Implement security migration**

Create `has_community_staff_role(required_roles public.community_staff_role[]) returns boolean` as `security definer` with fixed `search_path = public, auth, pg_temp` and `auth.uid()`-only lookup.

Enable RLS on every new table. Add policies for own inserts/reads/updates plus staff read access. Add triggers/functions that reject non-staff changes to moderation-controlled fields, enforce delete timestamps, enforce featured-photo state, maintain `resolved_at`, validate report targets, and prevent duplicate open reports.

Do not grant ordinary users direct staff-management capability.

- [ ] **Step 4: Verify GREEN**

Expected: security test plus schema/profile/route tests pass.

- [ ] **Step 5: Commit**

Commit message: `feat(community): enforce community RLS and invariants`

### Task 3: Audited moderation RPCs

**Files:**
- Create: `supabase/tests/database/community_moderation_test.sql`
- Create after RED: `supabase/migrations/202609150012_community_moderation.sql`

**Interfaces:**
- Consumes: staff helper and protected tables from Tasks 1–2.
- Produces: staff-only audited moderation commands and owner-only staff-role management.

- [ ] **Step 1: Write failing RPC tests**

Prove the following real behavior:

```text
moderator can hide/restore/approve/reject photo/comment/review content allowed by role
moderator can confirm/dismiss/resolve incident
admin can perform content moderation
moderator cannot manage staff roles
admin cannot assign/remove owner
owner can set/remove admin/moderator roles
moderation RPC changes target and inserts exactly one audit row atomically
normal user cannot execute moderation successfully
authenticated users cannot update/delete moderation_actions
resolve_community_report updates report state and audits it
```

Assert procedures exist with `to_regprocedure(...)` and then exercise them under JWT user contexts.

- [ ] **Step 2: Verify RED**

Expected: CI database tests fail because RPCs do not exist.

- [ ] **Step 3: Implement moderation migration**

Create security-definer RPCs with fixed search paths:

```text
moderate_community_photo(uuid,text,text)
moderate_route_comment(uuid,text,text)
moderate_route_review(uuid,text,text)
moderate_route_incident(uuid,text,text)
resolve_community_report(uuid,text,text)
set_community_staff_role(uuid,community_staff_role)
remove_community_staff_role(uuid)
```

Each content RPC validates staff role + action, updates the target, inserts one `moderation_actions` row in the same transaction and returns target id/resulting state. Staff-management RPCs are owner-only and must reject assigning/removing the caller's last owner state in a way that leaves no owner when that invariant can be checked safely.

- [ ] **Step 4: Verify GREEN**

Expected: all database tests pass.

- [ ] **Step 5: Commit**

Commit message: `feat(community): add audited moderation commands`

### Task 4: Full repository verification and PR closure state

**Files:**
- No production files unless verification identifies a real regression.
- Update PR body only to reflect actual completed behavior and test evidence.

**Interfaces:**
- Consumes: all Tasks 1–3.
- Produces: a Draft PR whose HEAD has a green `verify` job.

- [ ] **Step 1: Run/observe the complete existing CI contract**

Expected GitHub Actions steps:

```text
Install dependencies
Typecheck
Unit tests
Verify Android Expo prebuild
Verify pure package boundaries
Start local Supabase database
Reset local Supabase database
Database contract tests
```

- [ ] **Step 2: Inspect the workflow job, not only the PR badge**

All steps must be `completed/success`. No skipped database tests are accepted.

- [ ] **Step 3: Check branch isolation**

Compare `feat/02-platform-auth-geospatial...feat/03-community-foundation`; changes must be limited to Community spec/plan/tests/migrations. Confirm `main` has not moved because of this work.

- [ ] **Step 4: Keep PR Draft**

Do not merge. The foundation is ready for later R2 adapter, mobile Community UI and admin UI only after this contract is green.

- [ ] **Step 5: Final evidence**

Report PR number, HEAD SHA, workflow run id, `verify` conclusion and any intentionally deferred items from the spec.
