# Mágina Aventura — MapLibre + GPX + Offline Design

**Date:** 2026-09-15
**Status:** Approved direction
**Base:** `feat/foundation-v1` @ `3f49cdbc71bf729abb22c2e06b13becad3f52b85`
**Implementation branch:** `feat/map-offline-v1`

## Goal

Replace the development map placeholder with a production-oriented route mapping pipeline that can render authoritative route geometry in MapLibre, import/version GPX tracks into PostGIS, and prepare a route for offline use without depending on continuous network coverage.

The subsystem must preserve the product rule established in the master spec: route geometry, safety information, checkpoints and discoveries are authoritative only when they come from verified/versioned content. Development fixtures must remain explicitly labelled and must never masquerade as verified Cuadros data.

## Architecture Decision

The selected architecture is:

`GPX source -> normalized GeoJSON -> PostGIS/versioned route geometry -> route map payload -> MapLibre React Native`

and for map assets:

`Cloudflare R2-compatible HTTPS origin -> PMTiles archive -> remote pmtiles:// source or explicitly downloaded local PMTiles file -> MapLibre Native`

The app uses MapLibre React Native in an Expo custom development build. Expo Go is not a supported runtime for this subsystem because MapLibre includes native code.

### Why PMTiles is not downloaded with MapLibre OfflineManager

PMTiles is treated as an explicit route/map asset. The app downloads the archive itself to application storage and then points MapLibre at a local `pmtiles://file://...` URI. The MapLibre native PMTiles path and MapLibre offline-pack path remain separate on purpose.

This prevents the offline system from assuming that a PMTiles source can be cached by `OfflineManager`, keeps the artifact immutable/versioned, and makes the package compatible with object storage/CDN delivery.

## Runtime Boundaries

### PostGIS owns

- authoritative route geometry (`LineString`, SRID 4326);
- route geometry version;
- authoritative start point;
- checkpoint positions/radii;
- discovery positions/radii;
- spatial queries and future route-proximity operations.

### Route contracts own

The shared contracts package must describe the payload consumed by mobile without importing Supabase, Expo, React Native or MapLibre.

Required contract concepts:

- `GeoJsonPosition` as `[longitude, latitude]`;
- `RouteLineFeature` as a GeoJSON `Feature<LineString>`;
- `RouteMapPayload` containing route ID, geometry version, line feature, start point, checkpoints and public discoveries;
- `OfflineRoutePackageManifest` containing route/content/geometry versions, map archive metadata and bounds;
- `OfflineMapAsset` containing a stable asset ID, HTTPS URL, byte size, MD5 checksum, minimum/maximum zoom and immutable object key.

The manifest is versioned independently from UI state.

### MapLibre adapter owns

- rendering the base map;
- rendering route line and start/finish/checkpoint markers;
- fitting camera to route bounds;
- switching a PMTiles map source between remote HTTPS and local `file://` storage;
- map-specific styling and interaction.

The route detail screen must not construct MapLibre layers directly. It consumes a map component boundary.

### Mobile offline package manager owns

- package state (`not-downloaded`, `downloading`, `ready`, `stale`, `error`);
- destination path generation;
- downloading the PMTiles archive through `expo-file-system`;
- storing manifest metadata locally;
- verifying downloaded byte size and MD5 when supplied;
- detecting version mismatch;
- deleting/replacing stale package files;
- returning the local PMTiles URI to the map adapter.

No reward, GPS activity, checkpoint completion or discovery award logic belongs in this subsystem.

## GPX Import Contract

GPX ingestion must be deterministic and testable outside the mobile app.

The importer accepts GPX XML and produces:

- ordered `[longitude, latitude]` coordinates;
- optional elevation samples when present;
- calculated start coordinate;
- bounding box `[west, south, east, north]`;
- distance estimate for review;
- normalized GeoJSON `LineString` feature.

Invalid inputs are rejected when:

- no track/route coordinates exist;
- fewer than two valid coordinates exist;
- latitude is outside `[-90, 90]`;
- longitude is outside `[-180, 180]`;
- XML cannot be parsed.

Import does **not** publish a route. It creates/replaces a versioned geometry only through an explicit database/admin action. A route remains `draft` until content review and later publishing workflow approve it.

## Database Additions

