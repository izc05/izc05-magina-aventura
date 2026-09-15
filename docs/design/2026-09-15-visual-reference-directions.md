# Mágina Aventura — Visual Reference Direction

**Date:** 2026-09-15
**Source:** user-provided concept board in chat
**Status:** visual reference, not final UI

## What we keep from the reference

- Premium Sierra Mágina photography dominates discovery screens.
- Desktop home uses a strong territorial hero rather than a game map.
- Route catalogue is card-based, dense enough for comparison, but visually calm.
- Route detail combines hero photography, route metrics, map/profile/POI tabs and a clear `Iniciar aventura` CTA.
- Mobile home keeps photography, search and fast category filters above featured routes.
- Active adventure becomes map-first and full-screen, with a compact sport HUD and a prominent pause control.
- Discoveries appear as focused modal/bottom-card moments over the map rather than taking the user away from the activity.
- End-of-route summary combines track statistics, XP/achievement reward and discoveries collected.
- Profile behaves like a Sierra Mágina passport: level, XP, route/discovery stats, badges and collection families.

## What we do not copy literally

- No reuse of logos, proprietary artwork, exact layouts or third-party branded interaction patterns.
- No decorative POI markers without real route/checkpoint/discovery data.
- No fake ratings, user counts, route counts or verified map geometry.
- No gamification that hides safety information or route status.

## Product screen hierarchy

### Discovery mode

`Inicio / Rutas -> Route card -> Route detail -> Prepare adventure`

Visual language: photography, warm backgrounds, olive/limestone palette, editorial typography, restrained game styling.

### Active mode

`Adventure map -> Nearby objective -> Discovery -> Resume map -> Finish`

Visual language: map-first, high outdoor contrast, minimal chrome, large touch targets, sport metrics always legible.

### Progression mode

`Result -> Profile -> Collections -> Ranking / Challenges`

Visual language: XP, achievements and collections become more visible, while retaining the territorial identity.

## Component implications for Figma + code

- `HeroTerritory`
- `RouteCard`
- `RouteMetrics`
- `DifficultyChip`
- `RouteDetailTabs`
- `ElevationProfile`
- `OfflinePackageStatus`
- `AdventureHUD`
- `MapObjectiveCard`
- `DiscoveryCard`
- `ActivitySummary`
- `XPRewardCard`
- `CollectionCard`
- `ProfilePassportHeader`

These component names are conceptual design-system names. Mobile implementation may use platform-specific components where appropriate.

## Figma rule

Figma remains the visual source of truth once edit access is available. Until then, code uses the established design tokens and this document as the approved visual direction. The first three screens to reconcile with Figma are:

1. `Rutas / Inicio`
2. `Detalle de ruta`
3. `Aventura en curso`
