# MapLibre + GPX + Offline V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the development map placeholder with a MapLibre-based route map, add deterministic GPX-to-GeoJSON import/versioning, and make a versioned PMTiles route package downloadable for offline use without inventing production Cuadros data.

**Architecture:** Pure packages define route/map/offline contracts and deterministic geometry/import logic; Supabase/PostGIS stores authoritative versioned geometry and map-asset metadata; the Expo mobile app renders through a MapLibre adapter and downloads PMTiles explicitly with `expo-file-system`. A PMTiles style template is stored with the asset metadata so the same archive can be addressed as `pmtiles://https://...` online or `pmtiles://file://...` after a verified local download; MapLibre `OfflineManager` is intentionally not used for PMTiles archives.

**Tech Stack:** Node 22.13+, pnpm 10.15, TypeScript 6, Expo SDK 57 / React Native 0.86, Expo Router, MapLibre React Native v11-compatible API, Expo FileSystem, Vitest, Supabase CLI/PostgreSQL 17/PostGIS, pgTAP, `fast-xml-parser`, Cloudflare R2-compatible HTTPS object storage.

**Spec:** `docs/superpowers/specs/2026-09-15-maplibre-gpx-offline-design.md`

## Global Constraints

- Work only on `feat/map-offline-v1`; do not modify `main`.
- Keep `packages/contracts`, `packages/domain`, `packages/geo`, `packages/offline-sync` and `packages/route-import` infrastructure-free: no Expo, React Native, Supabase or MapLibre imports.
- Keep Bedmar/Cuadros route data marked as development unless geometry/content is backed by a verified source.
- Do not ship fabricated Cuadros GPX coordinates.
- MapLibre runs through an Expo custom development build; Expo Go is not an acceptance environment.
- PMTiles downloads are explicit app-file downloads; do not use MapLibre `OfflineManager` for PMTiles.
- Object-storage keys are immutable and versioned by route ID + geometry version.
- No Cloudflare/Supabase secret is committed to Git.
- New behavior follows RED -> GREEN -> refactor with the failing test observed before implementation.
- Root gates remain `pnpm typecheck`, `pnpm test`, pure-package boundary check, Expo native config generation, `supabase db reset`, and `supabase test db`.

---

## File Structure

```text
packages/
  contracts/src/
    route-map.ts
    index.ts
  geo/src/
    bounds.ts
    bounds.test.ts
    route-line.ts
    route-line.test.ts
    index.ts
  route-import/
    package.json
    tsconfig.json
    src/gpx.ts
    src/gpx.test.ts
    src/index.ts
  offline-sync/src/
    route-package.ts
    route-package.test.ts
    index.ts

supabase/
  migrations/
    202609150004_route_map_assets.sql
    202609150005_route_map_payload.sql
  tests/database/
    route_map_assets_test.sql
    route_map_payload_test.sql

apps/mobile/
  app.json
  package.json
  src/map/
    map-types.ts
    map-style.ts
    map-style.test.ts
    RouteMap.tsx
  src/offline/
    route-package-port.ts
    route-package-store.ts
    route-package-store.test.ts
    expo-route-package-port.ts
  src/features/routes/
    route-map-repository.ts
    development-route-map-repository.ts
    development-route-map-repository.test.ts
  app/routes/[slug].tsx
  app/routes/[slug]/prepare.tsx

.github/workflows/ci.yml
docs/architecture/map-assets-r2.md
```

---

### Task 1: Shared Map Contracts and Geometry Helpers

**Files:**
- Create: `packages/contracts/src/route-map.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/geo/src/bounds.ts`
- Create: `packages/geo/src/bounds.test.ts`
- Create: `packages/geo/src/route-line.ts`
- Create: `packages/geo/src/route-line.test.ts`
- Modify: `packages/geo/src/index.ts`

**Interfaces:**
- Produces `GeoJsonPosition`, `RouteBounds`, `RouteLineFeature`, `RouteMapPayload`, `OfflineMapAsset`, `OfflineRoutePackageManifest`.
- Produces `calculateRouteBounds()` and `validateRouteLineFeature()`.

- [ ] **Step 1: Write failing geometry tests**

`packages/geo/src/bounds.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { calculateRouteBounds } from './bounds';

describe('calculateRouteBounds', () => {
  it('returns west south east north', () => {
    expect(calculateRouteBounds([
      [-3.50, 37.72],
      [-3.42, 37.69],
      [-3.46, 37.76],
    ])).toEqual([-3.50, 37.69, -3.42, 37.76]);
  });

  it('rejects fewer than two coordinates', () => {
    expect(() => calculateRouteBounds([[-3.5, 37.7]])).toThrow(
      'Route requires at least two coordinates',
    );
  });
});
```

`packages/geo/src/route-line.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { validateRouteLineFeature } from './route-line';

describe('validateRouteLineFeature', () => {
  const base = {
    type: 'Feature' as const,
    properties: { routeId: 'route-1', geometryVersion: 1 },
    geometry: {
      type: 'LineString' as const,
      coordinates: [[-3.5, 37.7], [-3.4, 37.71]],
    },
  };

  it('accepts a valid line', () => {
    expect(validateRouteLineFeature(base)).toEqual(base);
  });

  it('rejects invalid latitude', () => {
    expect(() => validateRouteLineFeature({
      ...base,
      geometry: { ...base.geometry, coordinates: [[-3.5, 91], [-3.4, 37.7]] },
    })).toThrow('Invalid latitude');
  });

  it('rejects invalid longitude', () => {
    expect(() => validateRouteLineFeature({
      ...base,
      geometry: { ...base.geometry, coordinates: [[181, 37.7], [-3.4, 37.7]] },
    })).toThrow('Invalid longitude');
  });
});
```