Add a route asset table rather than embedding object-storage URLs in route content:

`route_map_assets`

Fields:

- `id uuid primary key`;
- `route_id uuid not null`;
- `geometry_version integer not null`;
- `asset_kind text` limited initially to `pmtiles`;
- `object_key text not null`;
- `public_url text not null`;
- `byte_size bigint not null`;
- `md5 text`;
- `min_zoom numeric`;
- `max_zoom numeric`;
- `bounds extensions.geometry(Polygon, 4326)`;
- `created_at timestamptz`;
- unique `(route_id, geometry_version, asset_kind)`.

Published-route users may read assets only when the parent route is published. Draft route assets remain inaccessible through public RLS.

A database function returns the map payload for a published route slug using `ST_AsGeoJSON` for the selected geometry version. The function must not expose draft routes through anonymous access.

## Cloudflare R2 / Object Storage Rules

R2 is an implementation target, not a database of record.

Object keys are immutable and versioned:

`routes/{routeId}/geometry/{geometryVersion}/basemap.pmtiles`

The database stores the resulting public HTTPS URL and metadata. Replacing geometry creates a new object key; it does not overwrite a previous version in place.

Required HTTP behavior for the production origin:

- HTTPS;
- byte-range requests enabled;
- `Content-Type: application/vnd.pmtiles` when available;
- long-lived cache headers for immutable versioned objects;
- CORS permitting the app/web admin origins that need direct reads.

No Cloudflare credentials are committed to the repository.

## Mobile Map Rendering

The real map component receives `RouteMapPayload` plus an optional offline package state.

Rendering order:

1. base style/source;
2. route geometry line;
3. start and finish markers;
4. checkpoints;
5. discovery hints that are allowed to be visible before discovery;
6. later activity/user layers (out of scope for this subsystem).

The map must be usable without the route-specific PMTiles archive. In development, an explicit development map style may be used. Production style URL is configuration, never hard-coded credentials.

## Offline Package State

Canonical state:

`NOT_DOWNLOADED -> DOWNLOADING -> READY`

Additional transitions:

- any version mismatch from `READY` -> `STALE`;
- download/integrity failure -> `ERROR`;
- retry from `ERROR` -> `DOWNLOADING`;
- replacement from `STALE` -> `DOWNLOADING` -> `READY`.

A package is `READY` only when the local file exists and metadata matches route ID, geometry version, manifest version, expected byte size, and checksum when a checksum is supplied.

## Scope of V1

This subsystem includes:

- MapLibre native installation/configuration;
- real map adapter in route detail;
- pure GeoJSON/bounds helpers;
- deterministic GPX parser/import helper;
- PostGIS map payload function;
- route map asset metadata/RLS;
- offline package contracts/state machine;
- explicit PMTiles download to app storage;
- local-vs-remote PMTiles URI selection;
- route detail download/preparation status;
- CI verification of TypeScript, unit tests and Supabase migrations.

This subsystem does not include:

- production Cuadros GPX if no verified source has been provided;
- GPS activity recording;
- background location;
- off-route detection;
- reward validation;
- checkpoint completion;
- discovery awarding;
- admin publishing UI;
- Cloudflare account/bucket provisioning.

Those boundaries are intentional. The output of this plan becomes the foundation for the Activity Engine plan.

## Acceptance Criteria

The subsystem is acceptable when all of the following are true:

1. Expo configuration includes MapLibre and can generate native Android project configuration without plugin errors.
2. Route detail renders through the real MapLibre adapter rather than `DevelopmentMap`.
3. A route line can be supplied as versioned GeoJSON and camera bounds are computed deterministically.
4. GPX parsing has red/green tests for valid tracks and invalid coordinates/empty tracks.
5. Supabase `db reset` creates route map assets, RLS and the published-route map payload function without SQL errors.
6. Public RLS does not expose map assets for draft routes.
7. Offline state/version logic has unit tests.
8. PMTiles downloads use explicit application storage, not MapLibre `OfflineManager`.
9. A ready offline package yields a local `pmtiles://file://...` source URI; otherwise the map can use the configured remote source.
10. No verified Bedmar/Cuadros geometry is invented.
11. `pnpm typecheck`, `pnpm test`, pure-package boundary checks and Supabase reset are green in CI.
12. `main` is not modified during implementation.
