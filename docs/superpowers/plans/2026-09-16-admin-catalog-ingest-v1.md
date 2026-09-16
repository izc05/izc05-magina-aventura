# Mágina Aventura Admin Catalog Ingest V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the verified 17-route Sierra Mágina official catalog into the existing Super Admin as auditable draft route records without inventing missing values, while preserving Route Master V2 publication gates.

**Architecture:** Keep `routes` as the single operational identity and add a nullable canonical-import layer around it. Canonical facts, multi-municipality membership, imported restrictions, POIs and geometry leads live in dedicated tables; reviewed operational content continues to live in `route_versions`, `route_geometries`, `route_access_points`, `route_track_sources` and `route_safety_incidents`. A versioned JSON manifest feeds an idempotent SQL ingester; Route Master V2 reads both layers but publishes only through the existing readiness gate.

**Tech Stack:** PostgreSQL/Supabase, PostGIS, pgTAP, native ES modules in `apps/admin`, Node.js >=22.13.0, pnpm 10.15.0, existing GitHub Actions CI.

**Spec:** `docs/superpowers/specs/2026-09-16-admin-catalog-ingest-v1-design.md`

## Global Constraints

- Work only on `feat/admin-catalog-ingest-v1`, based on `feat/admin-v1`.
- Do not modify `main`, RC/mobile, Weather, GPS, Community, or PR #28.
- `null` means unknown/not verified; `0` means a real zero.
- Imported routes never auto-publish.
- `routes.id` remains the internal UUID; `canonical_catalog_id` is the stable import key.
- Do not fabricate `route_versions`, `route_geometries`, POI coordinates, elevation metrics, rewards or tracks.
- Preserve existing Route Master V2, RLS, audit, media, gamification, rewards and notifications.
- Preserve `routes.municipality_id` for legacy compatibility; new Admin reads use `route_municipalities`.
- Imported active `blocking` restrictions must block V2 readiness.
- Re-importing the same manifest must not duplicate data or overwrite manual route title/slug/status/content.
- Initial snapshot: `2026-09-16-v1`, source commit `d252a9d4da3dec4e0e96556e47b4083c12a23f78`.

## Files

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
apps/admin/src/core/api.mjs
apps/admin/src/core/route-master-view.mjs
apps/admin/tests/catalog-import.test.mjs
apps/admin/tests/route-master-view.test.mjs
apps/admin/styles.css
```

Existing migrations stay immutable.

---

### Task 1: Canonical Admin storage layer

**Files:**
- Create: `supabase/migrations/202609160030_admin_catalog_ingest_schema.sql`
- Create: `supabase/tests/database/admin_catalog_ingest_schema_test.sql`

**Interfaces:**
- Produces: route canonical IDs, canonical profiles, multi-municipality links, imported restrictions/POIs/track leads, import-run ledger, route-source external IDs.

- [ ] **Step 1: Write the failing pgTAP schema test**

Use exactly these 23 assertions:

```sql
begin;
select plan(23);
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

- [ ] **Step 2: Run it and verify red**

```bash
supabase db reset
pg_prove -h 127.0.0.1 -p 54322 -U postgres -d postgres supabase/tests/database/admin_catalog_ingest_schema_test.sql
```

Expected: FAIL because the objects do not exist.

- [ ] **Step 3: Extend route identity and sources**

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

- [ ] **Step 4: Create `route_catalog_profiles`**

