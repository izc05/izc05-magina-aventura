# Mágina Aventura Scalable Platform Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current Expo prototype into a scalable modular foundation with shared contracts, a route-detail vertical, a map abstraction and the first versioned Supabase/PostGIS schema.

**Architecture:** Keep one monorepo and one deployable product while enforcing package boundaries. Mobile UI consumes typed contracts and adapters; pure domain/geo logic never imports Expo, Supabase or MapLibre. Supabase/PostGIS becomes the authoritative data layer, while map rendering and large assets remain replaceable behind contracts.

**Tech Stack:** Node 22.13+, pnpm 10, TypeScript 6 strict, Expo SDK 57, React Native 0.86, Expo Router 57, Vitest, Supabase/PostgreSQL/PostGIS, MapLibre React Native in the later map-adapter task.

**Spec:** `docs/superpowers/specs/2026-09-15-scalable-platform-architecture-design.md`

## Global Constraints

- Do not work directly on `main`.
- Maintain `feat/foundation-v1` and PR #1 until this foundation phase is reviewed.
- The app opens in route discovery/catalogue, never directly in game-map mode.
- Mi Olivo and Mi Campo remain external products; only typed integration contracts may cross the boundary.
- Unverified Bedmar route data remains explicitly marked as development fixture data.
- Pure packages must not import Expo, React Native, Supabase or MapLibre.
- New domain behavior follows RED → GREEN → REFACTOR.
- TypeScript strict mode remains enabled.
- Public OpenStreetMap tile endpoints are not a production/offline dependency.
- Map-provider, backend-provider and asset-storage details stay behind adapters/contracts.
- Mobile-first reference width remains 390 px.

---

## Target File Structure

```text
apps/
  mobile/
    app/
      _layout.tsx
      index.tsx
      routes/[slug].tsx
      routes/[slug]/prepare.tsx
      adventure/[slug].tsx
    src/
      features/routes/
        fixtures.ts
        route-types.ts
        route-utils.ts
      map/
        map-types.ts
        DevelopmentMap.tsx
      theme/tokens.ts

packages/
  contracts/
    package.json
    tsconfig.json
    src/index.ts
    src/routes.ts
    src/integration-events.ts
  domain/
    package.json
    tsconfig.json
    src/index.ts
    src/routes/route-status.ts
    src/routes/route-status.test.ts
  geo/
    package.json
    tsconfig.json
    src/index.ts
    src/distance.ts
    src/distance.test.ts
  offline-sync/
    package.json
    tsconfig.json
    src/index.ts
    src/idempotency.ts
    src/idempotency.test.ts

supabase/
  migrations/
    202609150001_extensions.sql
    202609150002_routes.sql
    202609150003_route_security.sql
  seed/
    development.sql
```

---

### Task 1: Shared Contracts Package

**Files:**
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/contracts/src/routes.ts`
- Create: `packages/contracts/src/integration-events.ts`
- Modify: `pnpm-workspace.yaml` only if required by actual workspace resolution.

**Interfaces:**
- Produces: `RouteSummary`, `RouteDetail`, `RouteDifficulty`, `RewardPreview`, `RewardEarnedEvent`.
- Consumed later by mobile, Supabase adapters, admin and Mi Olivo integration.

- [ ] **Step 1: Create the package manifest**

```json
{
  "name": "@magina-aventura/contracts",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "~6.0.3"
  }
}
```

- [ ] **Step 2: Define route contracts**

```ts
export type RouteDifficulty = 'easy' | 'moderate' | 'hard';

export interface RewardPreview {
  xp: number;
  olives: number;
  discoveries: number;
}

export interface RouteSummary {
  id: string;
  slug: string;
  title: string;
  municipalityId: string;
  municipalityName: string;
  distanceKm: number;
  elevationGainM: number;
  durationMinutes: number;
  difficulty: RouteDifficulty;
  rewardPreview: RewardPreview;
  contentVersion: number;
}

