# Mágina Aventura Admin Catalog Ingest V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the verified 17-route Sierra Mágina official catalog into the existing Super Admin as auditable draft route records without inventing missing values, while preserving Route Master V2 publication gates.

**Architecture:** Keep `routes` as the single operational identity and add a nullable canonical-import layer around it. Canonical facts, multi-municipality membership, imported restrictions, POIs and geometry leads live in dedicated tables; reviewed operational content continues to live in `route_versions`, `route_geometries`, `route_access_points`, `route_track_sources` and `route_safety_incidents`. Initial data is loaded from a versioned JSON manifest and an idempotent SQL ingester; Route Master V2 reads both layers but only publishes through the existing V2 readiness path.

**Tech Stack:** PostgreSQL/Supabase, PostGIS, pgTAP database tests, native ES modules in `apps/admin`, Node.js >=22.13, pnpm 10.15.0, existing GitHub Actions CI.

**Spec:** `docs/superpowers/specs/2026-09-16-admin-catalog-ingest-v1-design.md`

## Global Constraints

- Work only on `feat/admin-catalog-ingest-v1`, based on `feat/admin-v1`.
- Do not modify `main`, RC/mobile product flows, Weather, GPS, Community, or PR #28.
- Never store an unknown numeric fact as `0`; `null` means unknown/not verified and `0` means a real zero.
- Importing a catalog route never publishes it.
- Every imported route starts as `routes.status='draft'` unless it already exists with a manually managed status; re-import must not downgrade or publish existing manual work.
- `routes.id` remains the internal UUID. `canonical_catalog_id` is the stable cross-environment import key.
- Do not create fake `route_versions` or `route_geometries` just to satisfy current NOT NULL constraints.
- Preserve current Route Master V2, security, RLS, audit, media, rewards, community and notification behavior.
- Preserve `routes.municipality_id` for compatibility, but use `route_municipalities` as the authoritative multi-municipality relation for new Admin reads.
- Imported blocking restrictions must block Route Master V2 readiness exactly like active blocking safety incidents.
- Community geometry must never be promoted as official geometry without provenance and explicit validation.
- Re-importing the same manifest must be idempotent: no duplicate routes, sources, municipality links or restrictions.
- Initial manifest snapshot is `2026-09-16-v1` from catalog commit `d252a9d4da3dec4e0e96556e47b4083c12a23f78`.

---

## File Structure

Create or modify only these units for V1:

```text
data/catalog/sierra-magina-official-v1.json
supabase/migrations/202609160030_admin_catalog_ingest_schema.sql
supabase/migrations/202609160031_admin_catalog_ingest_rpc.sql
supabase/migrations/202609160032_admin_catalog_readiness_snapshot.sql
supabase/migrations/202609160033_sierra_magina_official_catalog_v1.sql
supabase/tests/database/admin_catalog_ingest_schema_test.sql
supabase/tests/database/admin_catalog_ingest_rpc_test.sql
supabase/tests/database/admin_catalog_readiness_test.sql
supabase/tests/database/admin_catalog_seed_test.sql
apps/admin/src/core/catalog-import.mjs
apps/admin/src/core/route-master-view.mjs
apps/admin/tests/catalog-import.test.mjs
apps/admin/tests/route-master-view.test.mjs
apps/admin/styles.css
```

Existing migrations are immutable; all changes are additive migrations numbered after `202609160029_route_content_v2_admin.sql`.

---

### Task 1: Add the canonical Admin storage layer

**Files:**
- Create: `supabase/migrations/202609160030_admin_catalog_ingest_schema.sql`
- Create: `supabase/tests/database/admin_catalog_ingest_schema_test.sql`

**Interfaces:**
- Produces tables/columns later tasks consume: `routes.canonical_catalog_id`, `routes.catalog_origin`, `route_catalog_profiles`, `route_municipalities`, `route_catalog_restrictions`, `route_catalog_pois`, `route_catalog_track_leads`, `catalog_import_runs`, and source provenance columns on `route_sources`.
- Existing `route_versions` and `route_geometries` are not altered in this task.

- [ ] **Step 1: Write the failing pgTAP schema test**

Create `supabase/tests/database/admin_catalog_ingest_schema_test.sql` with assertions for all new objects:

```sql
begin;
select plan(35);

select has_column('public','routes','canonical_catalog_id');
select has_column('public','routes','catalog_origin');
select col_is_unique('public','routes','canonical_catalog_id');

select has_table('public','route_catalog_profiles');
select has_table('public','route_municipalities');
select has_table('public','route_catalog_restrictions');
select has_table('public','route_catalog_pois');
select has_table('public','route_catalog_track_leads');
select has_table('public','catalog_import_runs');

select has_column('public','route_sources','external_source_id');
select has_column('public','route_sources','verification_state');

select fk_ok('public','route_catalog_profiles','route_id','public','routes','id');
select fk_ok('public','route_municipalities','route_id','public','routes','id');
select fk_ok('public','route_municipalities','municipality_id','public','municipalities','id');
select fk_ok('public','route_catalog_restrictions','route_id','public','routes','id');
select fk_ok('public','route_catalog_pois','route_id','public','routes','id');
select fk_ok('public','route_catalog_track_leads','route_id','public','routes','id');

select policies_are('public','route_catalog_profiles',array['route managers read catalog profiles']);
select policies_are('public','route_municipalities',array['route managers read route municipalities']);
select policies_are('public','route_catalog_restrictions',array['route managers read catalog restrictions']);
select policies_are('public','route_catalog_pois',array['route managers read catalog pois']);
select policies_are('public','route_catalog_track_leads',array['route managers read catalog track leads']);
select policies_are('public','catalog_import_runs',array['route managers read catalog imports']);

select finish();
rollback;
```

