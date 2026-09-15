# MapLibre + GPX + Offline V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the development map placeholder with a MapLibre-based route map, add deterministic GPX-to-GeoJSON import/versioning, and make a versioned PMTiles route package downloadable for offline use without inventing production Cuadros data.

**Architecture:** Pure packages define route/map/offline contracts and deterministic geometry/import logic; Supabase/PostGIS stores authoritative versioned geometry and map-asset metadata; the Expo mobile app renders through a MapLibre adapter and downloads PMTiles explicitly with `expo-file-system`. PMTiles uses `pmtiles://https://...` while online and `pmtiles://file://...` after an explicit verified local download; MapLibre `OfflineManager` is intentionally not used for PMTiles archives.

**Tech Stack:** Node 22.13+, pnpm 10.15, TypeScript 6, Expo SDK 57 / React Native 0.86, Expo Router, MapLibre React Native, Expo FileSystem, Vitest, Supabase CLI/PostgreSQL 17/PostGIS, pgTAP, `fast-xml-parser`, Cloudflare R2-compatible HTTPS object storage.

**Spec:** `docs/superpowers/specs/2026-09-15-maplibre-gpx-offline-design.md`

## Global Constraints

- Work only on `feat/map-offline-v1`; do not modify `main`.
- Keep `packages/contracts`, `packages/domain`, `packages/geo` and `packages/offline-sync` infrastructure-free: no Expo, React Native, Supabase or MapLibre imports.
- Keep Bedmar/Cuadros route data marked as development unless geometry/content is backed by a verified source.
- Do not ship fabricated Cuadros GPX coordinates.
- MapLibre runs through an Expo custom development build; Expo Go is not an acceptance environment.
- PMTiles downloads are explicit app-file downloads; do not use MapLibre `OfflineManager` for PMTiles.
- Object-storage keys are immutable and versioned by route ID + geometry version.
- No Cloudflare/Supabase secret is committed to Git.
- New behavior follows RED -> GREEN -> refactor with the failing test observed before implementation.
- Root quality gates remain `pnpm typecheck`, `pnpm test`, pure-package boundary check and local Supabase reset.

---

## File Structure Locked by This Plan

```text
packages/
  contracts/src/
    routes.ts                      # existing route metadata contracts
    route-map.ts                   # map payload + offline manifest contracts
    index.ts                       # exports route-map
  geo/src/
    bounds.ts                      # deterministic bbox calculation
    route-line.ts                  # LineString validation/helpers
    bounds.test.ts
    route-line.test.ts
  route-import/
    package.json
    tsconfig.json
    src/
      gpx.ts                       # GPX XML -> normalized route geometry
      gpx.test.ts
      index.ts

supabase/
  migrations/
    202609150004_route_map_assets.sql
    202609150005_route_map_payload.sql
  tests/database/
    route_map_assets_test.sql
    route_map_payload_test.sql

apps/mobile/
  app.json                         # MapLibre config plugin
  package.json                     # MapLibre + FileSystem dependencies
  src/map/
    map-types.ts                   # mobile map adapter props
    map-style.ts                   # remote/local PMTiles style/source builder
    map-style.test.ts
    RouteMap.tsx                   # real MapLibre adapter
    DevelopmentMap.tsx             # removed when RouteMap is integrated
  src/offline/
    route-package-port.ts          # testable storage/download boundary
    route-package-store.ts         # orchestrates manifest -> local package
    route-package-store.test.ts
    expo-route-package-port.ts     # Expo FileSystem implementation
  src/features/routes/
    route-map-repository.ts        # data boundary for RouteMapPayload
    development-route-map-repository.ts
  app/routes/[slug].tsx            # real map + offline state CTA
  app/routes/[slug]/prepare.tsx    # requires package readiness when selected

.github/workflows/ci.yml            # pgTAP + Expo native config generation gates

docs/architecture/
  map-assets-r2.md                  # immutable keys, headers, CORS, no secrets
```

---

### Task 1: Shared Route Map Contracts + Pure Geometry Helpers

