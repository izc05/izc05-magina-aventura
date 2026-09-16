# Sierra Mágina Adventure Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an isolated, source-traceable Sierra Mágina adventure catalog that validates real routes, geometry, POIs, safety/restrictions, family/accessibility facts, and exposes a stable read model for later RC consumption.

**Architecture:** Keep shared data shapes in `@magina-aventura/contracts`, business rules in `@magina-aventura/domain`, geometry rules in `@magina-aventura/geo`, source-file parsing in `@magina-aventura/route-import`, and canonical records in a new `@magina-aventura/adventure-catalog` package. The catalog must remain usable without Supabase and must not touch mobile UI, Weather, GPS tracking, Community, Admin, authentication, onboarding, or promotional web flows.

**Tech Stack:** TypeScript 6, Node >=22.13, pnpm >=10, Vitest 3, workspace packages, GeoJSON-compatible primitives, existing `fast-xml-parser` route importer.

**Spec:** `docs/superpowers/specs/2026-09-16-sierra-magina-adventure-catalog-design.md`

## Global Constraints

- Work only on `feat/adventure-catalog-v1` until the catalog contract and starter dataset are stable.
- Do not redesign route screens or modify mobile/web product flows.
- Do not couple the canonical catalog to live Weather, GPS, Community, Admin, or Supabase.
- No invented routes, POIs, closures, potable-water claims, accessibility claims, or safety facts.
- A lack of current closure information must never become a guaranteed `open` state.
- Official/source facts and Mágina Aventura editorial derivations must remain distinguishable.
- Canonical source geometry must remain separate from simplified/mobile derivatives.
- Sensitive facts require provenance and a last-checked date.
- Preserve the existing separation between official Parque Natural routes, provincial R routes, homologated GR/PR/SL routes, municipal routes, and community-only leads.
- Reuse prior research: 17/17 official senderos have been identified, provincial R routes and GR/PR/SL have been audited, and REDIAM is the preferred geometry source for the official set when geometry is available.
- The known temporary closure affecting the Las Viñas/Cuadros adventure must be modeled as a restriction/advisory and must not be overwritten by route metadata.

---

## File Structure

New or expanded units:

```text
packages/contracts/src/catalog.ts
packages/contracts/src/catalog.type-test.ts
packages/domain/src/catalog/validate-catalog.ts
packages/domain/src/catalog/validate-catalog.test.ts
packages/domain/src/catalog/operational-status.ts
packages/domain/src/catalog/operational-status.test.ts
packages/domain/src/catalog/completeness.ts
packages/domain/src/catalog/completeness.test.ts
packages/geo/src/track-metrics.ts
packages/geo/src/track-metrics.test.ts
packages/geo/src/geometry-validation.ts
packages/geo/src/geometry-validation.test.ts
packages/route-import/src/geojson.ts
packages/route-import/src/geojson.test.ts
packages/route-import/src/source-metadata.ts
packages/adventure-catalog/package.json
packages/adventure-catalog/tsconfig.json
packages/adventure-catalog/src/index.ts
packages/adventure-catalog/src/catalog.ts
packages/adventure-catalog/src/catalog.test.ts
packages/adventure-catalog/src/data/sources.ts
packages/adventure-catalog/src/data/adventures.ts
packages/adventure-catalog/src/data/pois.ts
packages/adventure-catalog/src/data/restrictions.ts
packages/adventure-catalog/src/data/tracks.ts
packages/adventure-catalog/src/quality-report.ts
packages/adventure-catalog/src/quality-report.test.ts
packages/adventure-catalog/scripts/validate-catalog.ts
docs/catalog/source-ledger.md
```

Existing exports/package manifests are modified only where required to expose these units.

---

### Task 1: Freeze the shared catalog contract

**Files:**
- Create: `packages/contracts/src/catalog.ts`
- Create: `packages/contracts/src/catalog.type-test.ts`
- Modify: `packages/contracts/src/index.ts`

