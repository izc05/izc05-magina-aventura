# Mágina Aventura — Scalable Platform Architecture Design

## Status

Approved on 2026-09-15.

## Goal

Build Mágina Aventura as a modular, scalable product that can start on free tiers, support the Bedmar pilot, expand across Sierra Mágina, and later move selected workloads to paid infrastructure without rewriting the application.

## Architectural style

Use a **modular monolith with explicit contracts**, not microservices at V1.

The system must be easy to develop as one product while keeping clear boundaries so individual capabilities can be extracted later if scale justifies it.

Core rule:

> Large product areas never depend on each other's internals. They communicate through typed contracts, APIs, durable events or shared pure-domain packages.

## Product topology

```text
Mágina Aventura
│
├── apps/
│   ├── mobile/        Expo / React Native app
│   ├── web/           public web / installable web experience
│   └── admin/         trusted operations and content management
│
├── packages/
│   ├── domain/        pure business entities and invariants
│   ├── activity-engine/ GPS activity lifecycle and metrics
│   ├── geo/           route geometry, proximity, matching, spatial helpers
│   ├── game-engine/   XP, achievements, challenges, rankings
│   ├── contracts/     public internal/external event and API types
│   ├── api-client/    typed application API client
│   ├── offline-sync/  local queue, retries, conflict/idempotency rules
│   └── ui/            reusable visual components/tokens where sharing is real
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── policies/
│   └── seed/
│
└── infrastructure/
    ├── cloudflare/
    ├── r2/
    ├── staging/
    └── monitoring/
```

## Infrastructure strategy

### Public beta core

Use **Supabase Free** for:

- Auth;
- PostgreSQL;
- PostGIS;
- route metadata and spatial data;
- checkpoints and discoveries;
- activities and validation state;
- challenge/ranking/reward state;
- Row Level Security;
- server-side functions where required.

### Cloudflare

Use Cloudflare for:

- DNS and TLS;
- public web delivery;
- CDN/cache;
- Cloudflare R2 for photographs, GPX, GeoJSON, PMTiles and offline packages;
- Cloudflare Tunnel for staging/internal services when useful;
- edge endpoints only when they provide a measurable benefit.

### Mini PC

Use the user's mini PC as **staging/laboratory**, not as the only public production backend during V1.

Suitable workloads:

- staging deployments;
- GPX/PMTiles generation;
- development jobs;
- backups;
- diagnostics;
- internal tools;
- scheduled processing that can tolerate temporary unavailability.

A domestic outage, ISP issue or hardware failure must not make the public beta unusable.

### Upgrade path

The product must support later migration of selected workloads to:

- Supabase Pro;
- a VPS;
- self-hosted PostgreSQL/PostGIS;
- dedicated workers/services.

Clients must not depend directly on deployment-specific infrastructure details.

## Data ownership

### Supabase/PostGIS owns

- users/profiles;
- municipalities;
- routes and route versions;
- route geometries;
- checkpoints;
- discoveries;
- activities;
- validation status;
- achievements/challenges/seasons;
- ranking score snapshots;
- reward ledger;
- integration outbox.

### R2 owns large immutable/versionable assets

- route photographs;
- discovery photographs;
- GPX;
- GeoJSON exports;
- PMTiles/vector tile bundles;
- offline route packages;
- badges/graphic assets when not bundled with the app.

The database stores metadata, version, checksum and object key/URL, not large binary payloads.

## Maps architecture

Use **MapLibre** as the rendering layer.

Do not make production or offline functionality depend on public OpenStreetMap tile endpoints.

```text
PostGIS route/POI data
        │
        ├── API/spatial queries
        │
        └── published map artifacts
                 ↓
          PMTiles/vector tiles
                 ↓
          Cloudflare R2/CDN
                 ↓
        MapLibre mobile + web
```

Map-provider details must be hidden behind a map-source configuration boundary.

## Route scalability

Municipalities are data, not code branches.

Adding Jimena, Albanchez, Torres or another municipality must not require new feature logic.

Representative data model:

```text
municipalities
routes
route_versions
route_geometry
route_media
checkpoints
discoveries
collections
challenge_rules
reward_rules
```

All long-lived entities use stable UUIDs.

## Activity engine boundary

The activity engine is a pure product subsystem and does not call Supabase directly.

```text
GPS provider
   ↓
activity-engine
   ↓
local activity store
   ↓
offline-sync
   ↓
typed API
   ↓
server validation
```

It owns:

- lifecycle: DRAFT → ACTIVE → PAUSED → FINISHED;
- track-point acceptance/filtering;
- elapsed/moving time;
- distance;
- elevation metrics;
- route progress input/output;
- checkpoint/discovery events;
- recovery state.