**Files:**
- Create: `packages/contracts/src/route-map.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/geo/src/bounds.ts`
- Create: `packages/geo/src/bounds.test.ts`
- Create: `packages/geo/src/route-line.ts`
- Create: `packages/geo/src/route-line.test.ts`
- Modify: `packages/geo/src/index.ts`

**Interfaces:**
- Produces: `GeoJsonPosition`, `RouteLineFeature`, `RouteMapCheckpoint`, `RouteMapDiscoveryHint`, `RouteMapPayload`, `OfflineMapAsset`, `OfflineRoutePackageManifest`.
- Produces: `calculateRouteBounds(positions): RouteBounds`.
- Produces: `validateRouteLineFeature(feature): RouteLineFeature`.

- [ ] **Step 1: Add failing bounds test**

```ts
import { describe, expect, it } from 'vitest';
import { calculateRouteBounds } from './bounds';

describe('calculateRouteBounds', () => {
  it('returns west south east north from lon/lat positions', () => {
    expect(calculateRouteBounds([
      [-3.50, 37.72],
      [-3.42, 37.69],
      [-3.46, 37.76],
    ])).toEqual([-3.50, 37.69, -3.42, 37.76]);
  });

  it('rejects fewer than two coordinates', () => {
    expect(() => calculateRouteBounds([[-3.5, 37.7]])).toThrow('Route requires at least two coordinates');
  });
});
```

- [ ] **Step 2: Run bounds test and observe RED**

Run:

```bash
pnpm --filter @magina-aventura/geo test -- src/bounds.test.ts
```

Expected: FAIL because `./bounds` does not exist.

- [ ] **Step 3: Define contracts**

`packages/contracts/src/route-map.ts`:

```ts
export type GeoJsonPosition = readonly [longitude: number, latitude: number];
export type RouteBounds = readonly [west: number, south: number, east: number, north: number];

export interface RouteLineFeature {
  type: 'Feature';
  properties: {
    routeId: string;
    geometryVersion: number;
  };
  geometry: {
    type: 'LineString';
    coordinates: GeoJsonPosition[];
  };
}

export interface RouteMapCheckpoint {
  id: string;
  name: string;
  position: GeoJsonPosition;
  triggerRadiusM: number;
  required: boolean;
}

export interface RouteMapDiscoveryHint {
  id: string;
  category: 'flora' | 'fauna' | 'heritage' | 'olive' | 'tradition' | 'landscape';
  position: GeoJsonPosition;
  triggerRadiusM: number;
}

export interface RouteMapPayload {
  routeId: string;
  slug: string;
  geometryVersion: number;
  line: RouteLineFeature;
  start: GeoJsonPosition;
  bounds: RouteBounds;
  checkpoints: RouteMapCheckpoint[];
  discoveryHints: RouteMapDiscoveryHint[];
}

export interface OfflineMapAsset {
  id: string;
  objectKey: string;
  remoteUrl: string;
  byteSize: number;
  md5: string | null;
  minZoom: number;
  maxZoom: number;
  bounds: RouteBounds;
}

export interface OfflineRoutePackageManifest {
  manifestVersion: 1;
  routeId: string;
  contentVersion: number;
  geometryVersion: number;
  map: OfflineMapAsset;
}
```

Export it from `packages/contracts/src/index.ts`.

- [ ] **Step 4: Implement bounds helper**

```ts
import type { GeoJsonPosition, RouteBounds } from '@magina-aventura/contracts';

export function calculateRouteBounds(positions: readonly GeoJsonPosition[]): RouteBounds {
  if (positions.length < 2) throw new Error('Route requires at least two coordinates');

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const [longitude, latitude] of positions) {
    west = Math.min(west, longitude);
    east = Math.max(east, longitude);
    south = Math.min(south, latitude);
    north = Math.max(north, latitude);
  }

  return [west, south, east, north];
}
```

- [ ] **Step 5: Add failing route-line validation test**

