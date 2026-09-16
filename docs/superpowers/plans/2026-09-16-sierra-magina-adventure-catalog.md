# Sierra Mágina Adventure Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an isolated, source-traceable Sierra Mágina adventure catalog that validates real routes, geometry, POIs, safety/restrictions, family/accessibility facts, and exposes a stable read model for later RC consumption.

**Architecture:** Keep shared data shapes in `@magina-aventura/contracts`, business rules in `@magina-aventura/domain`, geometry rules in `@magina-aventura/geo`, source-file parsing in `@magina-aventura/route-import`, and canonical records in a new `@magina-aventura/adventure-catalog` package. The catalog remains portable without Supabase and does not touch mobile UI, Weather, GPS tracking, Community, Admin, authentication, onboarding, or promotional web flows.

**Tech Stack:** TypeScript 6, Node >=22.13, pnpm >=10, Vitest 3, workspace packages, GeoJSON-compatible primitives, existing `fast-xml-parser` route importer.

**Spec:** `docs/superpowers/specs/2026-09-16-sierra-magina-adventure-catalog-design.md`

## Global Constraints

- Work only on `feat/adventure-catalog-v1` until catalog contracts and the starter dataset are stable.
- Do not redesign route screens or modify mobile/web product flows.
- Do not couple the canonical catalog to live Weather, GPS, Community, Admin, or Supabase.
- No invented routes, POIs, closures, potable-water claims, accessibility claims, or safety facts.
- Lack of current closure information must never become a guaranteed `open` state.
- Official/source facts and Mágina Aventura editorial derivations must remain distinguishable.
- Canonical source geometry stays separate from simplified/mobile derivatives.
- Sensitive facts require provenance and `checkedAt`.
- Preserve authority families: Parque Natural/Junta, provincial R routes, GR/PR/SL, municipal routes, community-only leads.
- Reuse the prior audited inventory rather than restarting research.
- The known temporary closure affecting Las Viñas/Cuadros must be an independent restriction/advisory and must prevent an unconditional `open` state until authoritative evidence confirms otherwise.

## Audited official inventory to carry forward

The 17 Junta/Parque Natural route identities already researched are:

1. Adelfal de Cuadros — Bedmar y Garcíez
2. Caño del Aguadero — Bedmar y Garcíez
3. Castillo de Albanchez — Albanchez de Mágina
4. Castillo de Mata Bejid — Cambil
5. El Peralejo — Cambil
6. Fuenmayor — Torres
7. Gibralberca — Cambil
8. Hoyalinos — Torres
9. Cueva de la Graja — Jimena
10. Las Viñas — Bedmar y Garcíez
11. Pinar de Cánava — Jimena
12. Puerto de la Mata — Cambil
13. Sierra de la Cruz — Jódar
14. Hoyo de la Laguna — Bélmez de la Moraleda
15. Pico Mágina y Miramundos — Huelma
16. Umbría de los Corzos — Cambil
17. Veredón–Mojón Blanco — Pegalajar

Provincial R1–R9 remain a separate authority family. Known route facts from prior research include R1 Cueva de la Graja–Los Caracoles–Pinar de Cánava and R2 Albanchez–Aznaitín; R4, R5, and R8 must remain non-publishable until authoritative track geometry is located and validated.

---

## File Structure

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
packages/adventure-catalog/src/read-model.ts
packages/adventure-catalog/src/read-model.test.ts
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

---

### Task 1: Freeze the shared catalog contract

**Files:**
- Create: `packages/contracts/src/catalog.ts`
- Create: `packages/contracts/src/catalog.type-test.ts`
- Modify: `packages/contracts/src/index.ts`

**Interfaces:**
- Produces: `Adventure`, `TrackAsset`, `CatalogPoi`, `CatalogSource`, `Restriction`, `DifficultyFactors`, `FamilyFactors`, `AccessibilityFact`, `CatalogSnapshot`, `VerificationState`, `OperationalStatus`.
- Existing `RouteSummary` / `RouteDetail` remain unchanged.