**Interfaces:**
- Produces: `Adventure`, `TrackAsset`, `CatalogPoi`, `CatalogSource`, `Restriction`, `DifficultyFactors`, `FamilyFactors`, `AccessibilityFact`, `CatalogSnapshot`, `VerificationState`, `OperationalStatus`.
- Existing `RouteSummary` / `RouteDetail` remain untouched in this task so current consumers do not break.

- [ ] **Step 1: Write the compile-time contract test**

```ts
import type { Adventure, CatalogSnapshot, Restriction } from './catalog';

const adventure = {
  id: 'ma-001',
  slug: 'las-vinas-cuadros',
  name: 'Las Viñas',
  summary: 'Ruta de senderismo en el entorno de Cuadros.',
  description: 'Entrada canónica de catálogo.',
  activityTypes: ['hiking'],
  municipalityIds: ['bedmar-y-garciez'],
  shape: 'circular',
  publicationState: 'draft',
  verificationState: 'official_verified',
  sourceIds: ['source-junta-las-vinas'],
  trackId: null,
  metrics: {
    distanceKm: 8.7,
    ascentM: null,
    descentM: null,
    minElevationM: null,
    maxElevationM: null,
    durationMinutesMin: 180,
    durationMinutesMax: 180,
  },
  difficulty: {
    physicalDemand: 3,
    technicalTerrain: 2,
    navigationComplexity: 2,
    exposure: 1,
    remoteness: 2,
    simpleLabel: 'moderate',
  },
  family: {
    editorialSuitability: 'review_required',
    minimumAge: null,
    strollerViability: 'unknown',
    factors: [],
  },
  accessibilityFacts: [],
  stableSafetyCharacteristics: [],
} satisfies Adventure;

const restriction = {
  id: 'restriction-las-vinas-closure',
  scope: { type: 'adventure', adventureId: adventure.id },
  type: 'temporary_closure',
  severity: 'blocking',
  status: 'active',
  startsAt: null,
  endsAt: null,
  sourceIds: ['source-junta-las-vinas-closure'],
  publishedAt: null,
  checkedAt: '2026-09-16',
  reason: 'Temporary closure recorded by the responsible authority.',
} satisfies Restriction;

const snapshot = {
  generatedAt: '2026-09-16T18:00:00Z',
  adventures: [adventure],
  tracks: [],
  pois: [],
  sources: [],
  restrictions: [restriction],
} satisfies CatalogSnapshot;

void snapshot;
```

- [ ] **Step 2: Run typecheck and confirm failure**

Run: `pnpm --filter @magina-aventura/contracts typecheck`

Expected: FAIL because `./catalog` does not exist.

- [ ] **Step 3: Implement the complete catalog types**

Use these exact core unions and field semantics in `catalog.ts`:

```ts
export type VerificationState =
  | 'official_verified'
  | 'cross_checked'
  | 'community_unverified'
  | 'editorial_derived'
  | 'stale'
  | 'unknown';

export type PublicationState = 'draft' | 'publishable' | 'archived';
export type OperationalStatus = 'open' | 'caution' | 'restricted' | 'closed' | 'unknown';
export type SimpleDifficulty = 'easy' | 'moderate' | 'hard' | 'expert';
export type ActivityType = 'hiking' | 'family_walk' | 'nature' | 'heritage' | 'viewpoint_approach';
export type RouteShape = 'circular' | 'linear' | 'out_and_back';
export type SourceType = 'official_authority' | 'municipality' | 'tourism_body' | 'trail_federation' | 'open_data' | 'local_organization' | 'community';

export interface CatalogSource {
  id: string;
  publisher: string;
  sourceType: SourceType;
  title: string;
  url: string;
  publishedAt: string | null;
  checkedAt: string;
  licenseNote: string | null;
  verificationState: VerificationState;
}

export interface DifficultyFactors {
  physicalDemand: 1 | 2 | 3 | 4 | 5;
  technicalTerrain: 1 | 2 | 3 | 4 | 5;
  navigationComplexity: 1 | 2 | 3 | 4 | 5;
  exposure: 1 | 2 | 3 | 4 | 5;
  remoteness: 1 | 2 | 3 | 4 | 5;
  simpleLabel: SimpleDifficulty;
}
```