```ts
import { describe, expect, it } from 'vitest';
import { validateRouteLineFeature } from './route-line';

describe('validateRouteLineFeature', () => {
  it('rejects an invalid latitude', () => {
    expect(() => validateRouteLineFeature({
      type: 'Feature',
      properties: { routeId: 'route-1', geometryVersion: 1 },
      geometry: { type: 'LineString', coordinates: [[-3.5, 91], [-3.4, 37.7]] },
    })).toThrow('Invalid latitude');
  });
});
```

- [ ] **Step 6: Run validation test and observe RED**

Run:

```bash
pnpm --filter @magina-aventura/geo test -- src/route-line.test.ts
```

Expected: FAIL because `./route-line` does not exist.

- [ ] **Step 7: Implement line validation**

Validate two-or-more coordinates and longitude/latitude ranges; return the same typed feature after validation. Error strings must be exactly `Route requires at least two coordinates`, `Invalid longitude`, or `Invalid latitude`.

- [ ] **Step 8: Run package gates**

```bash
pnpm --filter @magina-aventura/contracts typecheck
pnpm --filter @magina-aventura/geo typecheck
pnpm --filter @magina-aventura/geo test
```

Expected: PASS / PASS / PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/contracts packages/geo
git commit -m "feat: add route map contracts and geometry helpers"
```

---

### Task 2: Deterministic GPX Import Package

**Files:**
- Create: `packages/route-import/package.json`
- Create: `packages/route-import/tsconfig.json`
- Create: `packages/route-import/src/gpx.ts`
- Create: `packages/route-import/src/gpx.test.ts`
- Create: `packages/route-import/src/index.ts`

**Interfaces:**
- Consumes: `GeoJsonPosition`, `RouteLineFeature`, `RouteBounds`, `calculateRouteBounds`.
- Produces: `parseGpx(xml: string, routeId: string, geometryVersion: number): ImportedRouteGeometry`.

`ImportedRouteGeometry`:

```ts
export interface ImportedRouteGeometry {
  line: RouteLineFeature;
  start: GeoJsonPosition;
  bounds: RouteBounds;
  elevationsM: Array<number | null>;
}
```

- [ ] **Step 1: Create package metadata**

`packages/route-import/package.json`:

```json
{
  "name": "@magina-aventura/route-import",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@magina-aventura/contracts": "workspace:*",
    "@magina-aventura/geo": "workspace:*",
    "fast-xml-parser": "^5.2.5"
  },
  "devDependencies": {
    "typescript": "~6.0.3",
    "vitest": "^3.2.4"
  }
}
```

Use the same TypeScript compiler options as `packages/geo/tsconfig.json`.

- [ ] **Step 2: Write failing GPX tests**

Include three tests in `gpx.test.ts`: valid `trk/trkseg/trkpt`, empty track rejection, invalid latitude rejection. Use synthetic test-only coordinates and do not name them Cuadros.

Valid GPX fixture:

```xml
<?xml version="1.0"?>
<gpx version="1.1" creator="test">
  <trk><name>Fixture</name><trkseg>
    <trkpt lat="37.7000" lon="-3.5000"><ele>900</ele></trkpt>
    <trkpt lat="37.7010" lon="-3.4990"><ele>905</ele></trkpt>
  </trkseg></trk>
</gpx>
```

Expected first coordinate: `[-3.5, 37.7]`; elevations: `[900, 905]`.

- [ ] **Step 3: Run GPX tests and observe RED**

```bash
pnpm --filter @magina-aventura/route-import test
```

Expected: FAIL because parser implementation is absent.

- [ ] **Step 4: Implement `parseGpx` with `fast-xml-parser`**

Parser requirements:

```ts
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
});
```

Normalize a single point to an array before flattening segments. Prefer `<trk><trkseg><trkpt>` and accept `<rte><rtept>` as fallback. Reject malformed XML with `Invalid GPX XML`; reject no coordinates with `GPX contains no route coordinates`.

- [ ] **Step 5: Run package tests/typecheck**

```bash
pnpm --filter @magina-aventura/route-import typecheck
pnpm --filter @magina-aventura/route-import test
```

Expected: PASS / PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/route-import pnpm-lock.yaml
git commit -m "feat: add deterministic GPX route importer"
```

---