- [ ] **Step 2: Run tests and observe RED**

```bash
pnpm --filter @magina-aventura/geo test -- src/bounds.test.ts src/route-line.test.ts
```

Expected: FAIL because both implementation modules are absent.

- [ ] **Step 3: Add shared contracts**

`packages/contracts/src/route-map.ts`:

```ts
export type GeoJsonPosition = readonly [longitude: number, latitude: number];
export type RouteBounds = readonly [west: number, south: number, east: number, north: number];

export interface RouteLineFeature {
  type: 'Feature';
  properties: { routeId: string; geometryVersion: number };
  geometry: { type: 'LineString'; coordinates: GeoJsonPosition[] };
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
  styleJson: string;
}

export interface OfflineRoutePackageManifest {
  manifestVersion: 1;
  routeId: string;
  contentVersion: number;
  geometryVersion: number;
  map: OfflineMapAsset;
}
```

Append to `packages/contracts/src/index.ts`:

```ts
export * from './route-map';
```

- [ ] **Step 4: Implement geometry helpers**

`packages/geo/src/bounds.ts`:

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

`packages/geo/src/route-line.ts`:

```ts
import type { RouteLineFeature } from '@magina-aventura/contracts';

export function validateRouteLineFeature(feature: RouteLineFeature): RouteLineFeature {
  const coordinates = feature.geometry.coordinates;
  if (coordinates.length < 2) throw new Error('Route requires at least two coordinates');

  for (const [longitude, latitude] of coordinates) {
    if (longitude < -180 || longitude > 180) throw new Error('Invalid longitude');
    if (latitude < -90 || latitude > 90) throw new Error('Invalid latitude');
  }

  return feature;
}
```

`packages/geo/src/index.ts` exports both modules.

- [ ] **Step 5: Verify GREEN and commit**

```bash
pnpm --filter @magina-aventura/contracts typecheck
pnpm --filter @magina-aventura/geo typecheck
pnpm --filter @magina-aventura/geo test
git add packages/contracts packages/geo
git commit -m "feat: add route map contracts and geometry helpers"
```

Expected: all three commands PASS before commit.

---

### Task 2: Deterministic GPX Import Package

**Files:**
- Create: `packages/route-import/package.json`
- Create: `packages/route-import/tsconfig.json`
- Create: `packages/route-import/src/gpx.ts`
- Create: `packages/route-import/src/gpx.test.ts`
- Create: `packages/route-import/src/index.ts`

**Interfaces:**

```ts
export interface ImportedRouteGeometry {
  line: RouteLineFeature;
  start: GeoJsonPosition;
  bounds: RouteBounds;
  elevationsM: Array<number | null>;
}

export function parseGpx(
  xml: string,
  routeId: string,
  geometryVersion: number,
): ImportedRouteGeometry;
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

`packages/route-import/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "lib": ["ES2022"]
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 2: Write failing parser tests**

`packages/route-import/src/gpx.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseGpx } from './gpx';

const valid = `<?xml version="1.0"?>
<gpx version="1.1" creator="test"><trk><trkseg>
<trkpt lat="37.7000" lon="-3.5000"><ele>900</ele></trkpt>
<trkpt lat="37.7010" lon="-3.4990"><ele>905</ele></trkpt>
</trkseg></trk></gpx>`;

describe('parseGpx', () => {
  it('normalizes GPX track points', () => {
    const result = parseGpx(valid, 'route-test', 2);
    expect(result.line.geometry.coordinates).toEqual([
      [-3.5, 37.7],
      [-3.499, 37.701],
    ]);
    expect(result.elevationsM).toEqual([900, 905]);
    expect(result.start).toEqual([-3.5, 37.7]);
  });

  it('rejects empty GPX', () => {
    expect(() => parseGpx('<gpx version="1.1"/>', 'route-test', 1))
      .toThrow('GPX contains no route coordinates');
  });

  it('rejects invalid coordinates', () => {
    const invalid = '<gpx><trk><trkseg><trkpt lat="91" lon="0"/><trkpt lat="0" lon="1"/></trkseg></trk></gpx>';
    expect(() => parseGpx(invalid, 'route-test', 1)).toThrow('Invalid latitude');
  });
});
```

- [ ] **Step 3: Run and observe RED**

```bash
pnpm install --no-frozen-lockfile
pnpm --filter @magina-aventura/route-import test
```

Expected: FAIL because `gpx.ts` is absent.

- [ ] **Step 4: Implement parser**

`packages/route-import/src/gpx.ts`:

```ts
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type {
  GeoJsonPosition,
  RouteBounds,
  RouteLineFeature,
} from '@magina-aventura/contracts';
import { calculateRouteBounds, validateRouteLineFeature } from '@magina-aventura/geo';

export interface ImportedRouteGeometry {
  line: RouteLineFeature;
  start: GeoJsonPosition;
  bounds: RouteBounds;
  elevationsM: Array<number | null>;
}

const arrayify = <T>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

export function parseGpx(xml: string, routeId: string, geometryVersion: number): ImportedRouteGeometry {
  if (XMLValidator.validate(xml) !== true) throw new Error('Invalid GPX XML');

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
  });
  const doc = parser.parse(xml);

  const segments = arrayify(doc?.gpx?.trk).flatMap((track: any) => arrayify(track?.trkseg));
  const trackPoints = segments.flatMap((segment: any) => arrayify(segment?.trkpt));
  const routePoints = trackPoints.length > 0
    ? trackPoints
    : arrayify(doc?.gpx?.rte).flatMap((route: any) => arrayify(route?.rtept));

  if (routePoints.length === 0) throw new Error('GPX contains no route coordinates');

  const coordinates = routePoints.map((point: any): GeoJsonPosition => [
    Number(point['@_lon']),
    Number(point['@_lat']),
  ]);

  const line = validateRouteLineFeature({
    type: 'Feature',
    properties: { routeId, geometryVersion },
    geometry: { type: 'LineString', coordinates },
  });

  return {
    line,
    start: coordinates[0],
    bounds: calculateRouteBounds(coordinates),
    elevationsM: routePoints.map((point: any) =>
      point.ele === undefined ? null : Number(point.ele),
    ),
  };
}
```