```sql
create table public.route_catalog_profiles (
  route_id uuid primary key references public.routes(id) on delete cascade,
  canonical_catalog_id text not null unique,
  source_snapshot_version text not null,
  source_snapshot_commit text not null,
  verification_state text not null check (verification_state in ('official_verified','cross_checked','community_unverified','editorial_derived','stale','unknown')),
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

- [ ] **Step 5: Create `route_municipalities`**

```sql
create table public.route_municipalities (
  route_id uuid not null references public.routes(id) on delete cascade,
  municipality_id uuid not null references public.municipalities(id) on delete restrict,
  is_primary boolean not null default false,
  source_kind text not null default 'catalog' check (source_kind in ('catalog','admin','field')),
  created_at timestamptz not null default now(),
  primary key(route_id,municipality_id)
);
create unique index route_municipalities_one_primary_uidx on public.route_municipalities(route_id) where is_primary;
```

- [ ] **Step 6: Create imported restriction/POI/track-lead tables**

Use exactly these keys and constraints:

```sql
create table public.route_catalog_restrictions (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  external_restriction_id text not null,
  restriction_type text not null,
  severity text not null check (severity in ('info','warning','restricting','blocking')),
  status text not null check (status in ('active','scheduled','resolved','unknown')),
  starts_at timestamptz, ends_at timestamptz, published_at timestamptz,
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

- [ ] **Step 7: Create import-run ledger**

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

- [ ] **Step 8: RLS, grants and audit**

Enable RLS on all six new tables; grant `select` to `authenticated`; create the six policy names from Step 1, each using:

```sql
private.admin_has_capability('routes.manage',auth.uid())
```

Attach existing `private.audit_row_change()` to profile, municipality, restriction, POI and track-lead tables for insert/update/delete.

- [ ] **Step 9: Run complete DB tests**

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

### Task 2: Idempotent catalog ingester

**Files:**
- Create: `supabase/migrations/202609160031_admin_catalog_ingest_rpc.sql`
- Create: `supabase/tests/database/admin_catalog_ingest_rpc_test.sql`

**Interfaces:**
- Produces `private.apply_catalog_manifest(payload jsonb, actor uuid default null) returns jsonb`.
- Produces authenticated wrapper `public.admin_ingest_catalog_manifest(payload jsonb) returns jsonb`.

- [ ] **Step 1: Write failing pgTAP import test**

With a two-route fixture, call the public RPC twice and assert:

```sql
select is((select count(*) from public.routes where canonical_catalog_id like 'test-%')::integer,2,'creates two route identities once');
select is((select count(*) from public.route_catalog_profiles where canonical_catalog_id like 'test-%')::integer,2,'creates two profiles once');
select is((select count(*) from public.route_municipalities rm join public.routes r on r.id=rm.route_id where r.canonical_catalog_id='test-2')::integer,2,'keeps multiple municipalities');
select is((select count(*) from public.route_catalog_restrictions where external_restriction_id='test-closure')::integer,1,'restriction is idempotent');
select is((select count(*) from public.route_versions rv join public.routes r on r.id=rv.route_id where r.canonical_catalog_id like 'test-%')::integer,0,'does not fabricate content versions');
select is((select count(*) from public.route_geometries rg join public.routes r on r.id=rg.route_id where r.canonical_catalog_id like 'test-%')::integer,0,'does not fabricate geometry');
```

Move one imported test route to `review`, re-import, and assert it stays `review`.

- [ ] **Step 2: Run and confirm red**

Expected: FAIL because RPCs do not exist.

- [ ] **Step 3: Validate manifest structure**

Reject payloads when:

```text
root is not object
catalog/snapshot_version/source_commit/manifest_sha256 missing
routes/sources/restrictions/pois/track_leads not arrays
duplicate route canonical IDs
route id/slug/name/primary_municipality missing
primary municipality missing from route municipalities
municipality slug absent from public.municipalities
invalid route_kind or difficulty
referenced source id missing
restriction route id missing
```

Use explicit `raise exception` messages.

- [ ] **Step 4: Upsert route identity safely**

For each manifest route:

```text
insert canonical_catalog_id, catalog_origin, route_code, municipality_id, slug, title, status='draft'
on canonical_catalog_id conflict:
  update catalog_origin
  fill route_code only when existing route_code is null
  do not overwrite title, slug, status, current_content_version, current_geometry_version
```

Insert default `route_validation_status` with `on conflict do nothing`.

- [ ] **Step 5: Upsert profile and municipalities**

Replace canonical profile fields from the new snapshot. Synchronize only `route_municipalities.source_kind='catalog'`; preserve `admin` and `field` municipality rows.

- [ ] **Step 6: Upsert sources**

Map canonical source to `route_sources`:

```text
label <- title
url <- url
source_type <- official for official_authority, otherwise other
official <- verification_state=official_verified
checked_at <- checked_at
external_source_id <- id
verification_state <- verification_state
notes <- "Importado de catálogo canónico <snapshot_version>"
```

Do not delete manual rows whose `external_source_id` is null.

- [ ] **Step 7: Upsert restrictions/POIs/track leads and import ledger**

Use external IDs/unique keys from Task 1. Never write to operational safety/track/checkpoint/discovery tables in this importer.

Create `catalog_import_runs(status='running')`, finish as `completed`, and return counts.

- [ ] **Step 8: Secure public wrapper**

Require authenticated `routes.manage`; revoke from `public` and `anon`; grant to `authenticated`.

- [ ] **Step 9: Run DB suite and commit**

```bash
supabase db reset
pg_prove -h 127.0.0.1 -p 54322 -U postgres -d postgres supabase/tests/database/*.sql
git add supabase/migrations/202609160031_admin_catalog_ingest_rpc.sql supabase/tests/database/admin_catalog_ingest_rpc_test.sql
git commit -m "feat(admin): add idempotent catalog manifest ingestion"
```

---

### Task 3: Readiness and Route Master snapshot integration

**Files:**
- Create: `supabase/migrations/202609160032_admin_catalog_readiness_snapshot.sql`
- Create: `supabase/tests/database/admin_catalog_readiness_test.sql`

**Interfaces:**
- Extends `private.route_v2_readiness(uuid)`.
- Extends `public.admin_route_master_snapshot(uuid)` with canonical fields.

- [ ] **Step 1: Write failing readiness test**

Create a route with one active canonical `blocking` restriction and no operational incident. Assert `ready=false`, `blocking_incidents=1`, and reason contains `Existe una restricción oficial bloqueante`.

- [ ] **Step 2: Count canonical blocking restrictions**

Add active/time-valid `route_catalog_restrictions(severity='blocking')` to current operational blocking count. Append the exact reason above when canonical blockers exist.

- [ ] **Step 3: Extend snapshot without removing current keys**

Add exactly:

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

Sort municipalities primary-first then by name.

- [ ] **Step 4: Test three-municipality route and legacy compatibility**

Assert snapshot returns three municipality records while existing `route.municipality` remains present.

- [ ] **Step 5: Run DB suite and commit**

```bash
supabase db reset
pg_prove -h 127.0.0.1 -p 54322 -U postgres -d postgres supabase/tests/database/*.sql
git add supabase/migrations/202609160032_admin_catalog_readiness_snapshot.sql supabase/tests/database/admin_catalog_readiness_test.sql
git commit -m "feat(admin): integrate canonical data into route readiness"
```

---

### Task 4: Versioned Sierra Mágina V1 manifest

**Files:**
- Create: `data/catalog/sierra-magina-official-v1.json`
- Create: `apps/admin/src/core/catalog-import.mjs`
- Create: `apps/admin/tests/catalog-import.test.mjs`

**Interfaces:**
- Produces `validateCatalogManifest(manifest)` and `catalogImportSummary(manifest)`.

- [ ] **Step 1: Write failing Node tests**

Assert 17 unique route IDs, Veredón municipalities `[mancha-real,pegalajar,torres]`, El Peralejo official family fact, two restrictions, 19 sources, and zero POIs/track leads.

- [ ] **Step 2: Create manifest with exact header**

```json
{
  "catalog": "sierra-magina-official",
  "snapshot_version": "2026-09-16-v1",
  "source_branch": "feat/adventure-catalog-v1",
  "source_commit": "d252a9d4da3dec4e0e96556e47b4083c12a23f78",
  "manifest_sha256": "",
  "routes": [],
  "sources": [],
  "restrictions": [],
  "pois": [],
  "track_leads": []
}
```

The empty hash is an intentional pre-hash state used only inside this task. Before the task is committed, compute the deterministic hash over the same JSON with `manifest_sha256=''`, write the resulting `sha256:<64 hex chars>` back into the file, and require the validator to reject an empty hash in the committed manifest.

- [ ] **Step 3: Add exact 17 route matrix**

| id | code | slug | name | primary | municipalities | kind | km | minutes | difficulty |
|---|---|---|---|---|---|---|---:|---:|---|
| ma-junta-001 | MA-001 | adelfal-de-cuadros | Adelfal de Cuadros | bedmar-y-garciez | bedmar-y-garciez | linear | 0.453 | 20 | easy |
| ma-junta-002 | MA-002 | cano-del-aguadero | Caño del Aguadero | bedmar-y-garciez | bedmar-y-garciez | linear | 14.306 | 300 | hard |
| ma-junta-003 | MA-003 | castillo-de-albanchez | Castillo de Albanchez | albanchez-de-magina | albanchez-de-magina | linear | 0.206 | 20 | moderate |
| ma-junta-004 | MA-004 | castillo-de-mata-bejid | Castillo de Mata Bejid | cambil | cambil | linear | 3.550 | 75 | easy |
| ma-junta-005 | MA-005 | el-peralejo | El Peralejo | cambil | cambil | circular | 2.268 | 60 | easy |
| ma-junta-006 | MA-006 | fuenmayor | Fuenmayor | torres | torres | linear | 6.405 | 140 | moderate |
| ma-junta-007 | MA-007 | gibralberca | Gibralberca | cambil | cambil | circular | 5.653 | 120 | moderate |
| ma-junta-008 | MA-008 | hoyalinos | Hoyalinos | torres | torres | circular | 2.092 | 60 | moderate |
| ma-junta-009 | MA-009 | la-cueva-de-la-graja | La Cueva de la Graja | jimena | jimena | linear | 0.575 | 30 | moderate |
| ma-junta-010 | MA-010 | las-vinas | Las Viñas | bedmar-y-garciez | bedmar-y-garciez | circular | 8.720 | 180 | moderate |
| ma-junta-011 | MA-011 | pinar-de-canava | Pinar de Cánava | jimena | jimena | linear | 2.350 | 60 | hard |
| ma-junta-012 | MA-012 | puerto-de-la-mata | Puerto de la Mata | cambil | cambil | linear | 13.170 | 290 | moderate |
| ma-junta-013 | MA-013 | sierra-de-la-cruz | Sierra de la Cruz | jodar | jodar | circular | 7.292 | 150 | moderate |
| ma-junta-014 | MA-014 | subida-al-hoyo-de-la-laguna | Subida al Hoyo de la Laguna | belmez-de-la-moraleda | belmez-de-la-moraleda | linear | 5.475 | 180 | hard |
| ma-junta-015 | MA-015 | subida-a-pico-magina-y-miramundos | Subida a Pico Mágina y Miramundos | huelma | huelma | linear | 14.773 | 300 | hard |
| ma-junta-016 | MA-016 | umbria-de-los-corzos | Umbría de los Corzos | cambil | cambil | linear | 2.630 | 60 | easy |
| ma-junta-017 | MA-017 | veredon-mojon-blanco | Veredón-Mojón Blanco | pegalajar | mancha-real,pegalajar,torres | linear | 3.156 | 90 | moderate |

All 17 use null elevation fields and `verification_state='official_verified'`.

El Peralejo family fact:

```json
{"code":"official_family_friendly","text":"La ficha oficial describe el sendero como corto, con poco desnivel y muy adecuado para ir con niños.","sourceIds":["junta-el-peralejo"],"verificationState":"official_verified"}
```

- [ ] **Step 4: Add exact 19 sources**

Common base:

```text
https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content
```

IDs/suffixes:

```text
junta-sierra-magina-directory /es6160007-sierra-m%C3%81gina
junta-adelfal-de-cuadros /adelfal-de-cuadros/
junta-cano-del-aguadero /ca%C3%B1o-del-aguadero/255035
junta-castillo-de-albanchez /castillo-de-albanchez/255035
junta-castillo-de-mata-bejid /castillo-de-mata-bejid/255035
junta-el-peralejo /el-peralejo/255035
junta-fuenmayor /fuenmayor/null
junta-gibralberca /gibralberca-1/255035
junta-hoyalinos /hoyalinos/255035
junta-cueva-de-la-graja /la-cueva-de-la-graja/255035
junta-las-vinas /las-vi%C3%B1as/255035
junta-pinar-de-canava /pinar-de-c%C3%A1nava/255035
junta-puerto-de-la-mata /puerto-de-la-mata/255035
junta-sierra-de-la-cruz /sierra-de-la-cruz/255035
junta-hoyo-de-la-laguna /subida-al-hoyo-de-la-laguna/
junta-pico-magina-miramundos /subida-a-pico-m%C3%81gina-y-miramundos/255035
junta-umbria-de-los-corzos /umbr%C3%ADa-de-los-corzos/255035
junta-veredon-mojon-blanco /vered%C3%93n-moj%C3%93n-blanco/255035
junta-cuadros-closure /cuadros/null
```

All use publisher `Junta de Andalucía · Ventana del Visitante`, source type `official_authority`, verification `official_verified`, checked date `2026-09-16`. Only `junta-cuadros-closure` has `published_at='2026-02-24'`.

- [ ] **Step 5: Add exactly two restrictions**

Adelfal `ma-junta-001` and Las Viñas `ma-junta-010`: `temporary_closure`, `blocking`, `active`, published `2026-02-24`, checked `2026-09-16`. Use source IDs `[route-sheet, junta-cuadros-closure]` and the exact source-catalog reasons.

Keep `pois=[]` and `track_leads=[]` for V1 rather than inventing coordinates or direct geometry URLs.

- [ ] **Step 6: Implement manifest validator and summary**

`validateCatalogManifest(manifest)` returns `{valid,errors}` and validates header hash format `^sha256:[a-f0-9]{64}$`, unique route IDs/codes/slugs, municipality membership, valid kind/difficulty, all source references and restriction route references.

`catalogImportSummary(manifest)` returns `{routes,sources,restrictions,pois,trackLeads}` counts.

- [ ] **Step 7: Compute deterministic manifest hash**

```bash
node -e "const fs=require('fs'),c=require('crypto');const p='data/catalog/sierra-magina-official-v1.json';const x=JSON.parse(fs.readFileSync(p,'utf8'));x.manifest_sha256='';const canonical=JSON.stringify(x);console.log('sha256:'+c.createHash('sha256').update(canonical).digest('hex'))"
```

Write that exact output into `manifest_sha256`, then run:

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

### Task 5: Seed the 17 routes through the ingester

**Files:**
- Create: `supabase/migrations/202609160033_sierra_magina_official_catalog_v1.sql`
- Create: `supabase/tests/database/admin_catalog_seed_test.sql`

**Interfaces:**
- Seed migration calls `private.apply_catalog_manifest` with the exact final Task 4 manifest.

- [ ] **Step 1: Write failing seed test**

After reset assert:

```sql
select is((select count(*) from public.routes where catalog_origin='junta_sierra_magina')::integer,17,'17 routes');
select is((select count(*) from public.route_catalog_profiles)::integer,17,'17 profiles');
select is((select count(*) from public.route_sources where external_source_id is not null and route_id in (select id from public.routes where catalog_origin='junta_sierra_magina'))::integer,35,'35 route-scoped source rows');
select is((select count(*) from public.route_catalog_restrictions)::integer,2,'2 restrictions');
select is((select count(*) from public.route_versions rv join public.routes r on r.id=rv.route_id where r.catalog_origin='junta_sierra_magina')::integer,0,'no fake content');
select is((select count(*) from public.route_geometries rg join public.routes r on r.id=rg.route_id where r.catalog_origin='junta_sierra_magina')::integer,0,'no fake geometry');
select is((select count(*) from public.route_municipalities rm join public.routes r on r.id=rm.route_id where r.canonical_catalog_id='ma-junta-017')::integer,3,'Veredon has 3 municipalities');
```

V1 deliberately attaches `junta-cuadros-closure` as an additional route source to Adelfal and Las Viñas, hence 35 route-scoped source rows.

- [ ] **Step 2: Embed final manifest and call private ingester**

```sql
select private.apply_catalog_manifest(
  $catalog$<exact final JSON from data/catalog/sierra-magina-official-v1.json>$catalog$::jsonb,
  null
);
```

The SQL payload must be copied exactly from the committed JSON; no independent hand-edited route list.

- [ ] **Step 3: Test idempotence**

Call the private ingester a second time in the test with the same JSON and assert route/profile/source/restriction/municipality counts do not change.

- [ ] **Step 4: Run full DB suite and commit**

```bash
supabase db reset
pg_prove -h 127.0.0.1 -p 54322 -U postgres -d postgres supabase/tests/database/*.sql
git add supabase/migrations/202609160033_sierra_magina_official_catalog_v1.sql supabase/tests/database/admin_catalog_seed_test.sql
git commit -m "data(admin): seed 17 official Sierra Magina routes"
```

---

### Task 6: Route Master canonical-evidence UI

**Files:**
- Modify: `apps/admin/src/core/route-master-view.mjs`
- Modify: `apps/admin/tests/route-master-view.test.mjs`
- Modify: `apps/admin/styles.css`

**Interfaces:**
- Consumes `catalog_profile`, `municipalities`, `catalog_restrictions`, `catalog_pois`, `catalog_track_leads`, `catalog_import`.

- [ ] **Step 1: Write failing view tests**

Assert new tab `{id:'catalog',label:'Catálogo oficial'}` and rendered phrases `Datos oficiales importados`, municipality names, `Restricción oficial activa`, `Track oficial pendiente`.

- [ ] **Step 2: Add read-only tab and badge**

Badge logic:

```text
no profile -> —
active blocking restriction -> Bloqueada
official_verified -> Oficial
otherwise -> Importada
```

- [ ] **Step 3: Render canonical evidence**

Show canonical ID, snapshot/commit, type, distance, duration, official difficulty, municipalities, checked date, verification, family facts, accessibility, restrictions, imported POIs and track leads. Null renders `Pendiente`, never `0`.

- [ ] **Step 4: Add scoped CSS only**

Use `.route-catalog-*` classes and existing status tokens; no shell redesign.

- [ ] **Step 5: Run tests and commit**

```bash
node --test apps/admin/tests/route-master-view.test.mjs apps/admin/tests/catalog-import.test.mjs
pnpm run check:admin
git add apps/admin/src/core/route-master-view.mjs apps/admin/tests/route-master-view.test.mjs apps/admin/styles.css
git commit -m "feat(admin): show canonical evidence in Route Master"
```

---

### Task 7: Authenticated re-import adapter and final verification

**Files:**
- Modify: `apps/admin/src/core/catalog-import.mjs`
- Modify: `apps/admin/src/core/api.mjs`
- Modify: `apps/admin/tests/catalog-import.test.mjs`

**Interfaces:**
- Produces `importCatalogManifest(api,manifest)`.

- [ ] **Step 1: Write failing adapter test**

```js
const calls=[];
const api={rpc:async(name,args)=>{calls.push({name,args});return{routes:17};}};
const result=await importCatalogManifest(api,manifest);
assert.equal(calls[0].name,'admin_ingest_catalog_manifest');
assert.deepEqual(calls[0].args,{payload:manifest});
assert.equal(result.routes,17);
```

Invalid manifest must reject before API call.

- [ ] **Step 2: Implement adapter**

```js
export async function importCatalogManifest(api,manifest){
  const validation=validateCatalogManifest(manifest);
  if(!validation.valid) throw new Error(`Manifest inválido: ${validation.errors.join('; ')}`);
  return api.rpc('admin_ingest_catalog_manifest',{payload:manifest});
}
```

If `api.mjs` lacks `rpc(name,args)`, add it using the existing authenticated request helper without changing existing call sites.

- [ ] **Step 3: Run full repository verification**

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm run check:admin
supabase db reset
pg_prove -h 127.0.0.1 -p 54322 -U postgres -d postgres supabase/tests/database/*.sql
pnpm --filter @magina-aventura/mobile exec expo prebuild --platform android --no-install
node scripts/check-package-boundaries.mjs
git diff --check
git diff --name-only feat/admin-v1...HEAD
```

Expected: PASS/clean.

- [ ] **Step 4: Verify final data invariants**

```sql
select count(*) from routes where catalog_origin='junta_sierra_magina'; -- 17
select count(*) from route_catalog_profiles; -- 17
select count(*) from route_catalog_restrictions where status='active' and severity='blocking'; -- 2
select count(*) from route_geometries rg join routes r on r.id=rg.route_id where r.catalog_origin='junta_sierra_magina'; -- 0
select count(*) from route_versions rv join routes r on r.id=rv.route_id where r.catalog_origin='junta_sierra_magina'; -- 0
select count(*) from route_municipalities rm join routes r on r.id=rm.route_id where r.canonical_catalog_id='ma-junta-017'; -- 3
```

All 17 readiness results must be `ready=false`; MA-001 and MA-010 must contain the blocking official restriction reason.

- [ ] **Step 5: Commit adapter**

```bash
git add apps/admin/src/core/catalog-import.mjs apps/admin/src/core/api.mjs apps/admin/tests/catalog-import.test.mjs
git commit -m "feat(admin): add authenticated catalog reimport adapter"
```

- [ ] **Step 6: Open draft PR to `feat/admin-v1`**

Title: `WIP: Admin catalog ingest V1`

Body:

```text
Imports the verified 17-route Sierra Mágina official catalog into the existing Admin/Route Master V2 as draft canonical evidence. No route is auto-published; no missing metric is converted to zero; this PR targets feat/admin-v1 and does not touch main or PR #28.
```

- [ ] **Step 7: Require green GitHub Actions before completion**

Required green stages: frozen install, typecheck, unit/Admin tests, Android prebuild, package boundaries, Supabase start/reset, database contract tests.

## Success Criteria

1. Reset DB contains exactly 17 canonical Sierra Mágina routes.
2. All are draft/pending and none is auto-published.
3. No fabricated content versions, geometries, elevations, POI coordinates, rewards or tracks exist.
4. All 17 technical sheets are visible from `route_catalog_profiles`.
5. Veredón stores three municipalities.
6. Imported sources retain external IDs, URLs, checked dates and verification states.
7. Adelfal and Las Viñas have active official blocking restrictions and fail readiness.
8. Route Master displays canonical imported evidence read-only.
9. Re-import is idempotent and preserves manual operational work.
10. Existing Admin and repository CI remain green.
11. PR targets `feat/admin-v1`; `main`, mobile/RC and catalog PR #28 remain untouched.