Expand the test to 35 exact assertions by also checking primary keys, unique constraints, RLS and enum/check-compatible columns listed below.

- [ ] **Step 2: Run database tests and verify the new test fails**

Run:

```bash
supabase db reset
pg_prove -h 127.0.0.1 -p 54322 -U postgres -d postgres supabase/tests/database/admin_catalog_ingest_schema_test.sql
```

Expected: FAIL because the canonical catalog tables/columns do not exist.

- [ ] **Step 3: Implement route identity extensions**

In `202609160030_admin_catalog_ingest_schema.sql`:

```sql
alter table public.routes
  add column canonical_catalog_id text unique,
  add column catalog_origin text;

alter table public.route_sources
  add column external_source_id text,
  add column verification_state text
    check (verification_state is null or verification_state in (
      'official_verified','cross_checked','community_unverified','editorial_derived','stale','unknown'
    ));

create unique index route_sources_external_source_uidx
  on public.route_sources(route_id,external_source_id)
  where external_source_id is not null;
```

- [ ] **Step 4: Implement `route_catalog_profiles`**

Use this exact shape:

```sql
create table public.route_catalog_profiles (
  route_id uuid primary key references public.routes(id) on delete cascade,
  canonical_catalog_id text not null unique,
  source_snapshot_version text not null,
  source_snapshot_commit text not null,
  verification_state text not null check (verification_state in (
    'official_verified','cross_checked','community_unverified','editorial_derived','stale','unknown'
  )),
  route_kind text check (route_kind is null or route_kind in ('circular','linear','out_and_back')),
  distance_km numeric(8,3) check (distance_km is null or distance_km >= 0),
  duration_minutes_min integer check (duration_minutes_min is null or duration_minutes_min > 0),
  duration_minutes_max integer check (duration_minutes_max is null or duration_minutes_max > 0),
  official_difficulty text check (official_difficulty is null or official_difficulty in ('easy','moderate','hard','expert')),
  elevation_gain_m integer check (elevation_gain_m is null or elevation_gain_m >= 0),
  elevation_loss_m integer check (elevation_loss_m is null or elevation_loss_m >= 0),
  elevation_min_m integer,
  elevation_max_m integer,
  family_profile jsonb not null default '{}'::jsonb check (jsonb_typeof(family_profile)='object'),
  accessibility_facts jsonb not null default '[]'::jsonb check (jsonb_typeof(accessibility_facts)='array'),
  stable_safety_facts jsonb not null default '[]'::jsonb check (jsonb_typeof(stable_safety_facts)='array'),
  editorial_facts jsonb not null default '[]'::jsonb check (jsonb_typeof(editorial_facts)='array'),
  source_checked_at timestamptz not null,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (duration_minutes_min is null or duration_minutes_max is null or duration_minutes_max >= duration_minutes_min),
  check (elevation_min_m is null or elevation_max_m is null or elevation_max_m >= elevation_min_m)
);
```

- [ ] **Step 5: Implement many-to-many municipalities**

```sql
create table public.route_municipalities (
  route_id uuid not null references public.routes(id) on delete cascade,
  municipality_id uuid not null references public.municipalities(id) on delete restrict,
  is_primary boolean not null default false,
  source_kind text not null default 'catalog' check (source_kind in ('catalog','admin','field')),
  created_at timestamptz not null default now(),
  primary key(route_id,municipality_id)
);

create unique index route_municipalities_one_primary_uidx
  on public.route_municipalities(route_id)
  where is_primary;
```

- [ ] **Step 6: Implement imported restrictions, POIs and track leads**

```sql
create table public.route_catalog_restrictions (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  external_restriction_id text not null,
  restriction_type text not null,
  severity text not null check (severity in ('info','warning','restricting','blocking')),
  status text not null check (status in ('active','scheduled','resolved','unknown')),
  starts_at timestamptz,
  ends_at timestamptz,
  published_at timestamptz,
  checked_at timestamptz not null,
  reason text not null,
  source_external_ids text[] not null default '{}',
  verification_state text not null,
  imported_at timestamptz not null default now(),
  unique(route_id,external_restriction_id)
);

create table public.route_catalog_pois (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  external_poi_id text not null,
  name text not null,
  category text not null,
  longitude numeric,
  latitude numeric,
  water_metadata jsonb,
  verification_state text not null,
  source_external_ids text[] not null default '{}',
  notes text not null default '',
  imported_at timestamptz not null default now(),
  unique(route_id,external_poi_id),
  check ((longitude is null and latitude is null) or (longitude between -180 and 180 and latitude between -90 and 90))
);

create table public.route_catalog_track_leads (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  external_source_id text,
  source_url text not null check (source_url ~ '^https?://'),
  format text not null check (format in ('gpx','kml','gml','geojson')),
  source_kind text not null check (source_kind in ('official','field','community','manual')),
  status text not null default 'discovered' check (status in ('discovered','fetched','validated','unavailable')),
  notes text not null default '',
  checked_at timestamptz not null,
  fetched_at timestamptz,
  validated_at timestamptz,
  unique(route_id,source_url,format)
);
```

- [ ] **Step 7: Implement import-run ledger**