- [ ] **Step 1: Write the failing compile-time contract test**

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

- [ ] **Step 3: Implement the complete contract**

Create `packages/contracts/src/catalog.ts` with these exact public shapes:

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

export interface CatalogFact {
  code: string;
  text: string;
  sourceIds: string[];
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

export interface FamilyFactors {
  editorialSuitability: 'suitable' | 'conditional' | 'not_recommended' | 'review_required';
  minimumAge: number | null;
  strollerViability: 'yes' | 'no' | 'unknown';
  factors: CatalogFact[];
}

export interface AccessibilityFact extends CatalogFact {
  feature: 'surface' | 'width' | 'steps' | 'slope' | 'barrier' | 'adapted_parking' | 'adapted_facility';
}

export interface AdventureMetrics {
  distanceKm: number | null;
  ascentM: number | null;
  descentM: number | null;
  minElevationM: number | null;
  maxElevationM: number | null;
  durationMinutesMin: number | null;
  durationMinutesMax: number | null;
}

export interface Adventure {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  activityTypes: ActivityType[];
  municipalityIds: string[];
  shape: RouteShape;
  publicationState: PublicationState;
  verificationState: VerificationState;
  sourceIds: string[];
  trackId: string | null;
  metrics: AdventureMetrics;
  difficulty: DifficultyFactors;
  family: FamilyFactors;
  accessibilityFacts: AccessibilityFact[];
  stableSafetyCharacteristics: CatalogFact[];
}

export interface TrackAsset {
  id: string;
  adventureId: string;
  geometryVersion: number;
  format: 'gpx' | 'geojson' | 'kml' | 'gml';
  sourceIds: string[];
  verifiedAt: string | null;
  geometryQuality: 'verified' | 'cross_checked' | 'unverified';
  geometryRef: string;
  metrics: AdventureMetrics;
}

export interface WaterMetadata {
  potableStatus: 'confirmed' | 'not_confirmed' | 'not_potable' | 'unknown';
  seasonalReliability: 'reliable' | 'seasonal' | 'unknown';
  lastVerifiedAt: string | null;
}

export interface CatalogPoi {
  id: string;
  name: string;
  category: 'water' | 'viewpoint' | 'parking' | 'recreation_area' | 'refuge' | 'geology' | 'heritage' | 'visitor_facility' | 'village_service' | 'emergency_reference';
  position: readonly [longitude: number, latitude: number];
  adventureIds: string[];
  sourceIds: string[];
  verificationState: VerificationState;
  water: WaterMetadata | null;
}

export interface Restriction {
  id: string;
  scope:
    | { type: 'adventure'; adventureId: string }
    | { type: 'poi'; poiId: string }
    | { type: 'area'; areaRef: string };
  type: 'temporary_closure' | 'access_restriction' | 'wildfire' | 'forestry_works' | 'hunting' | 'weather' | 'damaged_trail' | 'water_outage' | 'open_confirmation';
  severity: 'info' | 'warning' | 'restricting' | 'blocking';
  status: 'active' | 'scheduled' | 'resolved' | 'unknown';
  startsAt: string | null;
  endsAt: string | null;
  sourceIds: string[];
  publishedAt: string | null;
  checkedAt: string;
  reason: string;
}

export interface CatalogSnapshot {
  generatedAt: string;
  adventures: Adventure[];
  tracks: TrackAsset[];
  pois: CatalogPoi[];
  sources: CatalogSource[];
  restrictions: Restriction[];
}
```

- [ ] **Step 4: Export and verify**

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

### Task 2: Add catalog invariants, provenance validation, status, and completeness

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
- Produces: `validateCatalog(snapshot): CatalogValidationIssue[]`, `deriveOperationalStatus(adventureId, restrictions): OperationalStatus`, `calculateCompleteness(adventure, snapshot): CatalogCompleteness`.

- [ ] **Step 1: Write failing tests**

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

- [ ] **Step 3: Add the contracts dependency**

```json
"dependencies": {
  "@magina-aventura/contracts": "workspace:*"
}
```

- [ ] **Step 4: Implement exact validation codes**

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

`publishable` requires identity, at least one valid source, non-null distance, duration range, difficulty factors, and a `verified`/`cross_checked` track for route-based activities. POIs are not mandatory for publication.

- [ ] **Step 5: Implement operational status precedence**

```ts
blocking active notice => 'closed'
active restricting notice => 'restricted'
active warning => 'caution'
active open_confirmation from official/cross-checked source => 'open'
otherwise => 'unknown'
```

Resolved notices do not affect current status.

- [ ] **Step 6: Implement completeness dimensions**

```ts
export type CompletenessDimension =
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

Each dimension returns `{ complete: boolean; score: number }`, with `score` in `0..100`. Missing optional dimensions produce warnings only and never mutate publication state.

- [ ] **Step 7: Verify**

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

### Task 3: Make canonical geometry reproducible and testable

**Files:**
- Create: `packages/geo/src/track-metrics.ts`
- Create: `packages/geo/src/track-metrics.test.ts`
- Create: `packages/geo/src/geometry-validation.ts`
- Create: `packages/geo/src/geometry-validation.test.ts`
- Modify: `packages/geo/src/index.ts`

**Interfaces:**
- Produces: `calculateTrackMetrics(line, elevationsM)`, `validateCanonicalGeometry(line, options?)`.

- [ ] **Step 1: Write failing metric tests**

```ts
const metrics = calculateTrackMetrics(line, [700, 720, 710]);
expect(metrics.ascentM).toBe(20);
expect(metrics.descentM).toBe(10);
expect(metrics.minElevationM).toBe(700);
expect(metrics.maxElevationM).toBe(720);
```

Also test invalid lon/lat, fewer than two coordinates, zero-length routes, non-finite values, and segment gaps.

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

Use the existing distance helper. Elevation outputs become `null` if the elevation array length differs from the coordinate count or contains unusable gaps.

- [ ] **Step 4: Implement explicit geometry QA**

```ts
export interface GeometryValidationOptions {
  acceptanceBounds?: readonly [west: number, south: number, east: number, north: number];
  maxSegmentKm?: number;
}
```

Defaults: no acceptance bounds and `maxSegmentKm = 5`. A segment longer than the threshold yields `suspicious_segment_gap`; it is a hard validation failure for canonical publishable geometry. Bounds are supplied by the caller; do not encode an invented protected-area polygon.

- [ ] **Step 5: Export and verify**

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

### Task 4: Extend source-file ingestion without storage coupling

**Files:**
- Create: `packages/route-import/src/geojson.ts`
- Create: `packages/route-import/src/geojson.test.ts`
- Create: `packages/route-import/src/source-metadata.ts`
- Modify: `packages/route-import/src/gpx.ts`
- Modify: `packages/route-import/src/gpx.test.ts`
- Modify: `packages/route-import/src/index.ts`

**Interfaces:**
- Produces normalized geometry plus source metadata; no database writes.

- [ ] **Step 1: Write failing GeoJSON tests**

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

Reject Polygon, MultiPolygon, empty LineString, invalid coordinates, and non-Feature input.

- [ ] **Step 2: Run tests and confirm failure**

Run: `pnpm --filter @magina-aventura/route-import test`

Expected: FAIL for missing GeoJSON parser.

- [ ] **Step 3: Implement source metadata**

```ts
export interface ImportedGeometrySource {
  sourceId: string;
  format: 'gpx' | 'geojson' | 'kml' | 'gml';
  importedAt: string;
  geometryVersion: number;
}
```

- [ ] **Step 4: Extend GPX result with metrics**

After `validateRouteLineFeature`, call `calculateTrackMetrics` and return metrics alongside line/start/bounds/elevations. Existing callers must continue to typecheck.

- [ ] **Step 5: Verify**

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

- [ ] **Step 1: Write failing read tests**

```ts
expect(getAdventureBySlug('las-vinas-cuadros')?.id).toBe('ma-001');
expect(listAdventures({ municipalityId: 'bedmar-y-garciez' }).length).toBeGreaterThan(0);
expect(getAdventureRestrictions('ma-001')).toEqual(
  expect.arrayContaining([expect.objectContaining({ type: 'temporary_closure' })]),
);
```

- [ ] **Step 2: Add package manifest**

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

- [ ] **Step 3: Seed the first evidence-backed route**

Create `ma-001` Las Viñas with the already verified official figures: circular, 8.7 km, about 3 hours, official difficulty medium/moderate, Bedmar y Garcíez, start area at Cuadros. Keep independently calculated figures (8.99 km, +426 m, 568–917 m, 2 h 56 min) out of the official metrics object unless stored with an explicit non-official provenance source. Represent the known closure as `Restriction(type='temporary_closure', severity='blocking')` and keep `publicationState='draft'` until geometry/provenance validation passes.

- [ ] **Step 4: Implement pure in-memory selectors**

```ts
export interface AdventureFilters {
  municipalityId?: string;
  activityType?: ActivityType;
  difficulty?: SimpleDifficulty;
  operationalStatus?: OperationalStatus;
}
```

- [ ] **Step 5: Verify**

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

### Task 6: Add quality gate and source ledger

**Files:**
- Create: `packages/adventure-catalog/src/quality-report.ts`
- Create: `packages/adventure-catalog/src/quality-report.test.ts`
- Create: `packages/adventure-catalog/scripts/validate-catalog.ts`
- Create: `docs/catalog/source-ledger.md`

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

- [ ] **Step 2: Implement CLI hard-failure behavior**

```ts
const issues = validateCatalog(getCatalogSnapshot());
const hardErrors = issues.filter((issue) => issue.severity === 'error');
if (hardErrors.length > 0) {
  console.error(JSON.stringify(hardErrors, null, 2));
  process.exitCode = 1;
}
```

- [ ] **Step 3: Create the source ledger with fixed columns**

Use this Markdown table schema:

```md
| Source ID | Publisher | Authority family | Scope | URL | Published | Checked | Verification | License/reuse | Claims |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
```

Every source in `sources.ts` must have one ledger row.

- [ ] **Step 4: Verify**

```bash
pnpm --filter @magina-aventura/adventure-catalog test
pnpm --filter @magina-aventura/adventure-catalog validate
```

Expected: PASS for hard invariants; completeness warnings print without changing exit code.

- [ ] **Step 5: Commit**

```bash
git add packages/adventure-catalog docs/catalog/source-ledger.md
git commit -m "feat(catalog): add source ledger and quality gate"
```

---

### Task 7: Populate the audited real Sierra Mágina inventory in authority batches

**Files:**
- Modify: `packages/adventure-catalog/src/data/sources.ts`
- Modify: `packages/adventure-catalog/src/data/adventures.ts`
- Modify: `packages/adventure-catalog/src/data/pois.ts`
- Modify: `packages/adventure-catalog/src/data/tracks.ts`
- Modify: `packages/adventure-catalog/src/data/restrictions.ts`
- Modify: `docs/catalog/source-ledger.md`
- Add geometry assets only when an authoritative source lawfully provides them.

- [ ] **Step 1: Add all 17 audited official identities**

Create one `Adventure` per route from the exact inventory at the top of this plan. Start every entry as `draft`; preserve authority, municipality, source URL, and checked date. Do not infer missing numeric fields.

- [ ] **Step 2: Attach authoritative geometry**

Prefer REDIAM/Junta geometry for the 17 official routes when available. Each `TrackAsset` stores source id, geometry version, format, verified date, geometry quality, geometry ref, and calculated metrics. If source-published metrics differ from calculated geometry metrics, preserve both through separate source-backed records and surface a quality warning.

- [ ] **Step 3: Add provincial R routes separately**

Keep R1–R9 distinct from similarly named Junta/municipal routes. Known checkpoint/POI associations may be added only when source-backed. R4/R5/R8 remain `draft` while authoritative geometry is unresolved.

- [ ] **Step 4: Add GR/PR/SL and municipal routes with independent identity rules**

Overlapping geometry does not imply duplicate identity when route code, authority, legal/homologation status, or official naming differs. Model aliases/relationships; do not destructively merge records.

- [ ] **Step 5: Apply publication gates**

Set `publicationState='publishable'` only when `validateCatalog` returns zero hard errors for the route, provenance is complete, and geometry is validated for route-based activities. Community geometry cannot be promoted as official geometry.

- [ ] **Step 6: Validate each batch**

```bash
pnpm --filter @magina-aventura/adventure-catalog validate
pnpm test
pnpm typecheck
```

Expected: zero hard catalog errors and all workspace checks passing.

- [ ] **Step 7: Commit authority families separately**

```bash
git commit -am "data(catalog): add official Sierra Magina senderos"
git commit -am "data(catalog): add provincial adventure routes"
git commit -am "data(catalog): add homologated and municipal routes"
```

---

### Task 8: Stabilize the read contract for later RC integration

**Files:**
- Create: `packages/adventure-catalog/src/read-model.ts`
- Create: `packages/adventure-catalog/src/read-model.test.ts`
- Modify: `packages/adventure-catalog/src/index.ts`

**Interfaces:**
- Produces storage-independent consumer API; no RC/app changes.

- [ ] **Step 1: Write failing reader tests**

```ts
const catalog = createCatalogReader(getCatalogSnapshot());
expect(catalog.list({ municipalityId: 'bedmar-y-garciez' })).toEqual(expect.any(Array));
expect(catalog.bySlug('las-vinas-cuadros')?.adventure.id).toBe('ma-001');
expect(catalog.bySlug('las-vinas-cuadros')?.operationalStatus).not.toBe('open');
```

- [ ] **Step 2: Implement exact reader interface**

```ts
export interface CatalogReader {
  list(filters?: AdventureFilters): AdventureListItem[];
  bySlug(slug: string): AdventureDetailView | null;
  pois(adventureId: string): CatalogPoi[];
  restrictions(adventureId: string): Restriction[];
}
```

`AdventureDetailView` combines canonical data with derived operational status and completeness metadata without mutating canonical records.

- [ ] **Step 3: Verify package and workspace**

```bash
pnpm --filter @magina-aventura/adventure-catalog test
pnpm --filter @magina-aventura/adventure-catalog validate
pnpm test
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 4: Verify branch isolation**

```bash
git diff --stat main...HEAD
git diff --name-only main...HEAD
```

Expected paths: contracts/domain/geo/route-import/adventure-catalog/docs plus required lockfile changes. No mobile UI, Weather, GPS tracking, Community, Admin, auth, onboarding, or promo files.

- [ ] **Step 5: Commit**

```bash
git add packages/adventure-catalog
git commit -m "feat(catalog): expose stable catalog read model"
```

---

## Final Verification

Run from repository root:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm lint
pnpm --filter @magina-aventura/adventure-catalog validate
git diff --check
git diff --name-only main...HEAD
```

Success criteria:

1. Tests, typechecks, lint, and hard catalog validation pass.
2. Catalog contains real Sierra Mágina records only; no development fixture is presented as a real adventure.
3. Sensitive safety/water/accessibility/restriction claims have provenance.
4. Las Viñas/Cuadros closure remains independent from route metadata and prevents unconditional `open`.
5. All 17 official senderos exist as distinct source-backed identities; only validated geometry becomes publishable.
6. Provincial, homologated, municipal, and community-derived records remain distinguishable by authority/source.
7. RC/mobile product code remains untouched.
8. Read model is storage-independent and ready for later RC/Supabase adapters without changing canonical semantics.