export interface RouteDetail extends RouteSummary {
  description: string;
  safetyNotes: string[];
  startLatitude: number;
  startLongitude: number;
  geometryVersion: number;
  offlineAvailable: boolean;
  developmentFixture: boolean;
}
```

- [ ] **Step 3: Define the external reward event contract**

```ts
export interface RewardEarnedEvent {
  eventId: string;
  eventType: 'reward.earned';
  source: 'magina-aventura';
  userId: string;
  activityId: string;
  xp: number;
  olives: number;
  achievementIds: string[];
  occurredAt: string;
}
```

- [ ] **Step 4: Export the contracts from `src/index.ts`**

```ts
export * from './routes';
export * from './integration-events';
```

- [ ] **Step 5: Run package typecheck**

Run: `pnpm --filter @magina-aventura/contracts typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/contracts
git commit -m "feat: add shared platform contracts"
```

---

### Task 2: Pure Route Publication Domain Rule

**Files:**
- Create: `packages/domain/package.json`
- Create: `packages/domain/tsconfig.json`
- Create: `packages/domain/src/index.ts`
- Create: `packages/domain/src/routes/route-status.test.ts`
- Create: `packages/domain/src/routes/route-status.ts`

**Interfaces:**
- Produces: `RoutePublicationStatus`, `canRouteBeStarted(status)`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { canRouteBeStarted } from './route-status';

describe('canRouteBeStarted', () => {
  it('allows only published routes to start an adventure', () => {
    expect(canRouteBeStarted('draft')).toBe(false);
    expect(canRouteBeStarted('review')).toBe(false);
    expect(canRouteBeStarted('published')).toBe(true);
    expect(canRouteBeStarted('archived')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm --filter @magina-aventura/domain test -- route-status.test.ts`
Expected: FAIL because `route-status.ts`/`canRouteBeStarted` does not exist.

- [ ] **Step 3: Implement the minimum domain rule**

```ts
export type RoutePublicationStatus = 'draft' | 'review' | 'published' | 'archived';

export function canRouteBeStarted(status: RoutePublicationStatus): boolean {
  return status === 'published';
}
```

- [ ] **Step 4: Export it**

```ts
export * from './routes/route-status';
```

- [ ] **Step 5: Run test and typecheck**

Run:
`pnpm --filter @magina-aventura/domain test -- route-status.test.ts`
`pnpm --filter @magina-aventura/domain typecheck`
Expected: PASS / PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/domain
git commit -m "feat: add route publication domain rule"
```

---

### Task 3: Pure Geo Distance Primitive

**Files:**
- Create: `packages/geo/package.json`
- Create: `packages/geo/tsconfig.json`
- Create: `packages/geo/src/index.ts`
- Create: `packages/geo/src/distance.test.ts`
- Create: `packages/geo/src/distance.ts`

**Interfaces:**
- Produces: `GeoPoint`, `distanceMeters(a, b)`.
- Later used for checkpoints, discoveries, route progress and off-route detection.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { distanceMeters } from './distance';

describe('distanceMeters', () => {
  it('returns zero for the same point', () => {
    const point = { latitude: 37.823, longitude: -3.413 };
    expect(distanceMeters(point, point)).toBe(0);
  });

  it('returns approximately 111.2 km for one degree of latitude', () => {
    const value = distanceMeters(
      { latitude: 37, longitude: -3 },
      { latitude: 38, longitude: -3 },
    );
    expect(value).toBeGreaterThan(111_000);
    expect(value).toBeLessThan(111_400);
  });
});
```

- [ ] **Step 2: Verify RED**

Run: `pnpm --filter @magina-aventura/geo test -- distance.test.ts`
Expected: FAIL because implementation is absent.

- [ ] **Step 3: Implement Haversine distance**

```ts
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_METERS = 6_371_008.8;

function radians(value: number): number {
  return (value * Math.PI) / 180;
}

export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  if (a.latitude === b.latitude && a.longitude === b.longitude) return 0;

  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const deltaLat = radians(b.latitude - a.latitude);
  const deltaLon = radians(b.longitude - a.longitude);

  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}
```

- [ ] **Step 4: Export and verify GREEN**

Run: `pnpm --filter @magina-aventura/geo test -- distance.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/geo
git commit -m "feat: add geospatial distance primitive"
```

---

### Task 4: Offline Idempotency Primitive

**Files:**
- Create: `packages/offline-sync/package.json`
- Create: `packages/offline-sync/tsconfig.json`
- Create: `packages/offline-sync/src/index.ts`
- Create: `packages/offline-sync/src/idempotency.test.ts`
- Create: `packages/offline-sync/src/idempotency.ts`

**Interfaces:**
- Produces: `SyncOperation`, `deduplicateSyncOperations(operations)`.

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it } from 'vitest';
import { deduplicateSyncOperations } from './idempotency';