```sql
create table public.catalog_import_runs (
  id uuid primary key default gen_random_uuid(),
  catalog_name text not null,
  snapshot_version text not null,
  source_commit text not null,
  manifest_sha256 text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null check (status in ('running','completed','failed')),
  route_count integer not null default 0 check (route_count >= 0),
  source_count integer not null default 0 check (source_count >= 0),
  restriction_count integer not null default 0 check (restriction_count >= 0),
  poi_count integer not null default 0 check (poi_count >= 0),
  notes text not null default ''
);
```

- [ ] **Step 8: Enable RLS, read grants, policies and audit triggers**

Enable RLS on all six new tables. Grant `select` to `authenticated`. Use exactly these policies:

```text
route managers read catalog profiles
route managers read route municipalities
route managers read catalog restrictions
route managers read catalog pois
route managers read catalog track leads
route managers read catalog imports
```

Every policy condition is:

```sql
private.admin_has_capability('routes.manage',auth.uid())
```

Attach the existing `private.audit_row_change()` trigger to `route_catalog_profiles`, `route_municipalities`, `route_catalog_restrictions`, `route_catalog_pois`, and `route_catalog_track_leads` for `insert or update or delete`.

- [ ] **Step 9: Re-run schema test and full database contract tests**

Run:

```bash
supabase db reset
pg_prove -h 127.0.0.1 -p 54322 -U postgres -d postgres supabase/tests/database/*.sql
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add supabase/migrations/202609160030_admin_catalog_ingest_schema.sql supabase/tests/database/admin_catalog_ingest_schema_test.sql
git commit -m "feat(admin): add canonical catalog storage layer"
```

---

### Task 2: Add idempotent manifest ingestion

**Files:**
- Create: `supabase/migrations/202609160031_admin_catalog_ingest_rpc.sql`
- Create: `supabase/tests/database/admin_catalog_ingest_rpc_test.sql`

**Interfaces:**
- Consumes: a JSON manifest with keys `catalog`, `snapshot_version`, `source_commit`, `manifest_sha256`, `routes`, `sources`, `restrictions`, `pois`, `track_leads`.
- Produces: `private.apply_catalog_manifest(payload jsonb, actor uuid default null) returns jsonb` and authenticated wrapper `public.admin_ingest_catalog_manifest(payload jsonb) returns jsonb`.

- [ ] **Step 1: Write failing pgTAP tests for import semantics**

The test must create an authenticated Super Admin fixture using the existing Admin test pattern, then call `public.admin_ingest_catalog_manifest` twice with the same minimal two-route payload and assert:

```sql
select is((select count(*) from public.routes where canonical_catalog_id like 'test-%')::integer,2,'creates two route identities once');
select is((select count(*) from public.route_catalog_profiles where canonical_catalog_id like 'test-%')::integer,2,'creates two catalog profiles once');
select is((select count(*) from public.route_sources where external_source_id='test-source')::integer,2,'one source row per route');
select is((select count(*) from public.route_municipalities rm join public.routes r on r.id=rm.route_id where r.canonical_catalog_id='test-2')::integer,2,'preserves multiple municipalities');
select is((select count(*) from public.route_catalog_restrictions where external_restriction_id='test-closure')::integer,1,'restriction is idempotent');
```

Also assert that re-importing does not create any `route_versions` or `route_geometries` and does not change a route manually moved from `draft` to `review`.

- [ ] **Step 2: Run the RPC test and verify failure**

Expected: FAIL because the import functions do not exist.

- [ ] **Step 3: Validate manifest header and route payloads**

`private.apply_catalog_manifest` must reject:

```text
payload not object
missing catalog/snapshot_version/source_commit/manifest_sha256/routes/sources/restrictions/pois/track_leads
routes/sources/restrictions/pois/track_leads not arrays
duplicate canonical IDs inside payload
route with missing id/slug/name/primary_municipality
municipality slug not present in public.municipalities
invalid route_kind/difficulty
```

Use explicit `raise exception` messages such as `catalog manifest routes must be an array`, `catalog route canonical id required`, and `catalog municipality not found: %`.

- [ ] **Step 4: Upsert route identity without overwriting manual state**

For each route:

1. Resolve primary municipality by slug.
2. Insert `routes(canonical_catalog_id,catalog_origin,route_code,municipality_id,slug,title,status)` with status `draft`.
3. On conflict `(canonical_catalog_id)`, update only `catalog_origin` and set `route_code` only when the existing `route_code` is null.
4. Do **not** overwrite existing `title`, `slug`, `status`, `current_content_version`, or `current_geometry_version` during re-import.
5. Insert `route_validation_status` with pending/missing defaults using `on conflict do nothing`.

Route codes for the official manifest are `MA-001` through `MA-017`.

- [ ] **Step 5: Upsert canonical profile and municipalities**

Replace the imported profile fields for that `route_id` with the current manifest values. Synchronize only `route_municipalities` rows whose `source_kind='catalog'`; preserve rows added with `source_kind='admin'` or `field`.

The manifest's `primary_municipality` receives `is_primary=true`; additional municipality slugs receive `false`.

- [ ] **Step 6: Upsert route sources**

For every source id referenced by a route, find the matching manifest `sources[]` object and upsert `route_sources` using `(route_id,external_source_id)`:

```text
label = source.title
url = source.url
source_type = official when source.source_type = official_authority; otherwise other
official = source.verification_state = official_verified
checked_at = source.checked_at
external_source_id = source.id
verification_state = source.verification_state
notes = 'Importado de catálogo canónico ' || snapshot_version
```

Do not delete manual source rows with `external_source_id is null`.

- [ ] **Step 7: Upsert restrictions, POIs and track leads**