### Task 3: PostGIS Map Assets, Published Payload RPC and RLS Tests

**Files:**
- Create: `supabase/migrations/202609150004_route_map_assets.sql`
- Create: `supabase/migrations/202609150005_route_map_payload.sql`
- Create: `supabase/tests/database/route_map_assets_test.sql`
- Create: `supabase/tests/database/route_map_payload_test.sql`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Produces table: `public.route_map_assets`.
- Produces SQL function: `public.get_published_route_map_payload(p_slug text) returns jsonb`.

- [ ] **Step 1: Write RED pgTAP structure/RLS test**

`route_map_assets_test.sql` begins:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select has_table('public', 'route_map_assets', 'route_map_assets exists');
select has_column('public', 'route_map_assets', 'object_key', 'object_key exists');
select has_column('public', 'route_map_assets', 'geometry_version', 'geometry_version exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.route_map_assets'::regclass),
  'RLS enabled on route_map_assets'
);

select * from finish();
rollback;
```

- [ ] **Step 2: Run database test and observe RED**

```bash
supabase start -x studio,imgproxy,inbucket,realtime,storage-api,edge-runtime,logflare,vector,supavisor
supabase db reset
supabase test db supabase/tests/database/route_map_assets_test.sql
```

Expected: FAIL because `route_map_assets` does not exist.

- [ ] **Step 3: Create route-map-assets migration**

```sql
create table public.route_map_assets (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  geometry_version integer not null check (geometry_version > 0),
  asset_kind text not null check (asset_kind in ('pmtiles')),
  object_key text not null,
  public_url text not null check (public_url ~ '^https://'),
  byte_size bigint not null check (byte_size > 0),
  md5 text,
  min_zoom numeric(4,1) not null check (min_zoom >= 0),
  max_zoom numeric(4,1) not null check (max_zoom >= min_zoom),
  bounds extensions.geometry(Polygon, 4326) not null,
  created_at timestamptz not null default now(),
  unique(route_id, geometry_version, asset_kind)
);

create index route_map_assets_bounds_gix
  on public.route_map_assets using gist (bounds);

alter table public.route_map_assets enable row level security;

create policy "public can read map assets of published routes"
  on public.route_map_assets for select
  using (exists (
    select 1 from public.routes r
    where r.id = route_map_assets.route_id
      and r.status = 'published'
  ));
```

- [ ] **Step 4: Write RED payload function test**

Create a transaction-scoped municipality, published route, route version, line geometry and one checkpoint. Assert `get_published_route_map_payload('test-published-route')` returns the route ID and geometry version. Create a second draft route and assert the function returns SQL `NULL` for its slug after `set local role anon`.

Use pgTAP `is(...)`/`ok(...)`; clean data via transaction rollback.

- [ ] **Step 5: Run payload test and observe RED**

```bash
supabase test db supabase/tests/database/route_map_payload_test.sql
```

Expected: FAIL because function is absent.

- [ ] **Step 6: Implement payload function**

Function must be `stable`, `security invoker`, return one JSON object and rely on route status/RLS rather than a service-role bypass. Build `line`, `start`, `bounds`, `checkpoints` and `discoveryHints` with `jsonb_build_object`, `ST_AsGeoJSON(... )::jsonb`, `ST_X`, `ST_Y`, and `ST_XMin/ST_YMin/ST_XMax/ST_YMax(ST_Extent(...))` or `ST_Envelope` derived from the selected route geometry.

Grant execute to `anon` and `authenticated` only:

```sql
grant execute on function public.get_published_route_map_payload(text) to anon, authenticated;
```

- [ ] **Step 7: Add DB tests to CI**

After `supabase db reset`:

```yaml
- name: Database tests
  run: supabase test db
```

- [ ] **Step 8: Verify Supabase locally/in CI**

```bash
supabase db reset
supabase test db
```

Expected: all migrations apply and both pgTAP files PASS.

- [ ] **Step 9: Commit**

```bash
git add supabase .github/workflows/ci.yml
git commit -m "feat: add versioned map assets and route map RPC"
```

---

### Task 4: Install and Configure MapLibre Native for Expo

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/app.json`
- Modify: `pnpm-lock.yaml`
- Create: `apps/mobile/src/map/map-style.ts`
- Create: `apps/mobile/src/map/map-style.test.ts`