Complete the file with the interfaces exercised by the type-test. All safety/family/accessibility fact entries must include `sourceIds: string[]` and `verificationState` so editorial and official claims remain distinguishable.

- [ ] **Step 4: Export the new contract and run typecheck**

Add to `packages/contracts/src/index.ts`:

```ts
export * from './catalog';
```

Run: `pnpm --filter @magina-aventura/contracts typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/src/catalog.ts packages/contracts/src/catalog.type-test.ts packages/contracts/src/index.ts
git commit -m "feat(catalog): define canonical adventure contracts"
```

---

### Task 2: Add catalog invariants, provenance validation, and operational status

**Files:**
- Create: `packages/domain/src/catalog/validate-catalog.ts`
- Create: `packages/domain/src/catalog/validate-catalog.test.ts`
- Create: `packages/domain/src/catalog/operational-status.ts`
- Create: `packages/domain/src/catalog/operational-status.test.ts`
- Create: `packages/domain/src/catalog/completeness.ts`
- Create: `packages/domain/src/catalog/completeness.test.ts`
- Modify: `packages/domain/src/index.ts`
- Modify: `packages/domain/package.json`

**Interfaces:**
- Consumes: `CatalogSnapshot`, `Adventure`, `Restriction`, `CatalogSource`.
- Produces: `validateCatalog(snapshot): CatalogValidationIssue[]`, `deriveOperationalStatus(adventureId, restrictions): OperationalStatus`, `calculateCompleteness(adventure, snapshot): CatalogCompleteness`.

- [ ] **Step 1: Write failing invariant tests**

Test these exact failures:

```ts
expect(validateCatalog(snapshotWithUnknownSourceId)).toContainEqual(
  expect.objectContaining({ code: 'unknown_source_reference', severity: 'error' }),
);

expect(validateCatalog(snapshotWithPotableWaterAndNoSource)).toContainEqual(
  expect.objectContaining({ code: 'sensitive_fact_without_provenance', severity: 'error' }),
);

expect(deriveOperationalStatus('ma-001', [activeBlockingClosure])).toBe('closed');
expect(deriveOperationalStatus('ma-001', [])).toBe('unknown');
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `pnpm --filter @magina-aventura/domain test`

Expected: FAIL because catalog modules do not exist.

- [ ] **Step 3: Add contracts dependency**

Add to `packages/domain/package.json`:

```json
"dependencies": {
  "@magina-aventura/contracts": "workspace:*"
}
```

- [ ] **Step 4: Implement validation rules**

`validateCatalog` must emit hard errors for:

```ts
export type CatalogValidationCode =
  | 'duplicate_id'
  | 'duplicate_slug'
  | 'unknown_source_reference'
  | 'unknown_track_reference'
  | 'unknown_poi_reference'
  | 'sensitive_fact_without_provenance'
  | 'invalid_checked_at'
  | 'published_without_required_core_data';
```

A `publishable` adventure requires identity, at least one source, known distance, duration range, difficulty factors, and a verified/cross-checked track unless the adventure category explicitly has no route geometry. Do not require optional POIs to make a route publishable.

- [ ] **Step 5: Implement operational status precedence**

Use this precedence:

```ts
blocking active closure => 'closed'
active restriction => 'restricted'
active warning/advisory => 'caution'
no current authoritative operational evidence => 'unknown'
```

Do not return `open` merely because the restriction array is empty. `open` is allowed only when an authoritative active-status record explicitly confirms access.

- [ ] **Step 6: Implement completeness scoring**

Return booleans/percentages for exactly these dimensions:

```ts
type CompletenessDimension =
  | 'identity'
  | 'geometry'
  | 'metrics'
  | 'pois'
  | 'water'
  | 'difficulty'
  | 'safety'
  | 'family'
  | 'accessibility'
  | 'sources'
  | 'freshness';