Use their external ids as the idempotence keys defined in Task 1. Delete/reinsert only rows belonging to the imported canonical payload for the affected route; do not touch operational `route_safety_incidents`, `route_access_points`, `checkpoints`, `discoveries`, or `route_track_sources`.

- [ ] **Step 8: Write import-run audit**

Insert `catalog_import_runs(status='running')` before route processing. On successful completion update it to `completed` with counts. Return:

```json
{
  "import_run_id": "uuid",
  "catalog": "sierra-magina-official",
  "snapshot_version": "2026-09-16-v1",
  "routes": 17,
  "sources": 19,
  "restrictions": 2,
  "pois": 0,
  "track_leads": 0
}
```

If an exception occurs, PostgreSQL transaction rollback means no partial import survives. The public wrapper is the audited user path; migration seeding in Task 5 calls the private function directly with `actor=null`.

- [ ] **Step 9: Secure the public wrapper**

`public.admin_ingest_catalog_manifest(payload jsonb)` must:

```sql
if auth.uid() is null or not private.admin_has_capability('routes.manage',auth.uid()) then
  raise exception 'not authorized';
end if;
```

Revoke execution from `public` and `anon`; grant only to `authenticated`.

- [ ] **Step 10: Re-run database tests**

Expected: all database tests PASS.

- [ ] **Step 11: Commit**

```bash
git add supabase/migrations/202609160031_admin_catalog_ingest_rpc.sql supabase/tests/database/admin_catalog_ingest_rpc_test.sql
git commit -m "feat(admin): add idempotent catalog manifest ingestion"
```

---

### Task 3: Integrate canonical restrictions and catalog data into Route Master readiness/snapshot

**Files:**
- Create: `supabase/migrations/202609160032_admin_catalog_readiness_snapshot.sql`
- Create: `supabase/tests/database/admin_catalog_readiness_test.sql`

**Interfaces:**
- Extends existing `private.route_v2_readiness(uuid)` and `public.admin_route_master_snapshot(uuid)`.
- Produces additional snapshot keys: `catalog_profile`, `municipalities`, `catalog_restrictions`, `catalog_pois`, `catalog_track_leads`, `catalog_import`.

- [ ] **Step 1: Write failing readiness test**

Create one route with:

```text
route_validation_status exists
no operational safety incidents
one active catalog restriction severity=blocking
```

Assert:

```sql
select is((private.route_v2_readiness(route_id)->>'blocking_incidents')::integer,1,'canonical blocking restriction participates in readiness');
select is((private.route_v2_readiness(route_id)->>'ready')::boolean,false,'blocking canonical restriction prevents readiness');
select ok(private.route_v2_readiness(route_id)->'reasons' ? 'Existe una restricción oficial bloqueante','readiness exposes official restriction reason');
```

- [ ] **Step 2: Update readiness counting**

Replace the current blocking count with:

```sql
select
  (select count(*) from public.route_safety_incidents i
   where i.route_id=target_route_id
     and i.status='open'
     and i.blocks_adventure=true
     and i.starts_at <= now()
     and (i.ends_at is null or i.ends_at > now()))
  +
  (select count(*) from public.route_catalog_restrictions r
   where r.route_id=target_route_id
     and r.status='active'
     and r.severity='blocking'
     and (r.starts_at is null or r.starts_at <= now())
     and (r.ends_at is null or r.ends_at > now()))
into blocking_incidents;
```

If the catalog portion contributes >0, append exactly `Existe una restricción oficial bloqueante` to `reasons`.

- [ ] **Step 3: Extend Route Master snapshot**

Keep every existing key unchanged and add:

```json
{
  "catalog_profile": {},
  "municipalities": [],
  "catalog_restrictions": [],
  "catalog_pois": [],
  "catalog_track_leads": [],
  "catalog_import": {}
}
```

Municipalities are sorted with primary first, then name. `catalog_import` is the latest completed `catalog_import_runs` row matching the route profile snapshot version.

- [ ] **Step 4: Add snapshot pgTAP assertions**

Assert the six keys exist and that a 3-municipality route returns exactly three municipality entries without changing legacy `route.municipality` compatibility output.

- [ ] **Step 5: Run full database test suite**

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/202609160032_admin_catalog_readiness_snapshot.sql supabase/tests/database/admin_catalog_readiness_test.sql
git commit -m "feat(admin): expose canonical catalog data in Route Master"
```

---

### Task 4: Add the exact Sierra Mágina official V1 manifest

**Files:**
- Create: `data/catalog/sierra-magina-official-v1.json`
- Create: `apps/admin/src/core/catalog-import.mjs`
- Create: `apps/admin/tests/catalog-import.test.mjs`

**Interfaces:**
- Produces a repository artifact consumed by the seed migration and future import tooling.
- `validateCatalogManifest(manifest)` performs client-side structural validation only; database constraints remain authoritative.

- [ ] **Step 1: Write failing Node tests for manifest validation**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCatalogManifest, catalogImportSummary } from '../src/core/catalog-import.mjs';
import manifest from '../../../data/catalog/sierra-magina-official-v1.json' with { type: 'json' };

test('official Sierra Magina manifest contains 17 canonical routes', () => {
  const result = validateCatalogManifest(manifest);
  assert.equal(result.valid, true);
  assert.equal(manifest.routes.length, 17);
  assert.equal(new Set(manifest.routes.map((route) => route.canonical_catalog_id)).size, 17);
});

test('manifest preserves Veredon multi-municipality evidence', () => {
  const route = manifest.routes.find((item) => item.canonical_catalog_id === 'ma-junta-017');
  assert.deepEqual(route.municipalities, ['mancha-real','pegalajar','torres']);
});

test('manifest preserves official El Peralejo family fact', () => {
  const route = manifest.routes.find((item) => item.canonical_catalog_id === 'ma-junta-005');
  assert.equal(route.family_profile.factors[0].code,'official_family_friendly');
});
```