**Interfaces:**
- Produces: `buildPmtilesSourceUri(remoteUrl: string, localFileUri?: string): string`.
- Produces: `buildBaseMapStyle(sourceUri: string): object`.

- [ ] **Step 1: Write RED URI tests before dependency installation**

```ts
import { describe, expect, it } from 'vitest';
import { buildPmtilesSourceUri } from './map-style';

describe('buildPmtilesSourceUri', () => {
  it('uses remote HTTPS archive when local file is absent', () => {
    expect(buildPmtilesSourceUri('https://cdn.example.test/route.pmtiles'))
      .toBe('pmtiles://https://cdn.example.test/route.pmtiles');
  });

  it('prefers local file when ready', () => {
    expect(buildPmtilesSourceUri('https://cdn.example.test/route.pmtiles', 'file:///data/route.pmtiles'))
      .toBe('pmtiles://file:///data/route.pmtiles');
  });
});
```

- [ ] **Step 2: Run test and observe RED**

```bash
pnpm --filter @magina-aventura/mobile test -- src/map/map-style.test.ts
```

Expected: FAIL because `map-style.ts` does not exist.

- [ ] **Step 3: Install native dependencies with Expo-aware resolver**

```bash
pnpm --filter @magina-aventura/mobile exec expo install @maplibre/maplibre-react-native expo-file-system
```

Expected SDK-compatible dependency versions; do not manually pin a conflicting MapLibre Native binary.

- [ ] **Step 4: Add MapLibre config plugin**

Ensure `apps/mobile/app.json` has:

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "@maplibre/maplibre-react-native"
    ]
  }
}
```

Preserve any existing plugin entries and app metadata.

- [ ] **Step 5: Implement URI/style builder**

`buildPmtilesSourceUri` rejects non-HTTPS remote URLs with `PMTiles remote URL must use HTTPS`. When a local URI is passed it must begin with `file://`, otherwise throw `PMTiles local URI must use file://`.

`buildBaseMapStyle` returns a MapLibre Style Specification object with one PMTiles vector source named `basemap`. Keep its visual layer set minimal and development-safe; do not embed API tokens.

- [ ] **Step 6: Run mobile tests/typecheck**

```bash
pnpm --filter @magina-aventura/mobile test -- src/map/map-style.test.ts
pnpm --filter @magina-aventura/mobile typecheck
```

Expected: PASS / PASS.

- [ ] **Step 7: Verify Expo native config generation**

```bash
cd apps/mobile
pnpm exec expo prebuild --platform android --no-install --clean
cd ../..
```

Expected: command exits 0 and generated Android config includes MapLibre plugin output. Do not commit generated `android/` unless the repository later adopts native folders intentionally.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/package.json apps/mobile/app.json apps/mobile/src/map/map-style.ts apps/mobile/src/map/map-style.test.ts pnpm-lock.yaml
git commit -m "feat: configure MapLibre native map runtime"
```

---

### Task 5: Real RouteMap Adapter

**Files:**
- Modify: `apps/mobile/src/map/map-types.ts`
- Create: `apps/mobile/src/map/RouteMap.tsx`
- Modify: `apps/mobile/app/routes/[slug].tsx`
- Delete after integration: `apps/mobile/src/map/DevelopmentMap.tsx`

**Interfaces:**
- `RouteMapProps` consumes `RouteMapPayload | null`, `mapStyle`, and `developmentMode`.
- Produces real MapLibre route rendering with a graceful no-geometry state.

- [ ] **Step 1: Extend map props**

```ts
import type { RouteMapPayload } from '@magina-aventura/contracts';