`packages/route-import/src/index.ts`:

```ts
export * from './gpx';
```

- [ ] **Step 5: Verify GREEN and commit**

```bash
pnpm --filter @magina-aventura/route-import typecheck
pnpm --filter @magina-aventura/route-import test
git add packages/route-import pnpm-lock.yaml
git commit -m "feat: add deterministic GPX route importer"
```

Expected: PASS / PASS before commit.

---

### Task 3: PostGIS Map Assets, Style Template, RPC and RLS Tests

**Files:**
- Create: `supabase/migrations/202609150004_route_map_assets.sql`
- Create: `supabase/migrations/202609150005_route_map_payload.sql`
- Create: `supabase/tests/database/route_map_assets_test.sql`
- Create: `supabase/tests/database/route_map_payload_test.sql`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Produces `public.route_map_assets`.
- Produces `public.get_published_route_map_payload(text) returns jsonb`.

- [ ] **Step 1: Write RED structure test**

`supabase/tests/database/route_map_assets_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

select has_table('public', 'route_map_assets', 'route_map_assets exists');
select has_column('public', 'route_map_assets', 'object_key', 'object_key exists');
select has_column('public', 'route_map_assets', 'geometry_version', 'geometry_version exists');
select has_column('public', 'route_map_assets', 'style_json', 'style_json exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.route_map_assets'::regclass),
  'RLS enabled on route_map_assets'
);

select * from finish();
rollback;
```

Run:

```bash
supabase start -x studio,imgproxy,inbucket,realtime,storage-api,edge-runtime,logflare,vector,supavisor
supabase db reset
supabase test db supabase/tests/database/route_map_assets_test.sql
```

Expected: FAIL because the table is absent.

- [ ] **Step 2: Create asset migration**

`supabase/migrations/202609150004_route_map_assets.sql`:

```sql
create table public.route_map_assets (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  geometry_version integer not null check (geometry_version > 0),
  asset_kind text not null check (asset_kind = 'pmtiles'),
  object_key text not null,
  public_url text not null check (public_url ~ '^https://'),
  byte_size bigint not null check (byte_size > 0),
  md5 text,
  min_zoom numeric(4,1) not null check (min_zoom >= 0),
  max_zoom numeric(4,1) not null check (max_zoom >= min_zoom),
  bounds extensions.geometry(Polygon, 4326) not null,
  style_json jsonb not null,
  created_at timestamptz not null default now(),
  unique(route_id, geometry_version, asset_kind)
);

create index route_map_assets_bounds_gix
  on public.route_map_assets using gist (bounds);

alter table public.route_map_assets enable row level security;

create policy "public can read map assets of published routes"
  on public.route_map_assets
  for select
  to anon, authenticated
  using (exists (
    select 1 from public.routes r
    where r.id = route_map_assets.route_id
      and r.status = 'published'
  ));
```

- [ ] **Step 3: Write RED payload/RLS test**

`supabase/tests/database/route_map_payload_test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

insert into public.municipalities (id, slug, name)
values ('10000000-0000-0000-0000-000000000001', 'test-town', 'Test Town');

insert into public.routes (id, municipality_id, slug, title, status, current_geometry_version)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'published-test', 'Published', 'published', 1),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'draft-test', 'Draft', 'draft', 1);

insert into public.route_geometries (route_id, version, geometry, start_point)
values
  ('20000000-0000-0000-0000-000000000001', 1,
    extensions.st_geomfromtext('LINESTRING(-3.5 37.7,-3.49 37.71)', 4326),
    extensions.st_geomfromtext('POINT(-3.5 37.7)', 4326)),
  ('20000000-0000-0000-0000-000000000002', 1,
    extensions.st_geomfromtext('LINESTRING(-3.4 37.6,-3.39 37.61)', 4326),
    extensions.st_geomfromtext('POINT(-3.4 37.6)', 4326));

set local role anon;

select ok(
  public.get_published_route_map_payload('published-test') is not null,
  'published route payload is visible'
);
select is(
  public.get_published_route_map_payload('draft-test'),
  null::jsonb,
  'draft route payload is hidden'
);
select is(
  public.get_published_route_map_payload('missing-route'),
  null::jsonb,
  'missing route returns null'
);

reset role;
select * from finish();
rollback;
```

Run:

```bash
supabase test db supabase/tests/database/route_map_payload_test.sql
```

Expected: FAIL because the function is absent.

- [ ] **Step 4: Create payload function**

`supabase/migrations/202609150005_route_map_payload.sql`:

```sql
create or replace function public.get_published_route_map_payload(p_slug text)
returns jsonb
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'routeId', r.id,
    'slug', r.slug,
    'geometryVersion', g.version,
    'line', jsonb_build_object(
      'type', 'Feature',
      'properties', jsonb_build_object('routeId', r.id, 'geometryVersion', g.version),
      'geometry', ST_AsGeoJSON(g.geometry)::jsonb
    ),
    'start', jsonb_build_array(ST_X(g.start_point), ST_Y(g.start_point)),
    'bounds', jsonb_build_array(
      ST_XMin(ST_Envelope(g.geometry)),
      ST_YMin(ST_Envelope(g.geometry)),
      ST_XMax(ST_Envelope(g.geometry)),
      ST_YMax(ST_Envelope(g.geometry))
    ),
    'checkpoints', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'position', jsonb_build_array(ST_X(c.position), ST_Y(c.position)),
        'triggerRadiusM', c.trigger_radius_m,
        'required', c.required
      ) order by c.name)
      from public.checkpoints c
      where c.route_id = r.id and c.active = true
    ), '[]'::jsonb),
    'discoveryHints', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id,
        'category', d.category,
        'position', jsonb_build_array(ST_X(d.position), ST_Y(d.position)),
        'triggerRadiusM', d.trigger_radius_m
      ) order by d.id)
      from public.discoveries d
      where d.route_id = r.id and d.active = true
    ), '[]'::jsonb)
  )
  from public.routes r
  join public.route_geometries g
    on g.route_id = r.id and g.version = r.current_geometry_version
  where r.slug = p_slug and r.status = 'published'
  limit 1;
$$;

grant execute on function public.get_published_route_map_payload(text) to anon, authenticated;
```

- [ ] **Step 5: Add DB tests to CI and verify GREEN**

Add after `supabase db reset` in `.github/workflows/ci.yml`:

```yaml
      - name: Database tests
        run: supabase test db
```

Run:

```bash
supabase db reset
supabase test db
```

Expected: migrations PASS and all pgTAP tests PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase .github/workflows/ci.yml
git commit -m "feat: add versioned map assets and published map RPC"
```

---

### Task 4: MapLibre Native Setup and PMTiles Style Materialization

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/app.json`
- Modify: `pnpm-lock.yaml`
- Create: `apps/mobile/src/map/map-style.ts`
- Create: `apps/mobile/src/map/map-style.test.ts`

**Interfaces:**
- Produces `buildPmtilesSourceUri(remoteUrl, localFileUri?)`.
- Produces `materializeMapStyle(styleJson, sourceUri)`.

- [ ] **Step 1: Write RED style tests**

`apps/mobile/src/map/map-style.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildPmtilesSourceUri, materializeMapStyle } from './map-style';

describe('PMTiles style materialization', () => {
  it('uses remote HTTPS PMTiles', () => {
    expect(buildPmtilesSourceUri('https://cdn.example.test/map.pmtiles'))
      .toBe('pmtiles://https://cdn.example.test/map.pmtiles');
  });

  it('prefers a local PMTiles file', () => {
    expect(buildPmtilesSourceUri(
      'https://cdn.example.test/map.pmtiles',
      'file:///data/map.pmtiles',
    )).toBe('pmtiles://file:///data/map.pmtiles');
  });

  it('replaces the archive token in style JSON', () => {
    const style = materializeMapStyle(
      JSON.stringify({ version: 8, sources: { base: { type: 'vector', url: '__ROUTE_PMTILES__' } }, layers: [] }),
      'pmtiles://https://cdn.example.test/map.pmtiles',
    ) as any;
    expect(style.sources.base.url).toBe('pmtiles://https://cdn.example.test/map.pmtiles');
  });
});
```

Run:

```bash
pnpm --filter @magina-aventura/mobile test -- src/map/map-style.test.ts
```

Expected: FAIL because module is absent.

- [ ] **Step 2: Install Expo-compatible native dependencies**

```bash
pnpm --filter @magina-aventura/mobile exec expo install @maplibre/maplibre-react-native expo-file-system
```

Do not manually pin native Android/iOS MapLibre versions.

- [ ] **Step 3: Add Expo config plugin**

Preserve existing app metadata and ensure `apps/mobile/app.json` contains both plugins:

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

- [ ] **Step 4: Implement style functions**

`apps/mobile/src/map/map-style.ts`:

```ts
export function buildPmtilesSourceUri(remoteUrl: string, localFileUri?: string): string {
  if (localFileUri !== undefined) {
    if (!localFileUri.startsWith('file://')) throw new Error('PMTiles local URI must use file://');
    return `pmtiles://${localFileUri}`;
  }
  if (!remoteUrl.startsWith('https://')) throw new Error('PMTiles remote URL must use HTTPS');
  return `pmtiles://${remoteUrl}`;
}

export function materializeMapStyle(styleJson: string, sourceUri: string): Record<string, unknown> {
  const replaced = styleJson.replaceAll('__ROUTE_PMTILES__', sourceUri);
  const parsed = JSON.parse(replaced) as Record<string, unknown>;
  if (parsed.version !== 8) throw new Error('Map style version must be 8');
  return parsed;
}
```

- [ ] **Step 5: Verify tests, typecheck and native config**

```bash
pnpm --filter @magina-aventura/mobile test -- src/map/map-style.test.ts
pnpm --filter @magina-aventura/mobile typecheck
cd apps/mobile
pnpm exec expo prebuild --platform android --no-install --clean
cd ../..
```

Expected: PASS / PASS / prebuild exits 0. Do not commit generated `android/` unless repository policy changes.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/package.json apps/mobile/app.json apps/mobile/src/map/map-style.ts apps/mobile/src/map/map-style.test.ts pnpm-lock.yaml
git commit -m "feat: configure MapLibre and PMTiles style materialization"
```

---

### Task 5: Real MapLibre RouteMap Adapter

**Files:**
- Modify: `apps/mobile/src/map/map-types.ts`
- Create: `apps/mobile/src/map/RouteMap.tsx`
- Modify: `apps/mobile/app/routes/[slug].tsx`
- Delete: `apps/mobile/src/map/DevelopmentMap.tsx`