describe('deduplicateSyncOperations', () => {
  it('keeps the first occurrence of an idempotency key', () => {
    const result = deduplicateSyncOperations([
      { idempotencyKey: 'activity:1:finish', kind: 'activity.finish' },
      { idempotencyKey: 'activity:1:finish', kind: 'activity.finish' },
      { idempotencyKey: 'activity:1:checkpoint:2', kind: 'checkpoint.reached' },
    ]);

    expect(result.map((item) => item.idempotencyKey)).toEqual([
      'activity:1:finish',
      'activity:1:checkpoint:2',
    ]);
  });
});
```

- [ ] **Step 2: Verify RED**

Run: `pnpm --filter @magina-aventura/offline-sync test -- idempotency.test.ts`
Expected: FAIL because implementation is absent.

- [ ] **Step 3: Implement minimum deduplication**

```ts
export interface SyncOperation {
  idempotencyKey: string;
  kind: string;
}

export function deduplicateSyncOperations<T extends SyncOperation>(operations: T[]): T[] {
  const seen = new Set<string>();
  return operations.filter((operation) => {
    if (seen.has(operation.idempotencyKey)) return false;
    seen.add(operation.idempotencyKey);
    return true;
  });
}
```

- [ ] **Step 4: Verify GREEN**

Run: `pnpm --filter @magina-aventura/offline-sync test -- idempotency.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/offline-sync
git commit -m "feat: add offline sync idempotency primitive"
```

---

### Task 5: Migrate Mobile Route Fixture to Shared Contract

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/src/features/routes/route-types.ts`
- Modify: `apps/mobile/src/features/routes/fixtures.ts`
- Modify: `apps/mobile/src/features/routes/route-utils.ts`
- Test: `apps/mobile/src/features/routes/route-utils.test.ts`

**Interfaces:**
- Consumes: `RouteDetail`, `RouteDifficulty` from `@magina-aventura/contracts`.
- Produces: mobile route fixtures compatible with backend contracts.

- [ ] **Step 1: Add workspace dependency**

In `apps/mobile/package.json`:

```json
"@magina-aventura/contracts": "workspace:*"
```

- [ ] **Step 2: Change `route-types.ts` into a compatibility export**

```ts
export type {
  RouteDetail as AdventureRouteCard,
  RouteDifficulty,
} from '@magina-aventura/contracts';
```

- [ ] **Step 3: Update fixture shape**

Use these development-only values:

```ts
{
  id: 'dev-bedmar-cuadros-001',
  slug: 'sendero-de-cuadros-dev',
  title: 'Sendero de Cuadros',
  municipalityId: 'dev-bedmar-garciez',
  municipalityName: 'Bedmar y Garcíez',
  distanceKm: 8.7,
  elevationGainM: 412,
  durationMinutes: 150,
  difficulty: 'moderate',
  rewardPreview: { xp: 750, olives: 120, discoveries: 7 },
  contentVersion: 1,
  description: 'Contenido de desarrollo pendiente de validación editorial.',
  safetyNotes: ['Datos de seguridad pendientes de validación de campo.'],
  startLatitude: 37.823,
  startLongitude: -3.413,
  geometryVersion: 1,
  offlineAvailable: false,
  developmentFixture: true
}
```

- [ ] **Step 4: Update route formatter tests to new names without changing behavior**

Run: `pnpm --filter @magina-aventura/mobile test`
Expected: PASS.

- [ ] **Step 5: Run mobile typecheck**

Run: `pnpm --filter @magina-aventura/mobile typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile
git commit -m "refactor: consume shared route contracts"
```

---

### Task 6: Route Detail Navigation Vertical

**Files:**
- Modify: `apps/mobile/app/index.tsx`
- Create: `apps/mobile/app/routes/[slug].tsx`
- Create: `apps/mobile/app/routes/[slug]/prepare.tsx`
- Modify: `apps/mobile/app/_layout.tsx` only if route registration requires explicit stack options.

**Interfaces:**
- Consumes: `getDevelopmentRouteBySlug(slug)`.
- Produces navigation: `/` → `/routes/:slug` → `/routes/:slug/prepare`.

- [ ] **Step 1: Make the route card navigate to detail**

Use Expo Router:

```ts
import { router } from 'expo-router';

router.push(`/routes/${route.slug}`);
```

- [ ] **Step 2: Implement detail-screen missing-route behavior**

If the slug is unknown, render:

```text
Ruta no disponible
No encontramos esta versión de la ruta.
Volver a rutas
```

The back action must call `router.replace('/')`.

- [ ] **Step 3: Implement route-detail content**

Render from `RouteDetail`:

- municipality;
- route title;
- development-fixture badge when true;
- distance;
- elevation gain;
- duration;
- difficulty;
- reward preview;
- map slot;
- safety notes;
- `Preparar aventura` CTA.