export interface RouteMapProps {
  payload: RouteMapPayload | null;
  mapStyle: object | string;
  developmentMode: boolean;
}
```

- [ ] **Step 2: Implement `RouteMap` using named MapLibre imports**

Use named imports from `@maplibre/maplibre-react-native` and render:

```tsx
<MapView style={{ flex: 1 }} mapStyle={mapStyle}>
  <Camera bounds={...} />
  {payload ? (
    <ShapeSource id="route-line" shape={payload.line}>
      <LineLayer id="route-line-layer" style={{ lineWidth: 5 }} />
    </ShapeSource>
  ) : null}
</MapView>
```

Add start/finish/checkpoint sources only when `payload` is present. Use design tokens where supported by layer style values. Do not put route fetching inside the component.

- [ ] **Step 3: Add graceful no-geometry UX**

When payload is null, render the real base map and an overlay label `Track verificado no disponible todavía`. Do not draw a synthetic route line.

- [ ] **Step 4: Replace `DevelopmentMap` in route detail**

`[slug].tsx` imports `RouteMap`. Until Task 8 wires the repository, pass `payload={null}` and a development style built without secrets.

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter @magina-aventura/mobile typecheck
```

Expected: PASS.

- [ ] **Step 6: Delete obsolete placeholder**

Delete `apps/mobile/src/map/DevelopmentMap.tsx` only after no import remains.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/map apps/mobile/app/routes/[slug].tsx
git commit -m "feat: replace development map with MapLibre adapter"
```

---

### Task 6: Offline Package State + Version/Integrity Rules

**Files:**
- Create: `packages/offline-sync/src/route-package.ts`
- Create: `packages/offline-sync/src/route-package.test.ts`
- Modify: `packages/offline-sync/src/index.ts`

**Interfaces:**
- Produces `OfflinePackageState = 'not-downloaded' | 'downloading' | 'ready' | 'stale' | 'error'`.
- Produces `evaluateOfflinePackage(installed, manifest): OfflinePackageState`.
- Produces `offlinePackageFileName(manifest): string`.

- [ ] **Step 1: Write RED state tests**

Test these exact cases:

```ts
expect(evaluateOfflinePackage(null, manifest)).toBe('not-downloaded');
expect(evaluateOfflinePackage({ ...installed, geometryVersion: 1 }, { ...manifest, geometryVersion: 2 })).toBe('stale');
expect(evaluateOfflinePackage(installedMatchingManifest, manifest)).toBe('ready');
```

Also test deterministic file name:

```ts
expect(offlinePackageFileName(manifest)).toBe(`route-${manifest.routeId}-g${manifest.geometryVersion}.pmtiles`);
```

- [ ] **Step 2: Run and observe RED**

```bash
pnpm --filter @magina-aventura/offline-sync test -- src/route-package.test.ts
```

Expected: FAIL because route-package module is absent.

- [ ] **Step 3: Implement pure state logic**

Installed metadata must include route ID, content version, geometry version, byte size, MD5 and local URI. `ready` requires exact route/version/size match and MD5 match when the manifest supplies MD5; otherwise return `stale`.

- [ ] **Step 4: Run tests/typecheck**

```bash
pnpm --filter @magina-aventura/offline-sync test
pnpm --filter @magina-aventura/offline-sync typecheck
```

Expected: PASS / PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/offline-sync
git commit -m "feat: add offline route package state model"
```

---

### Task 7: Expo FileSystem PMTiles Downloader Behind a Port

**Files:**
- Create: `apps/mobile/src/offline/route-package-port.ts`
- Create: `apps/mobile/src/offline/route-package-store.ts`
- Create: `apps/mobile/src/offline/route-package-store.test.ts`
- Create: `apps/mobile/src/offline/expo-route-package-port.ts`

**Interfaces:**

```ts
export interface RoutePackagePort {
  ensureDirectory(): Promise<void>;
  download(remoteUrl: string, fileName: string): Promise<{ uri: string; size: number; md5: string | null }>;
  remove(uri: string): Promise<void>;
  exists(uri: string): Promise<boolean>;
}
```

`downloadRoutePackage(port, manifest)` returns installed metadata accepted by `evaluateOfflinePackage`.

- [ ] **Step 1: Write RED orchestration tests with fake port**