**Interfaces:**

```ts
export interface RouteMapProps {
  payload: RouteMapPayload | null;
  mapStyle: string | Record<string, unknown>;
  developmentMode: boolean;
}
```

- [ ] **Step 1: Replace map prop contract**

`apps/mobile/src/map/map-types.ts`:

```ts
import type { RouteMapPayload } from '@magina-aventura/contracts';

export interface RouteMapProps {
  payload: RouteMapPayload | null;
  mapStyle: string | Record<string, unknown>;
  developmentMode: boolean;
}
```

- [ ] **Step 2: Implement `RouteMap` with current MapLibre API**

`apps/mobile/src/map/RouteMap.tsx`:

```tsx
import { Camera, CircleLayer, LineLayer, Map, ShapeSource } from '@maplibre/maplibre-react-native';
import { StyleSheet, Text, View } from 'react-native';
import type { RouteMapProps } from './map-types';
import { colors, radius, spacing } from '../theme/tokens';

export function RouteMap({ payload, mapStyle, developmentMode }: RouteMapProps) {
  const initialViewState = payload
    ? {
        bounds: payload.bounds,
        padding: { top: 32, right: 32, bottom: 32, left: 32 },
      }
    : { center: [-3.47, 37.71] as [number, number], zoom: 11 };

  const checkpointShape = payload
    ? {
        type: 'FeatureCollection' as const,
        features: payload.checkpoints.map((checkpoint) => ({
          type: 'Feature' as const,
          properties: { id: checkpoint.id, required: checkpoint.required },
          geometry: { type: 'Point' as const, coordinates: checkpoint.position },
        })),
      }
    : null;

  return (
    <View style={styles.container}>
      <Map style={styles.map} mapStyle={mapStyle as any}>
        <Camera initialViewState={initialViewState as any} />
        {payload ? (
          <ShapeSource id="route-line" shape={payload.line as any}>
            <LineLayer id="route-line-layer" style={{ lineColor: colors.olive700, lineWidth: 5 }} />
          </ShapeSource>
        ) : null}
        {checkpointShape ? (
          <ShapeSource id="route-checkpoints" shape={checkpointShape as any}>
            <CircleLayer
              id="route-checkpoints-layer"
              style={{ circleColor: colors.aoveGold, circleRadius: 6, circleStrokeColor: colors.white, circleStrokeWidth: 2 }}
            />
          </ShapeSource>
        ) : null}
      </Map>
      {!payload ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>Track verificado no disponible todavía</Text>
        </View>
      ) : null}
      {developmentMode ? (
        <View style={styles.devBadge}><Text style={styles.devText}>DESARROLLO</Text></View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 260, overflow: 'hidden', borderRadius: radius.lg },
  map: { flex: 1 },
  notice: { position: 'absolute', left: spacing[12], right: spacing[12], bottom: spacing[12], padding: spacing[12], borderRadius: radius.md, backgroundColor: colors.white },
  noticeText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  devBadge: { position: 'absolute', top: spacing[12], right: spacing[12], paddingHorizontal: spacing[8], paddingVertical: spacing[4], borderRadius: radius.pill, backgroundColor: colors.ink },
  devText: { color: colors.white, fontSize: 9, fontWeight: '900' },
});
```

The fallback center is only a generic development viewport. It is not presented as a route line or verified waypoint.

- [ ] **Step 3: Integrate route detail with a configured development style**

In `[slug].tsx`, replace `DevelopmentMap` with `RouteMap`. For this task pass `payload={null}` and use an explicit non-secret development style URL such as `https://demotiles.maplibre.org/style.json` only when `__DEV__` is true. Production must read `process.env.EXPO_PUBLIC_MAP_STYLE_URL`; if absent outside development, render the no-map message instead of embedding a provider token.

Use this selection:

```ts
const configuredStyle = process.env.EXPO_PUBLIC_MAP_STYLE_URL;
const baseMapStyle = configuredStyle ?? (__DEV__ ? 'https://demotiles.maplibre.org/style.json' : null);
```

- [ ] **Step 4: Remove placeholder and verify**

```bash
rm apps/mobile/src/map/DevelopmentMap.tsx
pnpm --filter @magina-aventura/mobile typecheck
pnpm --filter @magina-aventura/mobile test
git add apps/mobile/src/map apps/mobile/app/routes/[slug].tsx
git commit -m "feat: replace placeholder map with MapLibre adapter"
```

Expected: typecheck and tests PASS before commit.

---

### Task 6: Pure Offline Package State and PMTiles Source Selection

**Files:**
- Create: `packages/offline-sync/src/route-package.ts`
- Create: `packages/offline-sync/src/route-package.test.ts`
- Modify: `packages/offline-sync/src/index.ts`

**Interfaces:**

```ts
export interface InstalledRoutePackage {
  routeId: string;
  contentVersion: number;
  geometryVersion: number;
  byteSize: number;
  md5: string | null;
  localUri: string;
}

export type OfflinePackageState = 'not-downloaded' | 'ready' | 'stale';
```

- [ ] **Step 1: Write RED tests**

