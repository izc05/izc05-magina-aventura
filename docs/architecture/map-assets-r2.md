# Map assets on Cloudflare R2

## Status

This document defines the production contract for immutable map assets used by Mágina Aventura. It does **not** mean that a Cloudflare R2 bucket has already been provisioned. R2 provisioning, DNS, credentials and deployment are environment operations and stay outside the application codebase.

## Immutable object key

Every PMTiles archive is versioned by the authoritative route geometry version. The canonical object key is:

```text
routes/{routeId}/geometry/{geometryVersion}/basemap.pmtiles
```

A geometry update publishes a new object under a new key. Existing objects are never overwritten in place once published. This lets the mobile app compare its persisted `geometryVersion` with the published manifest and mark an installed package as `ready` or `stale` deterministically.

## Required origin behavior

The public or authenticated delivery endpoint used by the app must support byte-range requests because PMTiles readers do not download the complete archive for every map request.

```text
HTTPS
Accept-Ranges: bytes
Content-Type: application/vnd.pmtiles (preferred)
Cache-Control: public, max-age=31536000, immutable
```

`Content-Length` should be present and stable for the immutable object. The published manifest stores the expected byte size and, when available, the checksum used by the mobile downloader before persisting the package as ready.

## CORS

CORS must be configured explicitly for the origins that need browser access, such as the administration UI and any approved web client. Do not use `Access-Control-Allow-Origin: *` by default.

Native mobile downloads do not require widening browser CORS policy. If a future web surface consumes the same assets, add only its production/staging origins and the HTTP methods/headers actually required.

## Public URLs and manifests

Supabase stores route/map metadata and exposes the published route payload/manifest. The manifest references:

- the immutable R2 `remoteUrl` for the PMTiles archive;
- a `styleTemplateUrl` for the MapLibre style template;
- byte size and optional checksum;
- geometry/content versions;
- bounds and zoom limits.

The app may stream the remote PMTiles URL or resolve the same source to a verified local `file://` URI after download. The offline package metadata persisted on-device remains the authority for deciding whether the local archive matches the published manifest.

## Publishing workflow

1. Import and verify a real GPX/route geometry.
2. Increment/publish the route geometry version in Supabase.
3. Build the PMTiles archive for that exact geometry version.
4. Upload it to `routes/{routeId}/geometry/{geometryVersion}/basemap.pmtiles`.
5. Verify HTTPS range delivery, byte size, checksum and cache headers.
6. Publish the matching map asset metadata/manifest in Supabase.
7. Only then may clients consider the asset available for download.

Do not fabricate route geometry or publish a synthetic archive merely to complete the UI.

## Credentials and security

Cloudflare account IDs, API tokens, R2 access keys and secret keys never enter Git, Expo public environment variables or client bundles. Upload credentials belong only in the deployment/admin environment that publishes assets.

The mobile application consumes only the resulting delivery URL and non-secret metadata. If private delivery is introduced later, use short-lived server-issued access rather than embedding permanent credentials in the app.

## Cache invalidation rule

Because object keys contain `geometryVersion`, published PMTiles files are immutable and should not need cache purges. A new geometry creates a new key and a new manifest. Clients detect the version change and surface `Actualización disponible` instead of mutating the archive they already validated.

## Operational validation before production

Before a real route is released, verify at minimum:

- the object exists at the canonical key;
- range requests return correct partial content;
- byte size/checksum match the Supabase manifest;
- the MapLibre style template references `__ROUTE_PMTILES__` and can be materialized with the remote and local PMTiles URI;
- required browser origins pass CORS checks;
- no Cloudflare credential is present in the repository or mobile bundle.

Cold-start fully-offline rendering should also be field-tested on a physical device. The current mobile package persists PMTiles plus sidecar metadata; persistence/caching of the style template must be validated before claiming guaranteed map rendering after an app restart with no network connectivity.