Test that a successful download checks byte size and checksum; a size mismatch removes the downloaded file and throws `Downloaded PMTiles size mismatch`; an MD5 mismatch removes it and throws `Downloaded PMTiles checksum mismatch`.

- [ ] **Step 2: Run and observe RED**

```bash
pnpm --filter @magina-aventura/mobile test -- src/offline/route-package-store.test.ts
```

Expected: FAIL because the store module is absent.

- [ ] **Step 3: Implement pure orchestration**

Do not import `expo-file-system` into `route-package-store.ts`; only the adapter imports native infrastructure.

- [ ] **Step 4: Implement Expo adapter**

Use current Expo FileSystem `Directory`, `File`, and `Paths.document`. Store packages under a `magina-aventura/routes` directory. Use `File.downloadFileAsync(remoteUrl, destinationFile, { idempotent: true })` or the SDK-57 equivalent exposed by the installed type definitions. Read `size` and `md5` from the resulting `File` instance.

Do not store offline packages under `Paths.cache`; route packages must survive ordinary cache eviction.

- [ ] **Step 5: Run tests/typecheck**

```bash
pnpm --filter @magina-aventura/mobile test -- src/offline/route-package-store.test.ts
pnpm --filter @magina-aventura/mobile typecheck
```

Expected: PASS / PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/offline
git commit -m "feat: add explicit PMTiles route package downloader"
```

---

### Task 8: Route Map Repository + Route Detail/Preparation Integration

**Files:**
- Create: `apps/mobile/src/features/routes/route-map-repository.ts`
- Create: `apps/mobile/src/features/routes/development-route-map-repository.ts`
- Modify: `apps/mobile/app/routes/[slug].tsx`
- Modify: `apps/mobile/app/routes/[slug]/prepare.tsx`
- Modify: `apps/mobile/src/features/routes/fixtures.ts` only for manifest metadata that is explicitly development-only; do not add synthetic route geometry.

**Interfaces:**

```ts
export interface RouteMapRepository {
  getMapPayload(slug: string): Promise<RouteMapPayload | null>;
  getOfflineManifest(slug: string): Promise<OfflineRoutePackageManifest | null>;
}
```

Development repository returns `null` map payload until verified geometry exists. A development offline manifest may only point at an explicitly labelled demo PMTiles archive and must not claim it is Cuadros cartography.

- [ ] **Step 1: Add repository unit tests**

Verify unknown slug returns null; development Bedmar slug returns no authoritative line; manifest data, when present, carries `developmentFixture` in the surrounding UI state and is never shown as verified route geometry.

- [ ] **Step 2: Run and observe RED**

```bash
pnpm --filter @magina-aventura/mobile test -- src/features/routes/development-route-map-repository.test.ts
```

Expected: FAIL because repository modules are absent.

- [ ] **Step 3: Implement repository boundary**

Keep data access outside screens. The future Supabase adapter must be able to replace the development implementation without changing `RouteMap`.

- [ ] **Step 4: Integrate route detail**

Route detail must display:

- real `RouteMap` component;
- `Track verificado no disponible todavía` when payload is null;
- offline package state (`No descargado`, `Descargando`, `Listo sin conexión`, `Actualización disponible`, `Error de descarga`);
- a `Descargar para uso offline` action only when a manifest exists;
- existing `Preparar aventura` CTA.

Do not block route detail if map package is absent.

- [ ] **Step 5: Integrate preparation screen**

If a route advertises offline availability and a manifest exists, show the current package state. Starting a future adventure is not implemented here; the screen only makes readiness explicit. Do not fabricate GPS readiness.

- [ ] **Step 6: Test/typecheck**

```bash
pnpm --filter @magina-aventura/mobile test
pnpm --filter @magina-aventura/mobile typecheck
```

Expected: PASS / PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/app/routes apps/mobile/src/features/routes
git commit -m "feat: integrate route map and offline preparation flow"
```

---

### Task 9: R2 Contract Documentation + Repository-Wide Quality Gate

**Files:**
- Create: `docs/architecture/map-assets-r2.md`
- Modify: `.github/workflows/ci.yml`
- Modify: root `package.json` only if a new aggregate script is required.