`packages/offline-sync/src/route-package.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { OfflineRoutePackageManifest } from '@magina-aventura/contracts';
import { evaluateOfflinePackage, offlinePackageFileName, resolvePmtilesUri } from './route-package';

const manifest: OfflineRoutePackageManifest = {
  manifestVersion: 1,
  routeId: 'route-1',
  contentVersion: 3,
  geometryVersion: 2,
  map: {
    id: 'asset-1',
    objectKey: 'routes/route-1/geometry/2/basemap.pmtiles',
    remoteUrl: 'https://cdn.example.test/map.pmtiles',
    byteSize: 1000,
    md5: 'abc',
    minZoom: 10,
    maxZoom: 16,
    bounds: [-3.5, 37.6, -3.4, 37.8],
    styleJson: '{"version":8,"sources":{},"layers":[]}'
  }
};

describe('route offline package', () => {
  it('marks missing package as not-downloaded', () => {
    expect(evaluateOfflinePackage(null, manifest)).toBe('not-downloaded');
  });

  it('marks geometry mismatch as stale', () => {
    expect(evaluateOfflinePackage({
      routeId: 'route-1', contentVersion: 3, geometryVersion: 1,
      byteSize: 1000, md5: 'abc', localUri: 'file:///route.pmtiles',
    }, manifest)).toBe('stale');
  });

  it('marks exact package as ready', () => {
    expect(evaluateOfflinePackage({
      routeId: 'route-1', contentVersion: 3, geometryVersion: 2,
      byteSize: 1000, md5: 'abc', localUri: 'file:///route.pmtiles',
    }, manifest)).toBe('ready');
  });

  it('builds deterministic file name and local source', () => {
    expect(offlinePackageFileName(manifest)).toBe('route-route-1-g2.pmtiles');
    expect(resolvePmtilesUri(manifest, 'file:///route.pmtiles')).toBe('pmtiles://file:///route.pmtiles');
  });
});
```

Run:

```bash
pnpm --filter @magina-aventura/offline-sync test -- src/route-package.test.ts
```

Expected: FAIL because the module is absent.

- [ ] **Step 2: Implement pure package logic**

`packages/offline-sync/src/route-package.ts`:

```ts
import type { OfflineRoutePackageManifest } from '@magina-aventura/contracts';

export interface InstalledRoutePackage {
  routeId: string;
  contentVersion: number;
  geometryVersion: number;
  byteSize: number;
  md5: string | null;
  localUri: string;
}

export type OfflinePackageState = 'not-downloaded' | 'ready' | 'stale';

export function evaluateOfflinePackage(
  installed: InstalledRoutePackage | null,
  manifest: OfflineRoutePackageManifest,
): OfflinePackageState {
  if (!installed) return 'not-downloaded';
  const checksumMatches = manifest.map.md5 === null || installed.md5 === manifest.map.md5;
  const matches =
    installed.routeId === manifest.routeId &&
    installed.contentVersion === manifest.contentVersion &&
    installed.geometryVersion === manifest.geometryVersion &&
    installed.byteSize === manifest.map.byteSize &&
    checksumMatches;
  return matches ? 'ready' : 'stale';
}

export function offlinePackageFileName(manifest: OfflineRoutePackageManifest): string {
  return `route-${manifest.routeId}-g${manifest.geometryVersion}.pmtiles`;
}

export function resolvePmtilesUri(
  manifest: OfflineRoutePackageManifest,
  localUri?: string,
): string {
  if (localUri) {
    if (!localUri.startsWith('file://')) throw new Error('PMTiles local URI must use file://');
    return `pmtiles://${localUri}`;
  }
  if (!manifest.map.remoteUrl.startsWith('https://')) throw new Error('PMTiles remote URL must use HTTPS');
  return `pmtiles://${manifest.map.remoteUrl}`;
}
```

Export it from `packages/offline-sync/src/index.ts`.

- [ ] **Step 3: Verify GREEN and commit**

```bash
pnpm --filter @magina-aventura/offline-sync test
pnpm --filter @magina-aventura/offline-sync typecheck
git add packages/offline-sync
git commit -m "feat: add versioned offline route package rules"
```

Expected: PASS / PASS before commit.

---

### Task 7: Expo FileSystem Downloader with Persistent Sidecar Metadata

**Files:**
- Create: `apps/mobile/src/offline/route-package-port.ts`
- Create: `apps/mobile/src/offline/route-package-store.ts`
- Create: `apps/mobile/src/offline/route-package-store.test.ts`
- Create: `apps/mobile/src/offline/expo-route-package-port.ts`

**Interfaces:**

```ts
export interface RoutePackagePort {
  download(remoteUrl: string, fileName: string): Promise<{ uri: string; size: number; md5: string | null }>;
  remove(uri: string): Promise<void>;
  readMetadata(routeId: string): Promise<InstalledRoutePackage | null>;
  writeMetadata(metadata: InstalledRoutePackage): Promise<void>;
}
```

- [ ] **Step 1: Write RED orchestration tests**

`apps/mobile/src/offline/route-package-store.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import type { OfflineRoutePackageManifest } from '@magina-aventura/contracts';
import { downloadRoutePackage } from './route-package-store';

const manifest: OfflineRoutePackageManifest = {
  manifestVersion: 1,
  routeId: 'route-1', contentVersion: 1, geometryVersion: 1,
  map: {
    id: 'asset-1', objectKey: 'routes/route-1/geometry/1/basemap.pmtiles',
    remoteUrl: 'https://cdn.example.test/map.pmtiles', byteSize: 100,
    md5: 'hash', minZoom: 10, maxZoom: 16,
    bounds: [-3.5, 37.6, -3.4, 37.8],
    styleJson: '{"version":8,"sources":{},"layers":[]}'
  }
};

function fakePort(size = 100, md5: string | null = 'hash') {
  return {
    download: vi.fn(async () => ({ uri: 'file:///route.pmtiles', size, md5 })),
    remove: vi.fn(async () => undefined),
    readMetadata: vi.fn(async () => null),
    writeMetadata: vi.fn(async () => undefined),
  };
}