No historical/tourism facts are added here.

- [ ] **Step 4: Implement preparation screen**

Render four readiness rows:

```text
Ubicación             Pendiente
GPS en segundo plano  Pendiente
Ruta offline           No disponible
Seguridad              Revisar
```

CTA text: `Continuar en modo desarrollo`.

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/app
git commit -m "feat: add route detail and preparation flow"
```

---

### Task 7: Map Rendering Boundary Before MapLibre

**Files:**
- Create: `apps/mobile/src/map/map-types.ts`
- Create: `apps/mobile/src/map/DevelopmentMap.tsx`
- Modify: `apps/mobile/app/routes/[slug].tsx`

**Interfaces:**
- Produces: `RouteMapProps`, `DevelopmentMap`.
- Later MapLibre implementation must satisfy the same input contract.

- [ ] **Step 1: Define map component contract**

```ts
export interface RouteMapCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteMapProps {
  start: RouteMapCoordinate;
  routeId: string;
  geometryVersion: number;
  developmentMode: boolean;
}
```

- [ ] **Step 2: Build `DevelopmentMap`**

The component must visibly render:

```text
MAPA DE DESARROLLO
MapLibre se conectará a la geometría versionada de esta ruta.
```

and display `routeId` and `geometryVersion` in development-only small text.

- [ ] **Step 3: Replace any free-form map placeholder in route detail**

Use:

```tsx
<DevelopmentMap
  start={{ latitude: route.startLatitude, longitude: route.startLongitude }}
  routeId={route.id}
  geometryVersion={route.geometryVersion}
  developmentMode={route.developmentFixture}