- [ ] **Step 2: Create manifest header**

Use exactly:

```json
{
  "catalog": "sierra-magina-official",
  "snapshot_version": "2026-09-16-v1",
  "source_branch": "feat/adventure-catalog-v1",
  "source_commit": "d252a9d4da3dec4e0e96556e47b4083c12a23f78",
  "manifest_sha256": "sha256:computed-in-task-5-from-this-exact-file",
  "routes": [],
  "sources": [],
  "restrictions": [],
  "pois": [],
  "track_leads": []
}
```

Before Task 5, replace the temporary `manifest_sha256` string with the real SHA-256 generated by:

```bash
node -e "const fs=require('fs'),c=require('crypto');const p='data/catalog/sierra-magina-official-v1.json';const x=JSON.parse(fs.readFileSync(p,'utf8'));x.manifest_sha256='';const canonical=JSON.stringify(x);console.log('sha256:'+c.createHash('sha256').update(canonical).digest('hex'))"
```

The hash is over the manifest with `manifest_sha256=''`, making verification deterministic and non-self-referential.

- [ ] **Step 3: Add the 17 exact route records**

Use this authoritative route matrix. Every route has `verification_state='official_verified'`, `status='draft'`, null elevation fields, and no geometry.

| canonical id | code | slug | name | primary municipality | municipalities | kind | km | min | difficulty |
| --- | --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| ma-junta-001 | MA-001 | adelfal-de-cuadros | Adelfal de Cuadros | bedmar-y-garciez | [bedmar-y-garciez] | linear | 0.453 | 20 | easy |
| ma-junta-002 | MA-002 | cano-del-aguadero | Caño del Aguadero | bedmar-y-garciez | [bedmar-y-garciez] | linear | 14.306 | 300 | hard |
| ma-junta-003 | MA-003 | castillo-de-albanchez | Castillo de Albanchez | albanchez-de-magina | [albanchez-de-magina] | linear | 0.206 | 20 | moderate |
| ma-junta-004 | MA-004 | castillo-de-mata-bejid | Castillo de Mata Bejid | cambil | [cambil] | linear | 3.550 | 75 | easy |
| ma-junta-005 | MA-005 | el-peralejo | El Peralejo | cambil | [cambil] | circular | 2.268 | 60 | easy |
| ma-junta-006 | MA-006 | fuenmayor | Fuenmayor | torres | [torres] | linear | 6.405 | 140 | moderate |
| ma-junta-007 | MA-007 | gibralberca | Gibralberca | cambil | [cambil] | circular | 5.653 | 120 | moderate |
| ma-junta-008 | MA-008 | hoyalinos | Hoyalinos | torres | [torres] | circular | 2.092 | 60 | moderate |
| ma-junta-009 | MA-009 | la-cueva-de-la-graja | La Cueva de la Graja | jimena | [jimena] | linear | 0.575 | 30 | moderate |
| ma-junta-010 | MA-010 | las-vinas | Las Viñas | bedmar-y-garciez | [bedmar-y-garciez] | circular | 8.720 | 180 | moderate |
| ma-junta-011 | MA-011 | pinar-de-canava | Pinar de Cánava | jimena | [jimena] | linear | 2.350 | 60 | hard |
| ma-junta-012 | MA-012 | puerto-de-la-mata | Puerto de la Mata | cambil | [cambil] | linear | 13.170 | 290 | moderate |
| ma-junta-013 | MA-013 | sierra-de-la-cruz | Sierra de la Cruz | jodar | [jodar] | circular | 7.292 | 150 | moderate |
| ma-junta-014 | MA-014 | subida-al-hoyo-de-la-laguna | Subida al Hoyo de la Laguna | belmez-de-la-moraleda | [belmez-de-la-moraleda] | linear | 5.475 | 180 | hard |
| ma-junta-015 | MA-015 | subida-a-pico-magina-y-miramundos | Subida a Pico Mágina y Miramundos | huelma | [huelma] | linear | 14.773 | 300 | hard |
| ma-junta-016 | MA-016 | umbria-de-los-corzos | Umbría de los Corzos | cambil | [cambil] | linear | 2.630 | 60 | easy |
| ma-junta-017 | MA-017 | veredon-mojon-blanco | Veredón-Mojón Blanco | pegalajar | [mancha-real,pegalajar,torres] | linear | 3.156 | 90 | moderate |

`duration_minutes_min` and `duration_minutes_max` both equal the matrix `min` value in V1 because the official sheet publishes one estimated duration.

El Peralejo `family_profile` must contain:

```json
{
  "editorialSuitability": "review_required",
  "minimumAge": null,
  "strollerViability": "unknown",
  "factors": [{
    "code": "official_family_friendly",
    "text": "La ficha oficial describe el sendero como corto, con poco desnivel y muy adecuado para ir con niños.",
    "sourceIds": ["junta-el-peralejo"],
    "verificationState": "official_verified"
  }]
}
```

All other routes use the same object with an empty `factors` array.

- [ ] **Step 4: Add the exact 19 source records**

All use publisher `Junta de Andalucía · Ventana del Visitante`, `source_type='official_authority'`, `verification_state='official_verified'`, `checked_at='2026-09-16'`. Add these ids and URL suffixes under the common base `https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content`:

```text
junta-sierra-magina-directory -> /es6160007-sierra-m%C3%81gina
junta-adelfal-de-cuadros -> /adelfal-de-cuadros/
junta-cano-del-aguadero -> /ca%C3%B1o-del-aguadero/255035
junta-castillo-de-albanchez -> /castillo-de-albanchez/255035
junta-castillo-de-mata-bejid -> /castillo-de-mata-bejid/255035
junta-el-peralejo -> /el-peralejo/255035
junta-fuenmayor -> /fuenmayor/null
junta-gibralberca -> /gibralberca-1/255035
junta-hoyalinos -> /hoyalinos/255035
junta-cueva-de-la-graja -> /la-cueva-de-la-graja/255035
junta-las-vinas -> /las-vi%C3%B1as/255035
junta-pinar-de-canava -> /pinar-de-c%C3%A1nava/255035
junta-puerto-de-la-mata -> /puerto-de-la-mata/255035
junta-sierra-de-la-cruz -> /sierra-de-la-cruz/255035
junta-hoyo-de-la-laguna -> /subida-al-hoyo-de-la-laguna/
junta-pico-magina-miramundos -> /subida-a-pico-m%C3%81gina-y-miramundos/255035
junta-umbria-de-los-corzos -> /umbr%C3%ADa-de-los-corzos/255035
junta-veredon-mojon-blanco -> /vered%C3%93n-moj%C3%93n-blanco/255035
junta-cuadros-closure -> /cuadros/null
```

`junta-cuadros-closure.published_at='2026-02-24'`; all other `published_at` values are null.

Each route's `source_ids` is the directory plus its individual sheet, except Hoyalinos which uses only `junta-hoyalinos`. The two closed routes also reference `junta-cuadros-closure` from their restriction records.

- [ ] **Step 5: Add the two current official restrictions**

```json
[
  {
    "id": "restriction-adelfal-de-cuadros-temporary-closure-2026",
    "route_id": "ma-junta-001",
    "type": "temporary_closure",
    "severity": "blocking",
    "status": "active",
    "published_at": "2026-02-24",
    "checked_at": "2026-09-16",
    "source_ids": ["junta-adelfal-de-cuadros","junta-cuadros-closure"],
    "verification_state": "official_verified"
  },
  {
    "id": "restriction-las-vinas-temporary-closure-2026",
    "route_id": "ma-junta-010",
    "type": "temporary_closure",
    "severity": "blocking",
    "status": "active",
    "published_at": "2026-02-24",
    "checked_at": "2026-09-16",
    "source_ids": ["junta-las-vinas","junta-cuadros-closure"],
    "verification_state": "official_verified"
  }
]
```

Use the exact reasons from the source catalog:

```text
Adelfal: La ficha oficial de Adelfal de Cuadros figura cerrada temporalmente y el entorno de Cuadros mantiene aviso oficial de cierre temporal.
Las Viñas: La ficha oficial de Las Viñas figura cerrada temporalmente y el entorno de Cuadros mantiene aviso oficial de cierre temporal.
```

Leave `pois=[]` and `track_leads=[]` in the first V1 manifest. Their tables are deliberately ready, but no guessed POI coordinates or non-direct geometry URL is inserted.

- [ ] **Step 6: Implement client-side validator**

`validateCatalogManifest(manifest)` returns:

```js
{ valid: boolean, errors: string[] }
```

Check header values, arrays, unique route canonical ids/codes/slugs, primary municipality membership, route kind/difficulty and that every `source_id`/restriction route id resolves inside the manifest.

`catalogImportSummary(manifest)` returns exactly:

```js
{
  routes: manifest.routes.length,
  sources: manifest.sources.length,
  restrictions: manifest.restrictions.length,
  pois: manifest.pois.length,
  trackLeads: manifest.track_leads.length
}
```

- [ ] **Step 7: Run Admin Node tests**

Run:

```bash
node --test apps/admin/tests/catalog-import.test.mjs
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add data/catalog/sierra-magina-official-v1.json apps/admin/src/core/catalog-import.mjs apps/admin/tests/catalog-import.test.mjs
git commit -m "data(admin): add Sierra Magina official catalog manifest"
```

---

### Task 5: Seed the 17 official routes through the same ingester

**Files:**
- Create: `supabase/migrations/202609160033_sierra_magina_official_catalog_v1.sql`
- Create: `supabase/tests/database/admin_catalog_seed_test.sql`
- Modify: `data/catalog/sierra-magina-official-v1.json` only to replace `manifest_sha256` with the deterministic final hash before generating the SQL payload.

**Interfaces:**
- Consumes the exact Task 4 manifest.
- Produces 17 real Admin draft routes after `supabase db reset`.

- [ ] **Step 1: Compute and freeze manifest SHA-256**

Run the Task 4 hash command, replace `manifest_sha256`, then re-run `validateCatalogManifest` tests. The SQL seed payload must byte-for-byte represent the same logical JSON object.

- [ ] **Step 2: Write failing seed test**

Assert after database reset:

```sql
select is((select count(*) from public.routes where catalog_origin='junta_sierra_magina')::integer,17,'seeds all 17 official routes');
select is((select count(*) from public.route_catalog_profiles)::integer,17,'seeds all 17 catalog profiles');
select is((select count(*) from public.route_sources where external_source_id is not null)::integer,35,'seeds route-scoped official source references');
select is((select count(*) from public.route_catalog_restrictions)::integer,2,'seeds two active official closures');
select is((select count(*) from public.routes where catalog_origin='junta_sierra_magina' and status<>'draft')::integer,0,'does not publish imported routes');
select is((select count(*) from public.route_versions rv join public.routes r on r.id=rv.route_id where r.catalog_origin='junta_sierra_magina')::integer,0,'does not fabricate operational content versions');
select is((select count(*) from public.route_geometries rg join public.routes r on r.id=rg.route_id where r.catalog_origin='junta_sierra_magina')::integer,0,'does not fabricate geometries');
select is((select count(*) from public.route_municipalities rm join public.routes r on r.id=rm.route_id where r.canonical_catalog_id='ma-junta-017')::integer,3,'Veredon stores three municipalities');
```

The expected source count 35 is route-scoped: 16 routes use directory + individual sheet (32 rows), Hoyalinos uses its own sheet (1 row), and Adelfal/Las Viñas reuse their route sources for restrictions rather than creating extra `route_sources` rows, for 33 route-source rows. If the implementation imports the closure notice itself as an additional route source for both closed routes, the expected count is 35. **Choose one behavior now:** V1 imports `junta-cuadros-closure` as an extra source on Adelfal and Las Viñas, so the required seed count is **35**.

- [ ] **Step 3: Create seed migration**

Embed the final manifest as a `$catalog$...$catalog$::jsonb` literal and call:

```sql
select private.apply_catalog_manifest(
  $catalog${...final manifest...}$catalog$::jsonb,
  null
);
```

No separate direct inserts are allowed; the seed must exercise the same importer used by future re-imports.

- [ ] **Step 4: Verify idempotence explicitly**

In the seed test, call `private.apply_catalog_manifest` once more with the same payload and assert all route/profile/restriction/municipality/source counts are unchanged.

- [ ] **Step 5: Run complete DB suite**

Run:

```bash
supabase db reset
pg_prove -h 127.0.0.1 -p 54322 -U postgres -d postgres supabase/tests/database/*.sql
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add data/catalog/sierra-magina-official-v1.json supabase/migrations/202609160033_sierra_magina_official_catalog_v1.sql supabase/tests/database/admin_catalog_seed_test.sql
git commit -m "data(admin): seed 17 official Sierra Magina routes"
```

---

### Task 6: Show imported catalog evidence in Route Master V2

**Files:**
- Modify: `apps/admin/src/core/route-master-view.mjs`
- Modify: `apps/admin/tests/route-master-view.test.mjs`
- Modify: `apps/admin/styles.css`

**Interfaces:**
- Consumes new keys from `admin_route_master_snapshot`.
- Produces a read-only `Catálogo oficial` tab and summary badges; does not edit imported facts.

- [ ] **Step 1: Write failing view tests**

Add assertions that:

```js
assert.ok(ROUTE_MASTER_TABS.some((tab) => tab.id === 'catalog' && tab.label === 'Catálogo oficial'));
assert.match(routeMasterHtml(snapshot), /Datos oficiales importados/);
assert.match(routeMasterHtml(snapshot), /Mancha Real/);
assert.match(routeMasterHtml(snapshot), /Pegalajar/);
assert.match(routeMasterHtml(snapshot), /Torres/);
assert.match(routeMasterHtml(snapshot), /Restricción oficial activa/);
assert.match(routeMasterHtml(snapshot), /Track oficial pendiente/);
```

Use a fixture snapshot with profile, three municipalities and one active blocking catalog restriction.

- [ ] **Step 2: Add tab model**

Append:

```js
{ id: 'catalog', label: 'Catálogo oficial' }
```

Badge values:

```text
Sin catálogo -> '—'
official_verified -> 'Oficial'
active blocking restriction -> 'Bloqueada'
otherwise -> 'Importada'
```

- [ ] **Step 3: Render read-only canonical profile**

Show:

```text
ID canónico
Snapshot/commit
Tipo
Distancia
Duración
Dificultad oficial
Municipios
Fecha de comprobación
Estado de verificación
Perfil familiar/evidencias
Accesibilidad
Restricciones oficiales
POI importados
Pistas de track
```

Unknown values render `Pendiente`, never `0`.

- [ ] **Step 4: Add status presentation**

For an active `blocking` catalog restriction render a red Admin status:

```text
Restricción oficial activa
```

For missing catalog track leads/geometry render:

```text
Track oficial pendiente
```

This presentation is informational; database readiness remains authoritative.

- [ ] **Step 5: Add focused CSS**

Add only styles under `.route-catalog-*` classes. Reuse existing status tokens and route master cards; do not redesign the Admin shell.

- [ ] **Step 6: Run Admin tests**

Run:

```bash
node --test apps/admin/tests/route-master-view.test.mjs apps/admin/tests/catalog-import.test.mjs
node apps/admin/scripts/check-modules.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/admin/src/core/route-master-view.mjs apps/admin/tests/route-master-view.test.mjs apps/admin/styles.css
git commit -m "feat(admin): show canonical route evidence in Route Master"
```

---

### Task 7: Add catalog import diagnostics without exposing privileged secrets

**Files:**
- Modify: `apps/admin/src/core/catalog-import.mjs`
- Modify: `apps/admin/src/core/api.mjs`
- Modify: `apps/admin/tests/catalog-import.test.mjs`

**Interfaces:**
- Produces `importCatalogManifest(api, manifest)` for an authenticated Admin session; it calls the existing generic Supabase RPC layer with `admin_ingest_catalog_manifest`.
- No service-role key, filesystem write, or hidden browser secret is introduced.