describe('downloadRoutePackage', () => {
  it('persists a verified package', async () => {
    const port = fakePort();
    const installed = await downloadRoutePackage(port, manifest);
    expect(installed.localUri).toBe('file:///route.pmtiles');
    expect(port.writeMetadata).toHaveBeenCalledWith(installed);
  });

  it('removes file on size mismatch', async () => {
    const port = fakePort(99);
    await expect(downloadRoutePackage(port, manifest)).rejects.toThrow('Downloaded PMTiles size mismatch');
    expect(port.remove).toHaveBeenCalledWith('file:///route.pmtiles');
  });

  it('removes file on checksum mismatch', async () => {
    const port = fakePort(100, 'other');
    await expect(downloadRoutePackage(port, manifest)).rejects.toThrow('Downloaded PMTiles checksum mismatch');
    expect(port.remove).toHaveBeenCalledWith('file:///route.pmtiles');
  });
});
```

Run:

```bash
pnpm --filter @magina-aventura/mobile test -- src/offline/route-package-store.test.ts
```

Expected: FAIL because modules are absent.

- [ ] **Step 2: Implement port and store**

`apps/mobile/src/offline/route-package-port.ts`:

```ts
import type { InstalledRoutePackage } from '@magina-aventura/offline-sync';

export interface RoutePackagePort {
  download(remoteUrl: string, fileName: string): Promise<{ uri: string; size: number; md5: string | null }>;
  remove(uri: string): Promise<void>;
  readMetadata(routeId: string): Promise<InstalledRoutePackage | null>;
  writeMetadata(metadata: InstalledRoutePackage): Promise<void>;
}
```

`apps/mobile/src/offline/route-package-store.ts`:

```ts
import type { OfflineRoutePackageManifest } from '@magina-aventura/contracts';
import { offlinePackageFileName, type InstalledRoutePackage } from '@magina-aventura/offline-sync';
import type { RoutePackagePort } from './route-package-port';

export async function downloadRoutePackage(
  port: RoutePackagePort,
  manifest: OfflineRoutePackageManifest,
): Promise<InstalledRoutePackage> {
  const downloaded = await port.download(manifest.map.remoteUrl, offlinePackageFileName(manifest));

  if (downloaded.size !== manifest.map.byteSize) {
    await port.remove(downloaded.uri);
    throw new Error('Downloaded PMTiles size mismatch');
  }
  if (manifest.map.md5 !== null && downloaded.md5 !== manifest.map.md5) {
    await port.remove(downloaded.uri);
    throw new Error('Downloaded PMTiles checksum mismatch');
  }

  const metadata: InstalledRoutePackage = {
    routeId: manifest.routeId,
    contentVersion: manifest.contentVersion,
    geometryVersion: manifest.geometryVersion,
    byteSize: downloaded.size,
    md5: downloaded.md5,
    localUri: downloaded.uri,
  };
  await port.writeMetadata(metadata);
  return metadata;
}
```

- [ ] **Step 3: Implement Expo FileSystem adapter**

`apps/mobile/src/offline/expo-route-package-port.ts`:

```ts
import { Directory, File, Paths } from 'expo-file-system';
import type { InstalledRoutePackage } from '@magina-aventura/offline-sync';
import type { RoutePackagePort } from './route-package-port';

const root = new Directory(Paths.document, 'magina-aventura', 'routes');

function ensureRoot() {
  if (!root.exists) root.create({ intermediates: true, idempotent: true });
}

function metadataFile(routeId: string) {
  return new File(root, `route-${routeId}.json`);
}

export const expoRoutePackagePort: RoutePackagePort = {
  async download(remoteUrl, fileName) {
    ensureRoot();
    const target = new File(root, fileName);
    const file = await File.downloadFileAsync(remoteUrl, target, { idempotent: true });
    return { uri: file.uri, size: file.size, md5: file.md5 };
  },

  async remove(uri) {
    const file = new File(uri);
    if (file.exists) file.delete();
  },

  async readMetadata(routeId) {
    ensureRoot();
    const file = metadataFile(routeId);
    if (!file.exists) return null;
    return JSON.parse(await file.text()) as InstalledRoutePackage;
  },

  async writeMetadata(metadata) {
    ensureRoot();
    const file = metadataFile(metadata.routeId);
    file.write(JSON.stringify(metadata));
  },
};
```

If installed SDK 57 types expose `textSync()` instead of async `text()`, use the exact typed equivalent and keep the same port contract.

- [ ] **Step 4: Verify GREEN and commit**

```bash
pnpm --filter @magina-aventura/mobile test -- src/offline/route-package-store.test.ts
pnpm --filter @magina-aventura/mobile typecheck
git add apps/mobile/src/offline
git commit -m "feat: add durable PMTiles route package downloader"
```

Expected: PASS / PASS before commit.

---

### Task 8: Route Repository Boundary, UI Integration, R2 Contract and Final CI

**Files:**
- Create: `apps/mobile/src/features/routes/route-map-repository.ts`
- Create: `apps/mobile/src/features/routes/development-route-map-repository.ts`
- Create: `apps/mobile/src/features/routes/development-route-map-repository.test.ts`
- Modify: `apps/mobile/app/routes/[slug].tsx`
- Modify: `apps/mobile/app/routes/[slug]/prepare.tsx`
- Create: `docs/architecture/map-assets-r2.md`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**

```ts
export interface RouteMapRepository {
  getMapPayload(slug: string): Promise<RouteMapPayload | null>;
  getOfflineManifest(slug: string): Promise<OfflineRoutePackageManifest | null>;
}
```

- [ ] **Step 1: Write RED repository tests**

`development-route-map-repository.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { developmentRouteMapRepository } from './development-route-map-repository';