/>
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/map apps/mobile/app/routes
git commit -m "refactor: introduce map rendering boundary"
```

---

### Task 8: Supabase/PostGIS Foundation Migrations

**Files:**
- Create: `supabase/migrations/202609150001_extensions.sql`
- Create: `supabase/migrations/202609150002_routes.sql`
- Create: `supabase/migrations/202609150003_route_security.sql`
- Create: `supabase/seed/development.sql`

**Interfaces:**
- Produces DB tables: `municipalities`, `routes`, `route_versions`, `route_geometries`, `checkpoints`, `discoveries`.

- [ ] **Step 1: Enable required extensions**

`202609150001_extensions.sql`:

```sql
create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;
```

- [ ] **Step 2: Create municipality and route tables**

`202609150002_routes.sql` must include:

```sql
create table public.municipalities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.routes (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities(id),
  slug text not null unique,
  title text not null,
  status text not null check (status in ('draft','review','published','archived')),
  current_content_version integer not null default 1 check (current_content_version > 0),
  current_geometry_version integer not null default 1 check (current_geometry_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.route_versions (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  version integer not null check (version > 0),
  description text not null,
  safety_notes jsonb not null default '[]'::jsonb,
  distance_km numeric(8,3) not null check (distance_km >= 0),
  elevation_gain_m integer not null check (elevation_gain_m >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  difficulty text not null check (difficulty in ('easy','moderate','hard')),
  reward_xp integer not null default 0 check (reward_xp >= 0),
  reward_olives integer not null default 0 check (reward_olives >= 0),
  discovery_count integer not null default 0 check (discovery_count >= 0),
  offline_available boolean not null default false,
  development_fixture boolean not null default false,
  created_at timestamptz not null default now(),
  unique(route_id, version)
);

create table public.route_geometries (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  version integer not null check (version > 0),
  geometry extensions.geometry(LineString, 4326) not null,
  start_point extensions.geometry(Point, 4326) not null,
  created_at timestamptz not null default now(),
  unique(route_id, version)
);

create index route_geometries_geometry_gix
  on public.route_geometries using gist (geometry);
```

- [ ] **Step 3: Create checkpoint and discovery tables**

```sql
create table public.checkpoints (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  name text not null,
  position extensions.geometry(Point, 4326) not null,
  trigger_radius_m integer not null check (trigger_radius_m between 5 and 500),
  required boolean not null default false,
  active boolean not null default true
);

create index checkpoints_position_gix
  on public.checkpoints using gist (position);

create table public.discoveries (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references public.routes(id) on delete set null,
  category text not null check (category in ('flora','fauna','heritage','olive','tradition','landscape')),
  name text not null,
  position extensions.geometry(Point, 4326) not null,
  trigger_radius_m integer not null check (trigger_radius_m between 5 and 500),
  reward_xp integer not null default 0 check (reward_xp >= 0),
  reward_olives integer not null default 0 check (reward_olives >= 0),
  active boolean not null default true
);

create index discoveries_position_gix
  on public.discoveries using gist (position);
```

- [ ] **Step 4: Add RLS baseline**

`202609150003_route_security.sql`:

```sql
alter table public.municipalities enable row level security;
alter table public.routes enable row level security;
alter table public.route_versions enable row level security;
alter table public.route_geometries enable row level security;
alter table public.checkpoints enable row level security;
alter table public.discoveries enable row level security;

create policy "public can read active municipalities"
  on public.municipalities for select
  using (active = true);

create policy "public can read published routes"
  on public.routes for select
  using (status = 'published');

create policy "public can read versions of published routes"
  on public.route_versions for select
  using (exists (
    select 1 from public.routes r
    where r.id = route_versions.route_id and r.status = 'published'
  ));

create policy "public can read geometries of published routes"
  on public.route_geometries for select
  using (exists (
    select 1 from public.routes r
    where r.id = route_geometries.route_id and r.status = 'published'
  ));

create policy "public can read active checkpoints on published routes"
  on public.checkpoints for select
  using (active = true and exists (
    select 1 from public.routes r
    where r.id = checkpoints.route_id and r.status = 'published'
  ));

create policy "public can read active discoveries"
  on public.discoveries for select
  using (active = true);
```

- [ ] **Step 5: Add development seed with explicit fixture labelling**

`development.sql` inserts one municipality and one draft development route only. It must not insert unverifiable tourism facts. The route status remains `draft`, and `development_fixture = true`.

- [ ] **Step 6: Validate migration syntax with Supabase CLI when available**

Run: `supabase db reset`
Expected: all migrations apply without SQL errors and the development seed loads.

If Supabase CLI is not installed in the execution environment, the task is not complete; install/use the project-approved CLI before claiming success.

- [ ] **Step 7: Commit**

```bash
git add supabase
git commit -m "feat: add PostGIS route foundation schema"
```

---

### Task 9: Repository-Wide Quality Gate

**Files:**
- Modify: root `package.json` only if workspace tests do not already aggregate correctly.
- Modify: `.github/workflows/ci.yml`.

**Interfaces:**
- Produces one CI `verify` gate covering typecheck + unit tests.

- [ ] **Step 1: Ensure root scripts aggregate all packages**

Required behavior:

```json
{
  "scripts": {
    "typecheck": "pnpm -r --if-present typecheck",
    "test": "pnpm -r --if-present test"
  }
}
```

- [ ] **Step 2: Ensure CI runs both gates**

```yaml
- name: Typecheck
  run: pnpm typecheck

- name: Unit tests
  run: pnpm test
```

- [ ] **Step 3: Run locally/in CI**

Run:
`pnpm typecheck`
`pnpm test`

Expected: PASS / PASS.

- [ ] **Step 4: Verify no package imports infrastructure into pure packages**

Run:

```bash
grep -R "from 'expo\|from \"expo\|@supabase\|maplibre\|react-native" packages/domain packages/geo packages/contracts packages/offline-sync
```

Expected: no matches.

- [ ] **Step 5: Commit**

```bash
git add package.json .github/workflows/ci.yml
git commit -m "ci: enforce scalable foundation quality gates"
```

---

## Exit Criteria

This plan is complete only when:

1. `packages/contracts`, `domain`, `geo` and `offline-sync` exist and typecheck independently;
2. new domain/geo/offline behavior has tests that were observed failing before implementation;
3. mobile route fixtures consume the shared contract;
4. `/` navigates to route detail and preparation screens;
5. route detail consumes a map component contract rather than a provider-specific implementation;
6. Supabase/PostGIS migrations create versioned route geometry, checkpoints and discoveries with RLS enabled;
7. development data remains explicitly non-production;
8. `pnpm typecheck` is green;
9. `pnpm test` is green;
10. pure packages contain no Expo/React Native/Supabase/MapLibre imports;
11. PR #1 remains Draft until review; `main` is unchanged.

## Next Plans After This One

After this foundation is green, execute separate plans in this order:

1. `MapLibre + route geometry + PMTiles/offline map package`;
2. `Activity Engine + deterministic GPS replay`;
3. `Native background location + crash recovery`;
4. `Checkpoint/discovery engine`;
5. `Server validation + reward ledger/outbox`;
6. `Collections + challenges + rankings`;
7. `Admin publishing/moderation`;
8. `Bedmar field QA and hardening`.
