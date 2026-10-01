# Mágina Aventura Admin Platform Design

## Goal

Provide a protected control plane inside the existing Mágina Aventura monorepo so authorized staff can operate the app without changing mobile code. The Super Admin must be able to manage routes, maps, people, multimedia, public community/chat, gamification, olives, rewards/QR, notifications, safety, configuration and audit history.

## Repository placement

The repository remains a pnpm monorepo. The mobile product remains in `apps/mobile`; Admin lives in `apps/admin` and shares the existing route/domain schema rather than duplicating entities.

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
  tests/database/
```

## Runtime choice

Admin is a dependency-free static web application composed of native ES modules, HTML and CSS. This is intentional: the repository CI installs with `pnpm --frozen-lockfile`, and adding a separate web framework would introduce a lockfile/dependency migration unrelated to the control-plane requirements.

The browser talks to Supabase Auth, Data API and Storage through HTTPS using only the project URL and a publishable key. Secret/service-role credentials are never browser configuration. Sensitive behavior is enforced in RLS and narrowly scoped RPCs.

Node.js remains >= 22.13.0 and pnpm remains 10.15.0.

## Authentication and session lifecycle

Admin uses Supabase email/password Auth. Sessions are stored in `sessionStorage`, not persistent local storage. If an access token expires, the client uses the refresh token once and retries the failed request. Logout clears the local session immediately and attempts remote token revocation.

A signed-in account still has no Admin access unless it has a row in `user_admin_roles`.

## Roles and capabilities

- `super_admin`: every capability.
- `admin`: general operation except critical administrator-role management.
- `route_manager`: routes, map, discoveries and multimedia.
- `moderator`: users, public community/chat, moderation and audit.
- `partner`: rewards and redemptions scoped to its own almazara/partner.

Authorization is enforced at two layers: navigation/action availability in Admin and RLS/RPC checks in Supabase. UI hiding never substitutes for database authorization.

The system prevents revocation of the final `super_admin`.

## Navigation

Admin exposes:

1. Dashboard
2. Routes
3. Map & checkpoints
4. Discoveries
5. Multimedia
6. Users
7. Community
8. Moderation
9. Gamification
10. Olives ledger
11. Rewards
12. Partners / almazaras
13. QR redemptions
14. Notifications
15. Safety / incidents
16. Administrators
17. Audit log
18. Settings

## Route CMS

The canonical entities remain `routes`, `route_versions`, `route_geometries`, `checkpoints`, `discoveries` and `route_map_assets`.

Admin supports route creation, title/slug changes, versioned content editing, GPX import, PostGIS LineString geometry, checkpoints, discoveries, media associations, PMTiles metadata and lifecycle states:

```text
draft -> review -> published -> archived
```

Content and geometry edits create new versions. Editing a published route moves it back to `review`; a published route is never silently mutated in place. Publication validates that current content and geometry exist.

The visual route editor renders the geometry, checkpoints and discoveries and lets staff place new points directly on the trace. Coordinates are converted deterministically between route longitude/latitude and the editor SVG.

## Offline map assets

A route map asset belongs to a specific geometry version. Admin can register/update/delete PMTiles metadata including object key, HTTPS URL, style URL, byte size, checksum, zoom range and polygon bounds. A new geometry version does not overwrite the map asset associated with the previous geometry.

## Multimedia

Supabase Storage uses a private `media` bucket. `media_assets` stores title, MIME type, size, alt text, tags and archive status. `route_media` reuses an asset as hero/gallery/safety/discovery content.

Archiving is the default removal mechanism so existing route references are not broken. Storage and metadata permissions are enforced separately.

## Users

Admin exposes safe operational fields only: UUID/email, registration/sign-in dates, Admin roles, partner scope, moderation state, olive balance, redemption counts and community/chat activity summary. Passwords and Auth secrets never appear.

Moderation state is `active`, `warned` or `suspended`. Public-chat posting rejects suspended users.

## Public community and chat

Administration supports public community moderation and a public channel chat. Channels may be global, route-scoped or municipality-scoped. Messages can be visible, hidden or deleted and may be reported. Moderators can resolve/dismiss reports and every sensitive action is audited.

Private conversations are intentionally not exposed as a general Admin inbox.

## Gamification

Admin manages data-driven levels, badges, challenges, seasons and discovery collections. Seasons include XP/olive multipliers. Collections group discoveries and can grant completion XP/olive rewards.

Olives use an append-only `olive_transactions` ledger. Administrative corrections are additive transactions with actor and reason; direct balance overwrite is forbidden.

## Rewards and QR

Partners/almazaras manage rewards with olive price, stock, active status and validity. The redemption lifecycle is:

```text
reserved -> redeemed
        |-> expired
        |-> cancelled