```

The report is diagnostic only; missing optional dimensions must not silently mutate publication state.

- [ ] **Step 7: Run tests and typecheck**

Run:

```bash
pnpm --filter @magina-aventura/domain test
pnpm --filter @magina-aventura/domain typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/domain
git commit -m "feat(catalog): validate provenance status and completeness"
```

---

### Task 3: Make geometry metrics reproducible and validate canonical tracks

**Files:**
- Create: `packages/geo/src/track-metrics.ts`
- Create: `packages/geo/src/track-metrics.test.ts`
- Create: `packages/geo/src/geometry-validation.ts`
- Create: `packages/geo/src/geometry-validation.test.ts`
- Modify: `packages/geo/src/index.ts`

**Interfaces:**
- Consumes: `RouteLineFeature`, elevations aligned with coordinates.
- Produces: `calculateTrackMetrics(line, elevationsM)`, `validateCanonicalGeometry(line, acceptanceBounds?)`.

- [ ] **Step 1: Write failing metric tests**

Cover distance, ascent/descent, min/max elevation, malformed elevation arrays, impossible coordinate jumps, and optional acceptance bounds.

```ts
const metrics = calculateTrackMetrics(line, [700, 720, 710]);
expect(metrics.ascentM).toBe(20);
expect(metrics.descentM).toBe(10);
expect(metrics.minElevationM).toBe(700);
expect(metrics.maxElevationM).toBe(720);
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `pnpm --filter @magina-aventura/geo test`

Expected: FAIL because the new modules are missing.

- [ ] **Step 3: Implement deterministic metrics**

```ts
export interface TrackMetrics {
  distanceKm: number;
  ascentM: number | null;
  descentM: number | null;
  minElevationM: number | null;
  maxElevationM: number | null;
}
```

Use existing distance helpers for horizontal distance. Elevation metrics are `null` when the elevation series is incomplete or unusable rather than fabricated.

- [ ] **Step 4: Implement geometry validation**

Reject invalid lon/lat, fewer than two coordinates, non-finite values, zero-length geometry, and implausible discontinuities. Acceptance bounds must be supplied by the caller; do not encode an invented protected-area polygon as an official Sierra Mágina boundary.

- [ ] **Step 5: Export and verify**

Run:

```bash
pnpm --filter @magina-aventura/geo test
pnpm --filter @magina-aventura/geo typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/geo
git commit -m "feat(geo): add canonical track metrics and validation"
```

---

### Task 4: Extend source-file ingestion without coupling it to catalog storage

**Files:**
- Create: `packages/route-import/src/geojson.ts`
- Create: `packages/route-import/src/geojson.test.ts`
- Create: `packages/route-import/src/source-metadata.ts`
- Modify: `packages/route-import/src/gpx.ts`
- Modify: `packages/route-import/src/gpx.test.ts`
- Modify: `packages/route-import/src/index.ts`

**Interfaces:**
- Consumes: raw GPX/GeoJSON text plus route id, geometry version, source id.
- Produces: normalized geometry and source metadata; no database writes.

- [ ] **Step 1: Write GeoJSON importer tests**

```ts
const imported = parseGeoJsonRoute(
  JSON.stringify({
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: [[-3.4, 37.7], [-3.39, 37.71]] },
  }),
  'ma-001',
  1,
);
expect(imported.line.properties.routeId).toBe('ma-001');
expect(imported.line.geometry.type).toBe('LineString');
```

Also reject Polygon, MultiPolygon, empty LineString, invalid coordinates, and JSON that is not a Feature/LineString.

