# Sierra Mágina Adventure Catalog — Design

Date: 2026-09-16
Status: Approved in chat, pending written-spec review
Scope: Independent catalog subsystem for Mágina Aventura

## 1. Goal

Build a canonical, verifiable catalog of outdoor adventures in Sierra Mágina that can evolve independently from the mobile app, web promo, Weather, GPS, Admin, Community, and release-candidate work.

The catalog must model routes, tracks, points of interest, water points, geographic data, difficulty, family suitability, accessibility-relevant facts, safety, closures/restrictions, source provenance, and verification state. Release candidates will consume this catalog later through a stable interface rather than owning the data directly.

## 2. Isolation strategy

Implementation will live on a dedicated branch: `feat/adventure-catalog-v1`.

The subsystem will reuse existing monorepo boundaries where appropriate:

- `packages/domain` for catalog entities, rules, enums, validation, and status derivation.
- `packages/geo` for geographic primitives, geometry validation, bounding boxes, track metrics, and spatial helpers.
- `packages/route-import` for import/normalization of GPX/GeoJSON and source-specific route ingestion.
- a dedicated catalog data area/package for canonical records and fixtures, introduced only if needed by implementation.
- Supabase persistence is not required for the first catalog milestone; the domain and dataset must remain portable and testable without a live backend.

No work in this branch should modify UI flows unless a tiny adapter or type export is necessary to prove the catalog contract. It must not modify Weather, GPS tracking, Community, Admin workflows, authentication, onboarding, or promotional web behavior.

## 3. Core model

### 3.1 Adventure

An `Adventure` is the public catalog entry representing something a user can intentionally do: hiking route, family walk, viewpoint approach, nature route, heritage route, or similar activity.

Required identity and discovery fields:

- stable id and slug
- canonical name
- short summary and longer description
- activity types
- municipalities / area
- start and end references
- circular / linear / out-and-back classification
- publication state
- verification state

Physical metrics when known:

- distance
- ascent and descent
- minimum / maximum elevation
- estimated duration or duration range
- surface / terrain summary
- track reference

### 3.2 Track and geometry

A route track is a versioned geographic asset, not an opaque field embedded in the Adventure record.

Track metadata should support:

- source
- geometry format
- imported-at / verified-at dates
- track version
- distance and elevation statistics
- bounding box
- start/end coordinates
- geometry quality / confidence
- optional simplification levels for app use

The canonical source geometry should remain separate from any simplified/mobile derivative.

### 3.3 POI

Points of interest are first-class reusable records. Initial categories include:

- spring / fountain / drinking-water point
- viewpoint
- parking / trailhead
- picnic or recreation area
- refuge / shelter
- cave / geological interest
- castle / archaeological / heritage point
- interpretation / visitor facility
- village service point
- emergency / escape reference where appropriate

POIs may belong to multiple adventures and should contain coordinates, descriptive metadata, verification state, and provenance.

### 3.4 Water points

Water availability must not be represented as a simple boolean.

A water POI should distinguish:

- physical point exists
- potable status: confirmed / not confirmed / not potable / unknown
- seasonal reliability when sourced
- last verification date
- provenance
- warning text where necessary

The catalog must never imply a source is safe to drink from merely because a fountain exists.

## 4. Difficulty and user profiles

Difficulty is multi-dimensional. Avoid one opaque rating as the sole truth.

The model should capture, where evidence permits:

- physical demand
- technical terrain
- navigation complexity
- exposure / fall consequence
- remoteness / escape difficulty
- total distance / elevation burden

A derived simple label may be exposed to users, but the underlying factors must remain inspectable.

### Family profile

`familySuitable` must not be a blanket editorial claim. The catalog should model the factors used to derive or explain a family profile, including:

- recommended minimum age only when sourced or clearly editorial
- stroller viability as factual terrain information, not assumption
- exposure
- steep sections
- road crossings
- water hazards
- distance / ascent
- shade / heat exposure
- escape options

Any Mágina Aventura-derived family recommendation must be explicitly distinguishable from an official/source statement.

### Accessibility

Accessibility-related facts must stay granular and sourced. Do not collapse them into a generic `accessible: true/false` field unless an official source explicitly defines that status.

Possible facts include firm surface, width constraints, steps, slope, barriers, adapted parking, and adapted facilities.

## 5. Safety model

Safety is split into relatively stable route characteristics and dynamic operational conditions.

### Stable safety characteristics

Examples:

- exposed ridges or cliffs
- scrambling / technical sections
- river or stream crossings
- livestock / gates
- low mobile coverage
- long stretches without water
- limited shade
- winter ice/snow susceptibility
- heat exposure
- hunting-area relevance when sourced

### Dynamic operational conditions

Examples:

- temporary closure
- access restriction
- wildfire restrictions
- forestry works
- hunting events / restrictions
- storm / snow / extreme heat warnings
- damaged trail / bridge
- temporary water-point outage

Dynamic conditions must overlay the catalog without overwriting the canonical route definition.

