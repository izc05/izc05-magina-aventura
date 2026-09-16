# Mágina Aventura — Community Foundation V1 Design

**Date:** 2026-09-15  
**Status:** Approved direction, implementation spec  
**Repository:** `izc05/izc05-magina-aventura`  
**Branch:** `feat/03-community-foundation`  
**Base:** `feat/02-platform-auth-geospatial`

## 1. Goal

Create the secure data and moderation foundation for Mágina Aventura community features without touching `main` and without coupling the feature to the GPS engine while that work remains on a separate branch.

This foundation must support later mobile and admin clients for:

- route photographs;
- route comments;
- route reviews;
- community incident reports;
- abuse/content reports;
- moderation actions;
- staff roles;
- soft deletion and restoration;
- future linkage to verified GPS activities.

The feature belongs only to Mágina Aventura. It must not depend on Mágina Olivo V20, Mi Olivo, Mi Campo or external reward redemption systems.

## 2. Scope for this branch

### Included

- database schema for staff roles and community content;
- Row Level Security for users and staff;
- immutable moderation audit trail;
- soft-delete states;
- media metadata prepared for Cloudflare R2;
- route-bound comments, reviews, photographs and incidents;
- report/flag workflow;
- future-compatible `activity_id` reference strategy without a hard dependency on the GPS branch;
- pgTAP database contract/security tests;
- CI compatibility with the existing repository gate.

### Not included in this branch

- mobile community screens;
- admin UI;
- Cloudflare R2 upload implementation;
- automatic image moderation service;
- comments replies/threads deeper than one level;
- likes/follows/social graph;
- push notifications;
- GPS activity verification integration;
- production seed users or fabricated community content.

Those consume this foundation later.

## 3. Architectural constraints

The existing platform architecture remains authoritative:

- Supabase/PostgreSQL owns users, profiles, route/community metadata and RLS;
- large photographs belong in Cloudflare R2, not PostgreSQL and not a new Supabase Storage dependency;
- the database stores only media metadata and an object key/provider reference;
- all long-lived entities use UUID primary keys;
- the system remains a modular monolith with explicit contracts;
- no direct modification of `main`;
- no dependency on unpublished or fictional route data.

## 4. Roles and privilege model

Do not add an editable `role` column to `profiles`.

Create a separate staff-role model so a user cannot elevate privileges by updating their own profile.

### Enum

`public.community_staff_role`

Values:

- `owner`
- `admin`
- `moderator`

Normal users have no row in the staff table.

### Table

`public.community_staff_members`

- `user_id uuid primary key references auth.users(id) on delete cascade`
- `role community_staff_role not null`
- `created_at timestamptz not null default now()`
- `created_by uuid references auth.users(id) on delete set null`

### Staff helper

Create a stable helper function:

`public.has_community_staff_role(required_roles community_staff_role[]) returns boolean`

Requirements:

- `security definer`;
- fixed `search_path`;
- checks the current `auth.uid()` only;
- ordinary authenticated users cannot execute arbitrary privilege-changing operations through this helper.

Moderation permissions:

- `owner`: all community moderation and staff-management operations;
- `admin`: all community moderation, but not owner assignment/removal;
- `moderator`: content moderation only;
- normal user: own content only.

The first production `owner` assignment is an operational/bootstrap action outside this branch. Tests may create staff rows using the database superuser fixture.

## 5. Community photo metadata

Create `public.community_photos`.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `route_id uuid not null references public.routes(id) on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `discovery_id uuid references public.discoveries(id) on delete set null`
- `activity_external_id uuid null`
- `object_provider text not null default 'r2' check (object_provider in ('r2'))`
- `object_key text not null`
- `caption text null check (char_length(caption) <= 1000)`
- `taken_at timestamptz null`
- `location extensions.geometry(Point, 4326) null`
- `location_visibility text not null default 'approximate' check (location_visibility in ('hidden','approximate'))`
- `moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','hidden','rejected','deleted'))`
- `featured boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Rules:

- `object_key` is unique;
- no raw image bytes live in PostgreSQL;
- exact `location` is not exposed by default to ordinary public/community reads;
- `featured=true` requires approved content and is staff-controlled;
- `deleted` is soft deletion; destructive object cleanup happens later in a separate media lifecycle worker;
- `activity_external_id` is intentionally not a foreign key yet because the GPS activity schema is still isolated on another branch. A later integration migration may replace/augment it with a true FK.

## 6. Route comments

Create `public.route_comments`.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `route_id uuid not null references public.routes(id) on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `body text not null check (char_length(body) between 1 and 2000)`
- `moderation_status text not null default 'approved' check (moderation_status in ('approved','hidden','deleted'))`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`

V1 comments are flat. Threading/replies are explicitly deferred.

## 7. Route reviews

Create `public.route_reviews`.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `route_id uuid not null references public.routes(id) on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `rating smallint not null check (rating between 1 and 5)`
- `body text null check (char_length(body) <= 3000)`
- `moderation_status text not null default 'approved' check (moderation_status in ('approved','hidden','deleted'))`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Constraint:

- one active review per `(route_id, user_id)`; user edits the same review instead of generating duplicates.

## 8. Community incidents

Create `public.route_incidents`.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `route_id uuid not null references public.routes(id) on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `category text not null check (category in ('fallen_tree','blocked_path','landslide','mud','dry_water_source','damaged_sign','animal_risk','other'))`
- `description text not null check (char_length(description) between 1 and 2000)`
- `position extensions.geometry(Point, 4326) null`
- `photo_id uuid references public.community_photos(id) on delete set null`
- `status text not null default 'pending' check (status in ('pending','confirmed','dismissed','resolved','deleted'))`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `resolved_at timestamptz null`
- `deleted_at timestamptz null`

Incidents are always labelled community information. They must never be represented as official authority/AEMET/Junta notices.

## 9. Abuse/content reports

Create `public.community_reports`.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `reporter_user_id uuid not null references auth.users(id) on delete cascade`
- `target_type text not null check (target_type in ('photo','comment','review','incident'))`
- `target_id uuid not null`
- `reason text not null check (reason in ('spam','abuse','unsafe','privacy','copyright','not_route_related','other'))`
- `details text null check (char_length(details) <= 2000)`
- `status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed'))`
- `created_at timestamptz not null default now()`
- `resolved_at timestamptz null`

Use an application/database validation trigger to ensure `target_id` exists in the table implied by `target_type`. A polymorphic report table is accepted here because all report targets share the same moderation workflow and no cascading FK semantics are required.

Prevent duplicate open reports by the same reporter for the same target.

## 10. Moderation audit trail

Create `public.moderation_actions`.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `actor_user_id uuid not null references auth.users(id) on delete restrict`
- `target_type text not null check (target_type in ('photo','comment','review','incident','report','user'))`
- `target_id uuid not null`
- `action text not null check (action in ('approve','reject','hide','restore','delete','feature','unfeature','confirm','dismiss','resolve','warn','suspend','unsuspend'))`
- `reason text null check (char_length(reason) <= 2000)`
- `created_at timestamptz not null default now()`

Rules:

- only staff can insert;
- users cannot update or delete audit rows;
- moderation actions are append-only;
- the audit table is not a substitute for the target entity's current state.

## 11. RLS rules

Enable RLS on every new table.

### Community content

Authenticated users may:

- insert their own photos/comments/reviews/incidents/reports;
- read their own pending/hidden photo metadata;
- read approved/non-deleted community content for published routes;
- update only their own editable content fields while content is not deleted;
- soft-delete their own comments/reviews/photos/incidents;
- never change moderation-controlled fields (`moderation_status`, `featured`, incident staff status).

Because PostgreSQL RLS cannot by itself restrict individual updated columns, moderation fields must be protected with triggers that reject unauthorized changes by non-staff users.

Staff may read all moderation states and change moderation-controlled fields according to role.

### Staff roles

- normal users cannot select the complete staff roster;
- a user may only learn whether they themselves have a staff role through a minimal view/helper if needed;
- only `owner` can manage `community_staff_members`;
- `admin` and `moderator` cannot promote themselves.

### Audit

- only staff can read moderation audit rows;
- only staff can insert audit rows;
- nobody updates/deletes audit rows through authenticated application roles.

## 12. Exact-location privacy

Community photos and incidents may store precise coordinates for internal validation/moderation, but ordinary community queries must not expose exact coordinates.

Create safe read views for later clients:

- `public.community_photos_public`
- `public.route_incidents_public`

The public photo view contains no geometry column.