- [ ] **Step 2: Run importer tests and confirm failure**

Run: `pnpm --filter @magina-aventura/route-import test`

Expected: FAIL for missing GeoJSON parser.

- [ ] **Step 3: Implement normalized source metadata**

```ts
export interface ImportedGeometrySource {
  sourceId: string;
  format: 'gpx' | 'geojson' | 'kml' | 'gml';
  importedAt: string;
  geometryVersion: number;
}
```

Keep format metadata separate from `RouteLineFeature` so canonical geometry remains reusable.

- [ ] **Step 4: Extend GPX result with deterministic metrics**

After `validateRouteLineFeature`, call `calculateTrackMetrics` and return the result alongside line/start/bounds/elevations. Existing consumers must continue to compile.

- [ ] **Step 5: Export and verify**

Run:

```bash
pnpm --filter @magina-aventura/route-import test
pnpm --filter @magina-aventura/route-import typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/route-import
git commit -m "feat(route-import): normalize GPX and GeoJSON catalog geometry"
```

---

### Task 5: Create the portable canonical catalog package

**Files:**
- Create: `packages/adventure-catalog/package.json`
- Create: `packages/adventure-catalog/tsconfig.json`
- Create: `packages/adventure-catalog/src/index.ts`
- Create: `packages/adventure-catalog/src/catalog.ts`
- Create: `packages/adventure-catalog/src/catalog.test.ts`
- Create: `packages/adventure-catalog/src/data/sources.ts`
- Create: `packages/adventure-catalog/src/data/adventures.ts`
- Create: `packages/adventure-catalog/src/data/pois.ts`
- Create: `packages/adventure-catalog/src/data/restrictions.ts`
- Create: `packages/adventure-catalog/src/data/tracks.ts`

**Interfaces:**
- Produces: `getCatalogSnapshot()`, `listAdventures(filters?)`, `getAdventureBySlug(slug)`, `getAdventurePois(adventureId)`, `getAdventureRestrictions(adventureId)`.
- Does not know Supabase, React Native, Expo, Weather, GPS, or Admin.

- [ ] **Step 1: Write failing catalog read-model tests**

```ts
expect(getAdventureBySlug('las-vinas-cuadros')?.id).toBe('ma-001');
expect(listAdventures({ municipalityId: 'bedmar-y-garciez' }).length).toBeGreaterThan(0);
expect(getAdventureRestrictions('ma-001')).toEqual(
  expect.arrayContaining([expect.objectContaining({ type: 'temporary_closure' })]),
);
```

- [ ] **Step 2: Add package manifest**

Use:

```json
{
  "name": "@magina-aventura/adventure-catalog",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "validate": "tsx scripts/validate-catalog.ts"
  },
  "dependencies": {
    "@magina-aventura/contracts": "workspace:*",
    "@magina-aventura/domain": "workspace:*"
  },
  "devDependencies": {
    "tsx": "^4.20.5",
    "typescript": "~6.0.3",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 3: Seed only evidence-backed starter records**

Start with the already researched Las Viñas/Cuadros entry as `ma-001`, keeping the official route figure (8.7 km, ~3 h, medium/moderate source difficulty) separate from independently calculated geometry metrics. Record the temporary closure as a `Restriction`, not inside the Adventure description. Do not mark the route operationally open while that restriction remains active or unverified as lifted.

- [ ] **Step 4: Implement read functions**

```ts
export interface AdventureFilters {
  municipalityId?: string;
  activityType?: ActivityType;
  difficulty?: SimpleDifficulty;
  operationalStatus?: OperationalStatus;
}
```

Filters are pure in-memory selectors over the canonical snapshot in V1.

- [ ] **Step 5: Run package tests and workspace typecheck**

Run:

```bash
pnpm --filter @magina-aventura/adventure-catalog test
pnpm --filter @magina-aventura/adventure-catalog typecheck
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/adventure-catalog pnpm-lock.yaml
git commit -m "feat(catalog): add portable canonical catalog package"
```

---

### Task 6: Build the quality gate and human-readable source ledger

**Files:**
- Create: `packages/adventure-catalog/src/quality-report.ts`
- Create: `packages/adventure-catalog/src/quality-report.test.ts`
- Create: `packages/adventure-catalog/scripts/validate-catalog.ts`
- Create: `docs/catalog/source-ledger.md`

**Interfaces:**
- Produces a machine validation result plus readable per-route completeness report.

- [ ] **Step 1: Write failing quality-report tests**

```ts
const report = buildCatalogQualityReport(getCatalogSnapshot());
expect(report.adventures.find((item) => item.id === 'ma-001')).toEqual(
  expect.objectContaining({
    id: 'ma-001',
    hardErrors: expect.any(Array),
    completeness: expect.any(Object),
  }),
);
```

- [ ] **Step 2: Implement CLI exit behavior**

```ts
const result = validateCatalog(getCatalogSnapshot());
const hardErrors = result.filter((issue) => issue.severity === 'error');
if (hardErrors.length > 0) {
  console.error(JSON.stringify(hardErrors, null, 2));
  process.exitCode = 1;
}
```

Completeness warnings print but do not automatically fail CI.

- [ ] **Step 3: Create the source ledger**

For every source used in data files, add a row with source id, authority/publisher, route/POI/restriction scope, URL, checked date, reuse/license note when known, and which claims depend on it. The source ledger is documentation; the canonical `CatalogSource` objects remain the machine source of truth.

- [ ] **Step 4: Run quality validation**

Run:

```bash
pnpm --filter @magina-aventura/adventure-catalog test
pnpm --filter @magina-aventura/adventure-catalog validate
```

Expected: PASS for hard invariants; any remaining completeness warnings are printed explicitly.

- [ ] **Step 5: Commit**

```bash
git add packages/adventure-catalog docs/catalog/source-ledger.md
git commit -m "feat(catalog): add source ledger and quality gate"
```

---

### Task 7: Populate the audited Sierra Mágina route inventory in controlled batches

**Files:**
- Modify: `packages/adventure-catalog/src/data/sources.ts`
- Modify: `packages/adventure-catalog/src/data/adventures.ts`
- Modify: `packages/adventure-catalog/src/data/pois.ts`
- Modify: `packages/adventure-catalog/src/data/tracks.ts`
- Modify: `packages/adventure-catalog/src/data/restrictions.ts`
- Modify: `docs/catalog/source-ledger.md`
- Add route geometry fixtures/assets only when a lawful authoritative source provides them.

**Interfaces:**
- Consumes the contracts and validation gates from Tasks 1–6.
- Produces the real starter corpus used later by RC.

- [ ] **Step 1: Import the 17 official senderos as identities first**

Use the previously audited 17/17 official senderos. Keep their authority and source lineage explicit. A route identity may be `draft` before its geometry is imported; do not invent geometry to make it publishable.

- [ ] **Step 2: Attach authoritative geometry where available**

Prefer REDIAM/Junta geometry for the official set where available. For every imported asset, store source id, geometry version, format, verified date, and calculated metrics. When official source numbers differ from calculated track numbers, preserve both and flag the discrepancy instead of silently replacing either value.

- [ ] **Step 3: Add provincial R routes as a separate authority family**

Import the audited provincial R inventory without merging identities into similarly named official/municipal routes. Keep known POIs/checkpoints such as Cueva de la Graja, Pinar de Cánava, Aznaitín, Zurreón, Mata Bejid, Puerto de la Mata, Pico Mágina/Miramundos, Gargantón, Cuadros, Caño del Aguadero, Torre del Lucero, and Bélmez only where their association is source-backed.

- [ ] **Step 4: Add GR/PR/SL and municipal routes with independent identity rules**

A homologated or municipal route may overlap geometry with another adventure but remains a separate catalog entry when authority, official naming, route code, or legal status differs. Use aliases/relationships rather than destructive deduplication.

- [ ] **Step 5: Apply publication gates**

Only set `publicationState: 'publishable'` when `validateCatalog` has no hard errors and the route has source-backed core data plus validated geometry when the activity requires a track. R4/R5/R8 or any other route whose authoritative track has not been located/validated remains draft rather than receiving a community track as if official.

- [ ] **Step 6: Re-run full validation after every batch**

Run:

```bash
pnpm --filter @magina-aventura/adventure-catalog validate
pnpm test
pnpm typecheck
```

Expected: zero hard catalog errors and all workspace tests/typechecks passing.

- [ ] **Step 7: Commit each authority family separately**

```bash
git commit -am "data(catalog): add official Sierra Magina senderos"
git commit -am "data(catalog): add provincial adventure routes"
git commit -am "data(catalog): add homologated and municipal routes"
```

Do not combine unrelated authority families into one opaque data commit.

---

### Task 8: Stabilize the read contract for later RC integration

**Files:**
- Create: `packages/adventure-catalog/src/read-model.ts`
- Create: `packages/adventure-catalog/src/read-model.test.ts`
- Modify: `packages/adventure-catalog/src/index.ts`
- Do not modify RC/app UI in this task.

**Interfaces:**
- Produces a storage-independent consumer surface.

- [ ] **Step 1: Write failing read-model tests**

```ts
const catalog = createCatalogReader(getCatalogSnapshot());
expect(catalog.list({ municipalityId: 'bedmar-y-garciez' })).toEqual(expect.any(Array));
expect(catalog.bySlug('las-vinas-cuadros')?.adventure.id).toBe('ma-001');
expect(catalog.bySlug('las-vinas-cuadros')?.operationalStatus).not.toBe('open');
```

- [ ] **Step 2: Implement the reader**

```ts
export interface CatalogReader {
  list(filters?: AdventureFilters): AdventureListItem[];
  bySlug(slug: string): AdventureDetailView | null;
  pois(adventureId: string): CatalogPoi[];
  restrictions(adventureId: string): Restriction[];
}
```

`AdventureDetailView` combines canonical adventure data with derived operational status and completeness metadata but never mutates the canonical record.

- [ ] **Step 3: Verify package and workspace**

Run:

```bash
pnpm --filter @magina-aventura/adventure-catalog test
pnpm --filter @magina-aventura/adventure-catalog validate
pnpm test
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 4: Compare branch scope**