## 6. Closures and operational status

A `Restriction` or `Advisory` record should contain:

- id
- affected adventure / segment / POI / area
- type
- severity
- status
- starts-at / ends-at when known
- source
- published-at and checked-at
- human-readable reason
- geometry/area when applicable

The app-facing route state can then be derived, for example:

- open
- caution
- restricted
- closed
- unknown / stale

A lack of current closure data must never be translated into a guaranteed `open` state.

## 7. Provenance and trust

Every safety-sensitive or operationally meaningful fact should support provenance.

A source record should capture:

- organization / publisher
- source type
- title or description
- source URL or stable reference
- publication date when available
- retrieved / checked date
- license / reuse note when relevant
- confidence / verification level

Recommended verification states:

- `official_verified`
- `cross_checked`
- `community_unverified`
- `editorial_derived`
- `stale`
- `unknown`

Editorial interpretation must never masquerade as an official statement.

## 8. Data quality lifecycle

Catalog records should support a lightweight editorial lifecycle:

1. discovered
2. imported / drafted
3. normalized
4. source-checked
5. geographically validated
6. editorially reviewed
7. publishable
8. stale / needs recheck
9. retired / archived

Each route should expose a data-completeness report so we can prioritize missing information rather than pretending all entries have equal quality.

Suggested completeness dimensions:

- identity
- geometry
- metrics
- POIs
- water
- difficulty
- safety
- family factors
- accessibility facts
- sources
- freshness

## 9. Data-source policy

Priority order for factual catalog data:

1. official public administrations / protected-area authorities
2. municipalities and official tourism bodies
3. recognized trail federations / homologation sources
4. authoritative geographic/open-data sources
5. trustworthy local organizations
6. cross-checked community sources for leads or secondary confirmation

Community platforms may help discover routes or inconsistencies, but a safety-sensitive fact should not be promoted to verified status solely from an unsourced community upload.

The system should record conflicts rather than silently choose one source when distance, elevation, route alignment, access, or naming disagree materially.

## 10. Geographic validation

Imported geometry must be validated for:

- valid coordinates
- plausible Sierra Mágina location
- no impossible jumps or corrupt segments
- start/end consistency
- computed distance versus claimed distance
- elevation-data sanity where elevation is available
- duplicated or near-duplicated tracks

Geometry metrics should be reproducible from the canonical track so that app UI does not depend on hand-entered numbers alone.

## 11. Catalog interface for RC

The catalog should expose a stable read model independent of storage.

Minimum future consumer operations:

- list adventures
- filter by activity, municipality, difficulty, family factors, distance/ascent, and status
- get adventure details
- get track/geometry reference
- get associated POIs
- get current restrictions/advisories
- get provenance and last-checked metadata

The RC should consume this interface, not read raw source/import files directly.

## 12. Initial milestone

`adventure-catalog-v1` is successful when it delivers:

- domain contracts for Adventure, Track, POI, Source/Provenance, Restriction/Advisory, difficulty factors, family factors, and verification state
- validators and tests for required invariants
- import path compatible with GPX/GeoJSON or the existing route-import package
- a canonical starter dataset of real Sierra Mágina adventures
- provenance for all sensitive facts in that starter dataset
- completeness/quality report per adventure
- no dependency on the app UI or active RC branch

The first dataset should favor quality over quantity. A smaller set of well-sourced routes is preferable to dozens of superficially complete entries.

## 13. Explicit non-goals for V1

V1 will not:

- redesign route screens
- build the final admin CMS
- implement live weather ingestion
- implement live GPS tracking
- implement social/community features
- guarantee real-time closure monitoring
- create an autonomous scraper that publishes without review
- migrate the whole catalog directly into production Supabase before domain contracts and quality rules are stable

## 14. Testing strategy

Tests should cover:

- schema/domain validation
- invalid coordinates and broken geometry
- route metric derivation
- provenance requirements for sensitive fields
- restriction-status derivation
- stale-source behavior
- family/accessibility derivation rules
- duplicate detection or identity conflicts where feasible
- representative import fixtures

A catalog validation command should fail CI when canonical records violate hard invariants, while softer completeness gaps should be reported without necessarily blocking all development.

## 15. Integration strategy

The branch stays independent until contracts and starter data are stable.

When ready for RC integration:

1. freeze/semver the catalog read contract
2. expose the catalog through a package/service adapter
3. integrate RC as a consumer
4. keep source ingestion and catalog validation outside RC UI code
5. merge dynamic providers such as Weather or closure feeds through adapters that produce Advisories/Restrictions, rather than coupling those services into the canonical route entities

This keeps the catalog reusable by mobile, web, future admin tools, offline packs, and possible public APIs.

## 16. Definition of done for this design

The implementation plan may proceed only after this written spec is reviewed and approved. Any later requirement that changes storage boundaries, the provenance model, or the meaning of safety/operational status should update this design or create a successor spec before implementation diverges.