- [ ] **Step 1: Write failing API adapter test**

With a fake API object:

```js
const calls=[];
const api={ rpc: async (name,args) => { calls.push({name,args}); return { routes:17 }; } };
const result=await importCatalogManifest(api,manifest);
assert.equal(calls[0].name,'admin_ingest_catalog_manifest');
assert.deepEqual(calls[0].args,{payload:manifest});
assert.equal(result.routes,17);
```

Also assert invalid manifests reject before calling the API.

- [ ] **Step 2: Implement the adapter**

```js
export async function importCatalogManifest(api, manifest) {
  const validation = validateCatalogManifest(manifest);
  if (!validation.valid) throw new Error(`Manifest inválido: ${validation.errors.join('; ')}`);
  return api.rpc('admin_ingest_catalog_manifest', { payload: manifest });
}
```

If current `api.mjs` exposes RPC under a different method name, add a backwards-compatible `rpc(name,args)` method using the same authenticated request helper; do not alter existing call sites.

- [ ] **Step 3: Run tests and syntax checks**

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/core/catalog-import.mjs apps/admin/src/core/api.mjs apps/admin/tests/catalog-import.test.mjs
git commit -m "feat(admin): add authenticated catalog import adapter"
```

---

### Task 8: Final verification and integration boundary

**Files:**
- Modify: `docs/superpowers/specs/2026-09-16-admin-catalog-ingest-v1-design.md` only if implementation evidence requires a factual correction; do not change scope.
- No merge to `feat/admin-v1` or `main` in this task.

- [ ] **Step 1: Run complete repository verification**

From repository root:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm run admin:check
supabase db reset
pg_prove -h 127.0.0.1 -p 54322 -U postgres -d postgres supabase/tests/database/*.sql
pnpm --filter @magina-aventura/mobile exec expo prebuild --platform android --no-install
node scripts/check-package-boundaries.mjs
git diff --check
git diff --name-only feat/admin-v1...HEAD
```

If the root script names differ, use the exact commands from `.github/workflows/ci.yml` rather than inventing aliases.

- [ ] **Step 2: Verify data invariants with SQL**

Run against the reset DB:

```sql
select count(*) from routes where catalog_origin='junta_sierra_magina'; -- 17
select count(*) from route_catalog_profiles; -- 17
select count(*) from route_catalog_restrictions where status='active' and severity='blocking'; -- 2
select count(*) from route_geometries rg join routes r on r.id=rg.route_id where r.catalog_origin='junta_sierra_magina'; -- 0 initially
select count(*) from route_versions rv join routes r on r.id=rv.route_id where r.catalog_origin='junta_sierra_magina'; -- 0 initially
select count(*) from route_municipalities rm join routes r on r.id=rm.route_id where r.canonical_catalog_id='ma-junta-017'; -- 3
```

Also verify `private.route_v2_readiness` returns `ready=false` for all 17 initial routes and includes a blocking-restriction reason for MA-001 and MA-010.

- [ ] **Step 3: Verify branch isolation**

`git diff --name-only feat/admin-v1...HEAD` may contain only:

```text
data/catalog/*
docs/superpowers/specs/2026-09-16-admin-catalog-ingest-v1-design.md
docs/superpowers/plans/2026-09-16-admin-catalog-ingest-v1.md
supabase/migrations/202609160030_*.sql
supabase/migrations/202609160031_*.sql
supabase/migrations/202609160032_*.sql
supabase/migrations/202609160033_*.sql
supabase/tests/database/admin_catalog_*.sql
apps/admin/src/core/catalog-import.mjs
apps/admin/src/core/api.mjs
apps/admin/src/core/route-master-view.mjs
apps/admin/tests/catalog-import.test.mjs
apps/admin/tests/route-master-view.test.mjs
apps/admin/styles.css
```

No mobile, Weather, GPS, Community or RC files may change.

- [ ] **Step 4: Open a draft PR targeting `feat/admin-v1`**

Title:

```text
WIP: Admin catalog ingest V1
```

Body must state:

```text
Imports the verified 17-route Sierra Mágina official catalog into the existing Admin/Route Master V2 as draft canonical evidence. No route is auto-published; no missing metric is converted to zero; PR targets feat/admin-v1 and does not touch main or PR #28.
```

- [ ] **Step 5: Confirm GitHub Actions complete green before claiming completion**

Required green steps: frozen install, typecheck, unit/Admin tests, Android prebuild, package boundaries, Supabase start/reset, and database contract tests.

---

## Success Criteria

1. `supabase db reset` creates exactly 17 canonical Sierra Mágina route identities from the V1 manifest.
2. All 17 are drafts and have pending/missing validation states.
3. No initial imported route has fabricated `route_versions`, geometries, elevations, POI coordinates or rewards.
4. The 17 official technical sheets remain inspectable in `route_catalog_profiles` even when operational content is incomplete.
5. Veredón-Mojón Blanco stores Mancha Real, Pegalajar and Torres simultaneously.
6. All route-scoped official sources have `external_source_id`, URL, checked date and verification state.
7. Adelfal de Cuadros and Las Viñas have active official blocking restrictions and fail readiness.
8. Route Master V2 displays canonical imported evidence read-only alongside operational content.
9. Re-importing the same manifest is idempotent and does not overwrite manual route title/slug/status or operational versions.
10. Existing Admin, rewards, community, media, notification and Route Master behavior stays green.
11. PR targets `feat/admin-v1`; `main`, RC/mobile and catalog PR #28 remain untouched.