describe('developmentRouteMapRepository', () => {
  it('does not invent authoritative geometry', async () => {
    const payload = await developmentRouteMapRepository.getMapPayload('cuadros-development');
    expect(payload).toBeNull();
  });

  it('returns null for unknown manifest', async () => {
    expect(await developmentRouteMapRepository.getOfflineManifest('missing-route')).toBeNull();
  });
});
```

Run:

```bash
pnpm --filter @magina-aventura/mobile test -- src/features/routes/development-route-map-repository.test.ts
```

Expected: FAIL because repository files are absent.

- [ ] **Step 2: Implement repository boundary without fabricated route line**

`route-map-repository.ts`:

```ts
import type { OfflineRoutePackageManifest, RouteMapPayload } from '@magina-aventura/contracts';

export interface RouteMapRepository {
  getMapPayload(slug: string): Promise<RouteMapPayload | null>;
  getOfflineManifest(slug: string): Promise<OfflineRoutePackageManifest | null>;
}
```

`development-route-map-repository.ts`:

```ts
import type { RouteMapRepository } from './route-map-repository';

export const developmentRouteMapRepository: RouteMapRepository = {
  async getMapPayload() {
    return null;
  },
  async getOfflineManifest() {
    return null;
  },
};
```

This remains null until a verified GPX/map asset is imported. Do not add a synthetic Cuadros line merely to make the UI look complete.

- [ ] **Step 3: Integrate route detail and preparation state**

In `[slug].tsx`, load the repository payload/manifest in an effect keyed by slug. Render `RouteMap` with the payload. If a manifest exists, read installed metadata through `expoRoutePackagePort`, evaluate it with `evaluateOfflinePackage`, and expose copy exactly as:

```ts
const offlineCopy = {
  'not-downloaded': 'No descargado',
  ready: 'Listo sin conexión',
  stale: 'Actualización disponible',
} as const;
```

While an explicit download promise is running, screen-local UI state displays `Descargando`. On failure it displays `Error de descarga` and preserves retry. On success, re-read/evaluate metadata and materialize the map style with the local PMTiles URI.

In `prepare.tsx`, show `Listo sin conexión` only for `ready`; otherwise show the current status. Do not claim GPS/background readiness in this subsystem.

- [ ] **Step 4: Document R2 immutable asset contract**

`docs/architecture/map-assets-r2.md` must contain this exact key convention:

```text
routes/{routeId}/geometry/{geometryVersion}/basemap.pmtiles
```

and this required origin behavior:

```text
HTTPS
Accept-Ranges: bytes
Content-Type: application/vnd.pmtiles (preferred)
Cache-Control: public, max-age=31536000, immutable
```

Document that CORS uses explicit allowed admin/web origins rather than `*` by default and that credentials never enter Git. R2 provisioning itself is an environment operation, not a code dependency.

- [ ] **Step 5: Extend final CI gate**

Keep existing typecheck/tests/boundary/Supabase steps, ensure pgTAP runs, and add native config generation:

```yaml
      - name: Database tests
        run: supabase test db

      - name: Verify Expo native MapLibre config
        working-directory: apps/mobile
        run: pnpm exec expo prebuild --platform android --no-install --clean
```

Extend the pure-boundary command to include `packages/route-import/src`:

```bash
if grep -R -n -E "from ['\"]expo|@supabase|maplibre|react-native" \
  packages/domain/src packages/geo/src packages/contracts/src \
  packages/offline-sync/src packages/route-import/src; then
  echo "Infrastructure import detected in pure packages"
  exit 1
fi
```

- [ ] **Step 6: Run complete verification**

```bash
pnpm typecheck
pnpm test
supabase start -x studio,imgproxy,inbucket,realtime,storage-api,edge-runtime,logflare,vector,supavisor
supabase db reset
supabase test db
cd apps/mobile
pnpm exec expo prebuild --platform android --no-install --clean
cd ../..
```

Expected: every command exits 0.

Then verify boundary command above returns no matches.

- [ ] **Step 7: Commit final integration**

```bash
git add apps/mobile/app/routes apps/mobile/src/features/routes docs/architecture/map-assets-r2.md .github/workflows/ci.yml
git commit -m "feat: integrate MapLibre route and offline preparation flow"
```

---

## Self-Review Checklist Before Declaring Completion

- Spec coverage: every acceptance criterion in `docs/superpowers/specs/2026-09-15-maplibre-gpx-offline-design.md` maps to Tasks 1-8.
- Placeholder scan: the plan contains no `TODO`, `TBD`, `implement later`, or unnamed error-handling steps.
- Type consistency: `RouteMapPayload`, `OfflineRoutePackageManifest`, `InstalledRoutePackage`, `RouteMapRepository` and PMTiles URI rules use the same property names in every task.
- Data integrity: no task adds a fabricated Cuadros track.
- Offline semantics: PMTiles is an explicit file download; `OfflineManager` is not used for PMTiles.
- Security: draft route payloads and route-map assets remain hidden by status/RLS.

## Exit Criteria

This plan is complete only when all Task 1-8 RED/GREEN cycles have been observed and the final verification command set passes. Specifically, shared contracts/geometry/GPX/offline packages typecheck without infrastructure imports; pgTAP proves public draft exclusion; MapLibre prebuild succeeds; route detail uses `RouteMap`; no fabricated Cuadros line is displayed; PMTiles can resolve to remote or verified local file; offline metadata survives app restart via sidecar JSON; R2 object/version contract is documented; CI is green; and `main` remains unchanged.

## Next Plan

After this subsystem is green, the next independent plan is **Activity Engine + deterministic GPS replay**. It consumes `RouteMapPayload`, `packages/geo`, the existing activity state machine in `packages/domain`, and the offline route package without changing the contracts defined here.