Run:

```bash
git diff --stat main...HEAD
git diff --name-only main...HEAD
```

Expected: changes limited to contracts/domain/geo/route-import/adventure-catalog/docs plus lockfile changes required by the new package. No mobile UI, Weather, GPS tracking, Community, Admin, auth, onboarding, or promo files.

- [ ] **Step 5: Commit**

```bash
git add packages/adventure-catalog
git commit -m "feat(catalog): expose stable catalog read model"
```

---

## Final Verification

Run all of the following from repository root:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm lint
pnpm --filter @magina-aventura/adventure-catalog validate
git diff --check
git diff --name-only main...HEAD
```

Success criteria:

1. All tests, typechecks, lint, and catalog hard validation pass.
2. The catalog contains real Sierra Mágina records only; no development fixtures are presented as real adventures.
3. Every sensitive safety/water/accessibility/restriction claim has source provenance.
4. The Las Viñas/Cuadros restriction is represented independently from route metadata and prevents a derived unconditional `open` state.
5. The 17 official senderos are represented as distinct source-backed identities; geometry is publishable only where validated.
6. Provincial, homologated, municipal, and community-derived records remain distinguishable by authority/source and are not silently merged.
7. RC/mobile product code has not been modified.
8. The final catalog read model is storage-independent and ready for a later adapter into RC/Supabase without changing canonical data semantics.
