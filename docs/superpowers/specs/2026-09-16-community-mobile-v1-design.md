# Mágina Aventura — Community Mobile V1 Design

**Date:** 2026-09-16  
**Status:** Approved direction, implementation spec  
**Repository:** `izc05/izc05-magina-aventura`  
**Branch:** `feat/04-community-mobile`  
**Base:** `feat/03-community-foundation`

## Goal

Expose the real route community foundation in the Expo mobile app without inventing community content and without pretending authenticated write flows exist before the mobile session client is implemented.

## Scope

Community Mobile V1 includes:

- a route-specific Community screen reachable from route detail;
- public read-only route photos, route comments, route reviews and confirmed/resolved community incidents;
- honest loading, empty, unavailable and error states;
- route community summary counts;
- optional rendering of R2-backed photo URLs when a public media base URL is configured;
- clear distinction between community incidents and official safety information;
- explicit sign-in-required treatment for future write actions;
- no fabricated users, photos, reviews or incidents.

Not included:

- sign-in/session implementation;
- photo upload;
- creating comments/reviews/incidents from mobile;
- R2 upload signing;
- admin moderation UI;
- likes/follows/social graph;
- public profile redesign;
- GPS verified-activity badges.

## Data contract

Read public community data by `route_id` using the existing safe database surface:

- `community_photos_public`;
- `route_comments` (RLS returns approved/non-deleted rows for published routes);
- `route_reviews` (RLS returns approved/non-deleted rows for published routes);
- `route_incidents_public`.

The mobile repository returns one `RouteCommunitySnapshot` with arrays for photos, comments, reviews and incidents.

The client must not request raw `location` or `position` geometry.

## Backend access

Do not add `@supabase/supabase-js` only for public reads. V1 uses the existing public Supabase config and a small PostgREST adapter built on `fetch`.

If Supabase public configuration is absent, the repository returns an unavailable state instead of fake content.

Requests use the publishable key only. Service-role credentials are never accepted in Expo configuration.

## Media

Photo metadata stores an R2 `object_key`. Rendering a photo requires `EXPO_PUBLIC_COMMUNITY_MEDIA_BASE_URL`.

Rules:

- HTTPS only;
- trim trailing slashes;
- encode object-key path segments;
- if media base URL is absent, preserve the photo record but render a neutral non-image placeholder;
- no placeholder stock photography.

## UI

Add route: `/routes/[slug]/community`.

Screen hierarchy:

1. header/back action;
2. route title + `Comunidad`;
3. compact summary: photo count, review count, average rating when reviews exist, active community incident count;
4. segmented sections: `Fotos`, `Opiniones`, `Avisos`;
5. selected-section content;
6. read-only notice: `Publicar estará disponible al iniciar sesión` until mobile auth is wired.

### Fotos

- two-column grid;
- featured item may span full width when present;
- render actual R2 image only when resolvable;
- caption and date when available;
- no exact coordinates.

### Opiniones

- average rating only when at least one review exists;
- show real review body/rating/date;
- route comments appear below as `Conversación de la ruta`;
- authors are labelled neutrally as `Senderista` in V1 because public profile exposure has not been designed yet.

### Avisos

- only confirmed/resolved rows from `route_incidents_public`;
- visible badge `COMUNIDAD`;
- copy must state that these reports do not replace official notices;
- show category, description and timestamp;
- never style community reports as AEMET/Junta/authority alerts.

## Route detail integration

Add a `Comunidad` card above `Preparar aventura`.

The card does not invent counts. V1 links to the Community screen with static explanatory copy such as `Fotos, opiniones y avisos de senderistas`.

## Error and empty states

- `unavailable`: Supabase not configured;
- `loading`: request in progress;
- `ready + empty`: configured successfully but route has no community content;
- `error`: network/API request failed.

Empty states are considered valid product states and must invite future participation without showing fake content.

## Security

- public client only reads safe fields;
- raw geometry is never requested;
- no service-role secret in mobile code;
- no write endpoint is exposed from this screen;
- RLS remains authoritative;
- database tests must prove anonymous readers can see approved public content but not pending/private content.

## Testing

TDD requirements:

1. media config parsing and URL resolution;
2. PostgREST query construction requests only safe fields;
3. repository combines all four public resources correctly;
4. repository returns unavailable when Supabase is not configured;
5. summary derives counts and average rating without invented defaults;
6. pgTAP verifies anonymous public read behavior;
7. all existing TypeScript, unit, Android prebuild, package-boundary and database gates remain green.

## Definition of Done

- `/routes/[slug]/community` exists and is linked from route detail;
- no fabricated community content appears;
- public route community data is loadable through the safe adapter when configured;
- missing backend/media config degrades honestly;
- exact photo/incident coordinates remain unavailable to the mobile public read path;
- full CI `verify` passes on branch HEAD;
- `main` is untouched.