Infrastructure adapters persist/sync its outputs.

## Offline-first rule

An already-downloaded route must remain usable without network connectivity.

Offline package includes versioned:

- route geometry;
- essential route metadata;
- required checkpoints;
- discovery trigger metadata required in the field;
- safety information;
- map package/source reference;
- content version/checksum.

Activities are persisted incrementally on-device. Sync is idempotent and retryable.

## Game engine boundary

Game logic is data-driven and server-authoritative for final value.

Never hard-code route-specific reward logic into UI or navigation.

Use configurable concepts such as:

```text
route_reward_rules
achievement_rules
challenge_rules
season_rules
leaderboard_score_versions
```

The client may display provisional progress. Final XP, olives, achievements and ranking value are finalized after validation.

## Mi Olivo integration

Mágina Aventura remains independent from Mi Olivo.

It emits durable reward events through an outbox pattern.

```json
{
  "eventType": "reward.earned",
  "source": "magina-aventura",
  "userId": "uuid",
  "activityId": "uuid",
  "xp": 530,
  "olives": 75,
  "achievementIds": ["uuid"]
}
```

A future consumer can transfer olives/rewards to Mi Olivo without creating a runtime dependency between the applications.

## Web, mobile and admin

### Shared code

Share:

- domain types;
- validation schemas;
- API contracts;
- geo algorithms where platform-neutral;
- game rules;
- design tokens;
- formatting helpers.

### Native-only code

Keep native:

- background GPS;
- device permissions;
- Health Connect/HealthKit integrations;
- native MapLibre configuration;
- local activity persistence adapters;
- notifications/device capabilities.

### Web/admin-only code

Keep web-specific:

- content administration;
- route publishing/version review;
- moderation tools;
- desktop analytics;
- operational dashboards.

## Figma as visual source of truth

Figma defines the visual system before screens diverge.

Structure:

```text
FOUNDATIONS
  Color
  Typography
  Spacing
  Radius
  Shadows
  Grid
  Motion

COMPONENTS
  Button
  Chip
  RouteCard
  StatCard
  RewardBadge
  XPProgress
  DiscoveryMarker
  CheckpointMarker
  HUD
  BottomSheet
  BottomNav
  MapControls

PATTERNS
  Route catalogue
  Route detail
  Adventure preparation
  Active adventure
  Discovery
  Activity result
  Collections
  Challenges
  Ranking
  Profile
```

Code consumes matching semantic tokens. Components may evolve independently, but token names and behavioral states stay aligned with Figma.

The current authenticated Figma plan is Starter with a View seat. Until an editable seat/file is available, the repository's token contract remains authoritative and Figma work is prepared but not treated as editable source-of-truth output.

## Design token rule

No new production component should introduce arbitrary colors, spacing or radii when a semantic token exists.

Initial semantic families:

```text
color.background.*
color.surface.*
color.text.*
color.brand.*
color.reward.*
color.status.*
space.*
radius.*
type.*
shadow.*
motion.*
```

Existing V1 primitive tokens may be migrated incrementally into these semantic families.

## Payments

Payments are explicitly outside the core adventure engine.

A future billing module may integrate Stripe, Redsys, Bizum or another provider through a payment contract. Routes, GPS, activity validation, XP and reward logic must remain operationally independent from payment-provider implementation.

## Scaling triggers

Do not introduce microservices until one of these becomes measurable:

- independent scaling requirements;
- operational isolation requirements;
- deployment cadence conflict;
- unacceptable database contention;
- queue/job workload that harms interactive traffic;
- security boundary requiring separate service ownership.

Before those triggers, keep one repository and clear module boundaries.

## Quality gates

Every production behavior requires:

- failing test first for new domain behavior;
- TypeScript strict mode;
- CI typecheck and unit tests;
- idempotent sync/reward paths;
- explicit fixture/development labels for unverified route data;
- no merge to `main` while required CI is red;
- real Android field QA before V1 closure.

## Initial implementation order

1. stabilize monorepo/package boundaries;
2. formalize contracts/domain packages;
3. create route detail/preparation/navigation vertical;
4. add MapLibre abstraction and map screen;
5. create Supabase/PostGIS migrations;
6. connect routes/checkpoints/discoveries;
7. implement offline package contract;
8. build activity-engine with deterministic track replay tests;
9. add native foreground/background location adapters;
10. implement checkpoint/discovery detection;
11. server validation and reward finalization;
12. collections/challenges/ranking;
13. admin publishing/moderation;
14. Bedmar field QA;
15. payments only after the core product works.