The public incident view exposes route association/category/status/timestamps but no exact geometry in V1.

Approximate map placement will be implemented later via a dedicated server-side projection/function that rounds or displaces coordinates deliberately. Do not leak the raw point and ask the client to hide it.

## 13. Moderation state invariants

Database triggers/functions enforce:

- non-staff users cannot set or alter moderation state;
- non-staff users cannot set `featured`;
- a photo cannot become featured unless `moderation_status='approved'` and `deleted_at is null`;
- setting a content row to `deleted` must set `deleted_at`;
- restoring content clears `deleted_at`;
- `route_incidents.status='resolved'` sets `resolved_at`; leaving resolved clears it only through a staff moderation transition;
- moderation transitions performed by staff are accompanied by an explicit `moderation_actions` record at the application/RPC boundary.

V1 does not auto-create an audit row from every SQL update trigger because audit reasons and operator intent belong to the moderation command. Instead expose staff-only RPCs for moderation mutations and test those RPCs.

## 14. Staff moderation RPCs

Create narrowly scoped RPCs rather than giving clients broad direct-update power:

- `moderate_community_photo(photo_id uuid, action text, reason text default null)`
- `moderate_route_comment(comment_id uuid, action text, reason text default null)`
- `moderate_route_review(review_id uuid, action text, reason text default null)`
- `moderate_route_incident(incident_id uuid, action text, reason text default null)`
- `resolve_community_report(report_id uuid, resolution text, reason text default null)`

Each RPC:

- verifies staff role;
- validates transition/action;
- updates target state atomically;
- inserts one audit row in the same transaction;
- returns the target id and resulting status.

Owner-only role management uses a separate RPC:

- `set_community_staff_role(target_user_id uuid, new_role community_staff_role)`
- optional removal via `remove_community_staff_role(target_user_id uuid)`

## 15. Indexes

Add indexes for the first expected access paths:

- photos by `(route_id, moderation_status, created_at desc)`;
- photos by `(user_id, created_at desc)`;
- comments by `(route_id, moderation_status, created_at desc)`;
- reviews by `(route_id, moderation_status)`;
- incidents by `(route_id, status, created_at desc)`;
- reports by `(status, created_at)`;
- moderation actions by `(target_type, target_id, created_at desc)`;
- GiST on internal incident/photo geometry only if spatial filtering is needed by a later query. Do not add unnecessary spatial indexes in this first migration unless the tests/query contract requires them.

## 16. Testing contract

All database behavior is developed TDD-style with pgTAP.

Tests must prove at minimum:

1. schema objects and constraints exist;
2. ordinary user cannot make themselves staff;
3. user A cannot edit/delete user B content;
4. user cannot approve/feature their own photo;
5. user can create and soft-delete their own content;
6. moderator can moderate content but cannot manage staff roles;
7. admin can moderate content;
8. only owner can manage staff roles;
9. moderation RPC produces an audit row atomically;
10. audit rows cannot be modified/deleted by application users;
11. public views never expose raw geometry;
12. duplicate open report from the same user/target is rejected;
13. duplicate active review per route/user is rejected;
14. invalid target report is rejected;
15. featured photo invariant is enforced;
16. all existing route/profile database tests continue to pass.

CI acceptance remains the existing repository `verify` job:

- Typecheck;
- unit tests;
- Android Expo prebuild;
- pure package boundary check;
- Supabase local start/reset;
- database contract tests.

## 17. Delivery strategy

Implement this as a Draft PR:

- branch: `feat/03-community-foundation`
- base: `feat/02-platform-auth-geospatial`

Keep the PR stacked until Auth/Profiles lands safely. Do not merge to `main` as part of this work.

The first completed branch delivers a stable data/moderation contract. Subsequent work can independently add:

1. R2 media upload adapter;
2. mobile route community/gallery UI;
3. admin moderation application;
4. GPS-verified activity linkage;
5. automatic moderation and notifications.

## 18. Definition of Done

Community Foundation V1 is complete when:

- migrations apply from a clean local Supabase reset;
- all new pgTAP tests pass;
- all pre-existing tests remain green;
- the CI `verify` job is green on the Community branch HEAD;
- no changes were made to `main`;
- no production content/users were invented;
- no raw image data is stored in PostgreSQL;
- no exact community-photo coordinates are exposed through public views;
- all staff moderation commands are auditable.