**Interfaces:**
- Produces documented immutable object convention.
- Produces CI evidence for TypeScript, unit tests, pgTAP, migration reset, pure boundaries and Expo native config generation.

- [ ] **Step 1: Document R2 object contract**

The document must specify:

```text
routes/{routeId}/geometry/{geometryVersion}/basemap.pmtiles
```

Required response behavior:

```text
HTTPS
Accept-Ranges: bytes
Content-Type: application/vnd.pmtiles (preferred)
Cache-Control: public, max-age=31536000, immutable
```

Document that bucket/account provisioning and credentials are environment operations and must never be committed. Document CORS as the minimum explicit origins needed by admin/web tooling, not `*` by default.

- [ ] **Step 2: Add Expo native config gate to CI**

After dependency install/typecheck/tests and before Supabase cleanup:

```yaml
- name: Verify Expo native MapLibre config
  working-directory: apps/mobile
  run: pnpm exec expo prebuild --platform android --no-install --clean
```

If prebuild generates ignored native output, leave it uncommitted.

- [ ] **Step 3: Keep existing pure package boundary gate and include `packages/route-import/src`**

The grep/check must inspect source directories only, never `node_modules`.

- [ ] **Step 4: Run the complete gate**

```bash
pnpm typecheck
pnpm test
supabase start -x studio,imgproxy,inbucket,realtime,storage-api,edge-runtime,logflare,vector,supavisor
supabase db reset
supabase test db
cd apps/mobile && pnpm exec expo prebuild --platform android --no-install --clean && cd ../..
```

Expected: every command exits 0.

- [ ] **Step 5: Verify no infrastructure imports in pure packages**

```bash
if grep -R -n -E "from ['\"]expo|@supabase|maplibre|react-native" \
  packages/domain/src packages/geo/src packages/contracts/src packages/offline-sync/src packages/route-import/src; then
  echo "Infrastructure import detected in pure packages"
  exit 1
fi
```

Expected: no matches.

- [ ] **Step 6: Self-review against spec**

Verify all acceptance criteria in `docs/superpowers/specs/2026-09-15-maplibre-gpx-offline-design.md` have evidence. In particular: no synthetic Cuadros geometry, PMTiles is explicitly downloaded, map adapter does not fetch data itself, draft map assets are protected by RLS, and the CI exercises pgTAP.

- [ ] **Step 7: Commit**

```bash
git add docs/architecture/map-assets-r2.md .github/workflows/ci.yml package.json
git commit -m "ci: enforce map and offline subsystem quality gates"
```

---

## Exit Criteria

This plan is complete only when:

1. shared map/offline contracts typecheck with no infrastructure imports;
2. geometry bounds/validation tests are green after observed RED failures;
3. GPX importer accepts valid GPX and rejects malformed/empty/invalid-coordinate GPX;
4. `route_map_assets` exists with RLS and immutable-version metadata;
5. pgTAP proves draft map assets/payloads are not publicly exposed;
6. published route map payload returns versioned GeoJSON from PostGIS;
7. MapLibre is configured through Expo native config and `expo prebuild --platform android` exits 0;
8. route detail uses `RouteMap`, not `DevelopmentMap`;
9. no synthetic Cuadros line is displayed when authoritative geometry is absent;
10. offline package state/version/integrity behavior is unit-tested;
11. PMTiles is downloaded explicitly to durable app storage and local-ready state yields a `pmtiles://file://...` source;
12. R2 object-key/cache/range/CORS contract is documented without secrets;
13. `pnpm typecheck` passes;
14. `pnpm test` passes;
15. `supabase db reset` passes;
16. `supabase test db` passes;
17. pure package boundary gate passes;
18. CI is green on the branch/PR head;
19. `main` remains unchanged.

## Next Plan After This One

Once this subsystem is green, the next independent plan is **Activity Engine + deterministic GPS replay**. It will consume `RouteMapPayload`, `packages/geo`, the existing activity state machine in `packages/domain`, and the offline route package without changing the map/storage contracts defined here.