```

Reservation and reversal use ledger transactions and stock updates. A redemption QR contains an opaque token; only its hash is persisted. Redemption is atomic and one-time.

Admin can validate a token manually or use camera/image QR reading when the browser supports `BarcodeDetector`. Camera scanning only fills the token; the database remains authoritative for final redemption.

## Notifications

Admin creates drafts and publishes notifications to:

- all users;
- followers of a route;
- followers of a municipality;
- an administrative role.

Device registrations and topic subscriptions are per-user. Publication fans out into `notification_deliveries`. Raw push tokens are never exposed through Admin. Queue-claim/complete functions are executable by `service_role` only, providing a safe integration boundary for a server/Edge Function dispatcher.

## Safety

Route safety incidents carry severity, lifecycle and optional time window. Authorized staff can create and resolve incidents without deleting route history.

## Settings

`app_settings` provides auditable JSON configuration and feature flags. Rows may be explicitly public-readable for the app or private to authorized Admin users. Initial settings include community, rewards, weather, maintenance mode, reward reservation duration and default checkpoint radius.

## Audit

Sensitive mutations append immutable events to `admin_audit_log` with actor, action, entity identity, before/after data and timestamp where available. Examples include route versions/publication, role changes, moderation, reward/canje operations, settings, PMTiles and user-state changes.

## Security requirements

- RLS enabled on exposed Admin tables.
- Explicit grants for Data API access.
- No authorization based on editable `user_metadata`.
- No secret/service-role key in `apps/admin`.
- `SECURITY DEFINER` only for narrow privileged operations and with `search_path=''` plus fully qualified relations.
- Sensitive RPCs verify capability/actor.
- Service-only notification queue functions are revoked from `anon` and `authenticated`.
- Storage bucket is private.
- QR tokens are opaque and stored hashed.
- Static hosting sends CSP, frame denial, nosniff and restrictive camera permissions.
- Runtime browser config is generated from deployment environment and rejects secret keys.

## Error handling

RLS/constraint/RPC failures are surfaced to the operator. Route publication fails on incomplete data; QR redemption fails on invalid/reused/expired tokens; configuration rejects invalid JSON; GPX import rejects invalid tracks; session expiry refreshes once and otherwise returns to login.

## Testing and CI

- Existing TypeScript/Vitest suites remain unchanged and green.
- Node tests cover Admin pure logic: permissions/navigation, redemption state machine, GPX parsing, route-editor coordinate transforms, QR parsing, media helpers and session refresh.
- Every Admin `.mjs` is syntax-checked in the root test command.
- pgTAP covers Admin tables, RLS presence and RPC contracts.
- GitHub Actions runs frozen install, typecheck, all tests, Expo Android prebuild, package-boundary checks, local Supabase start/reset and database tests.
- All migrations must rebuild successfully from an empty local database.

## Deployment boundary

Code completion does not create a paid/hosted Supabase project or merge into `main`. Live deployment requires an actual Supabase project, its public URL/publishable key, first-user bootstrap and hosting configuration. Those are explicit environment/account actions, not assumptions made by the feature branch.
