# Mágina Aventura Admin Platform Design

## Goal

Build a protected web administration application inside the existing monorepo so the Super Admin can operate Mágina Aventura without changing application code. The admin must manage routes and map content, users and permissions, multimedia, community moderation, gamification, rewards and QR redemptions, notifications, and audit history.

## Repository placement

The repository remains a pnpm monorepo. The mobile app stays in `apps/mobile`; the new control plane lives in `apps/admin`. Shared domain contracts stay in packages rather than being duplicated inside the web app.

```text
apps/
  mobile/
  admin/
packages/
  contracts/
  domain/
  geo/
  offline-sync/
  route-import/
supabase/
  migrations/
  seed/
  tests/
```

## Runtime and dependencies

- Node.js >= 22.13.0.
- pnpm 10.15.0.
- TypeScript 6.x, matching the repository.
- Next.js 16.3.3, React 19.2.3.
- `@supabase/supabase-js` 2.116.0.
- `@supabase/ssr` 0.12.7.
- Supabase Data API access is granted explicitly for every new public table and RLS is enabled on every exposed table.
- No service-role or secret key is ever shipped to the browser.

## Roles and authorization

Roles are stored in database authorization tables, never in editable user metadata.

- `super_admin`: full platform access.
- `admin`: general operation except critical role/configuration changes.
- `route_manager`: routes, GPX, checkpoints, discoveries and route media.
- `moderator`: reports, community content and moderation actions.
- `partner`: only the partner/almazara records, rewards, stock and QR redemptions assigned to that partner.

Authorization is enforced twice: page/action guards in `apps/admin` and RLS/database functions in Supabase. UI hiding alone never grants or removes permission.

## Admin navigation

The persistent desktop navigation contains:

1. Dashboard
2. Routes
3. Map & checkpoints
4. Discoveries
5. Multimedia
6. Users
7. Community
8. Moderation
9. Levels & XP
10. Challenges & badges
11. Olives ledger
12. Rewards
13. Partners / almazaras
14. QR redemptions
15. Notifications
16. Safety / incidents
17. Administrators
18. Audit log
19. Settings

The first production slice must make the route workflow complete before the secondary modules are expanded.

## Route CMS

The existing `routes`, `route_versions`, `route_geometries`, `checkpoints`, `discoveries` and route-map payload tables remain authoritative. Admin must not create parallel route entities.

A route editor supports:

- municipality, slug, title and status;
- description, safety notes, difficulty, distance, duration, elevation gain;
- reward XP and reward olives;
- GPX import and geometry versioning;
- checkpoints with point, radius, required/active state;
- discoveries with category, point, radius, XP/olive reward and visibility;
- route hero/gallery media;
- draft -> review -> published -> archived workflow;
- preview before publication.

Publishing is a server-side operation and records an audit entry.

## Multimedia

Use Supabase Storage with a dedicated `media` bucket and database metadata. Admin can upload, search, tag, reuse and archive assets. Replacement/upsert policies must grant the Storage operations required by Supabase while retaining role checks. Original files are preserved; display variants may be added later without changing references.

## Users

The user panel exposes safe operational information: account identifier, profile information when available, role memberships, activity summary, XP/olive balances, rewards and moderation state. Passwords and authentication secrets are never visible.

Administrative corrections to XP or olives must append ledger entries with reason and actor; direct balance overwrites are forbidden.

## Community and moderation

Administration handles public community content and reports. Moderators can hide/restore content, warn/suspend users and resolve reports. Every moderation action is audited.

Private conversations are not exposed as a general admin inbox. If private-chat abuse reporting is added, only reported message context needed to resolve a report is accessible to authorized moderators.

## Gamification

Gamification rules are data-driven rather than compiled into the mobile app. Admin manages levels, badges, challenges, seasons and reward rules. XP and olives are awarded by server/database-controlled operations after activity validation.

Olives use an append-only transaction ledger. Current balance is derived or maintained from ledger transactions; every mutation has source, amount, user, actor/system source and timestamp.

## Rewards and QR redemption

Partners/almazaras can publish rewards with stock, olive price, per-user limits and validity windows. Redemption flow:

`available -> reserved -> redeemed`

A reservation may transition to `expired` or `cancelled`; reserved olives are restored according to the transaction ledger rules.

The QR contains an opaque one-time redemption token, never reward/price data trusted by the client. Validation occurs on the server/database side. A successful scan is atomic: verify token, status, partner, expiry and stock; mark redeemed; record timestamp and actor; append audit event.

## Notifications and safety

Admins can create global or segmented notifications, including route closures, weather/safety warnings and challenge announcements. Route safety incidents can temporarily close a route without deleting it. Notification delivery adapters are outside the first slice, but records, audience and lifecycle are managed from Admin.

## Audit log

Sensitive actions append immutable audit events with actor user ID, action name, entity type, entity ID, before/after JSON where appropriate, request metadata and timestamp. Examples include route publication, permission changes, reward stock changes, moderation actions, balance corrections and redemption confirmation.

## Security constraints

- RLS enabled on every exposed table.
- Explicit Data API grants for new public tables.
- Authorization never relies on `raw_user_meta_data`.
- `SECURITY DEFINER` is avoided unless a narrowly scoped operation genuinely needs it; any such function lives outside the exposed schema, verifies `auth.uid()`, has a fixed search path, and receives explicit execute grants only.
- UPDATE policies include both `USING` and `WITH CHECK`.
- Server components/actions use the authenticated Supabase session; secret/service credentials are server-only and used only where the Auth Admin API is unavoidable.
- All critical mutations validate input and create an audit event.

## Error handling

Admin mutations return structured user-safe errors. Database constraint/RLS failures are not swallowed. Route publication rejects incomplete route data. Redemption rejects invalid, expired, already-used or wrong-partner tokens. UI presents retryable failures without losing unsaved form data where practical.

## Testing

- Vitest unit tests for pure authorization, validation and state transitions.
- Supabase pgTAP tests for roles/RLS, ledger invariants and one-time QR redemption behavior.
- Next.js typecheck/build in CI.
- Existing mobile and package tests remain green.
- Every schema migration resets cleanly with `supabase db reset`.

## Delivery sequence

1. Admin shell, Supabase SSR session handling and RBAC.
2. Complete route CMS, GPX/map content and publication.
3. Multimedia library.
4. Users and role administration.
5. Community moderation.
6. Gamification and olives ledger.
7. Partners, rewards and QR redemption.
8. Notifications/safety.
9. Dashboard metrics, audit views and final security/CI pass.

The route CMS is the first acceptance milestone; the full list above is the target for the Admin platform.