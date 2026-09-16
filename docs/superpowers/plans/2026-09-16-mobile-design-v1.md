# Mágina Aventura Mobile Design V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Mágina Aventura mobile visual system in the real Expo app while preserving the existing GPS, map, offline and route-domain behavior.

**Architecture:** Keep the current Expo Router feature structure and change the app shell rather than rewriting functional modules. Centralize the final navigation/brand contract in `src/theme`, route tab selection through one reusable navigation component, then align the existing screen components incrementally.

**Tech Stack:** Expo 57, React Native 0.86, Expo Router, TypeScript 6, Vitest, MapLibre React Native.

**Spec:** `docs/superpowers/specs/2026-09-16-mobile-design-v1.md`

## Global Constraints

- Branch: `feat/mobile-design-v1`, based on `feat/integration-gps-visual-v1`.
- Do not modify `main`.
- Preserve existing GPS background tracking and activity lifecycle.
- Preserve MapLibre/offline route support.
- Do not introduce fabricated live data.
- No new UI dependency for this slice.
- Required checks: typecheck, unit tests, Expo Android prebuild and Android debug build.

---

### Task 1: Final brand and app-shell contract

**Files:**
- Modify: `apps/mobile/src/theme/branding.test.ts`
- Modify: `apps/mobile/src/theme/branding.ts`
- Modify: `apps/mobile/src/components/navigation/BottomNav.tsx`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: `BottomNavigationItem = 'Inicio' | 'Explorar' | 'Mapa' | 'Comunidad' | 'Perfil'`.
- Produces: `brand.supportingClaim = 'Más que rutas, vivencias que dejan huella.'`.

- [ ] Update CI branch filter to run on `feat/mobile-design-v1`.
- [ ] Change the branding test first so it expects the approved supporting claim and five final navigation items.
- [ ] Confirm the test fails because the current branding contract still exposes the old tab labels/copy.
- [ ] Update `branding.ts` minimally to satisfy the new contract.
- [ ] Update `BottomNav.tsx` glyph mapping for Inicio, Explorar, Mapa, Comunidad and Perfil without adding dependencies.
- [ ] Re-run unit tests and typecheck.

### Task 2: Real shell navigation

**Files:**
- Create: `apps/mobile/src/navigation/app-shell.ts`
- Create: `apps/mobile/src/navigation/app-shell.test.ts`
- Modify: `apps/mobile/app/index.tsx`

**Interfaces:**
- Produces: `routeForBottomNavigation(item: BottomNavigationItem): string`.
- Mapping: Inicio `/`, Explorar `/`, Mapa `/map`, Comunidad `/community`, Perfil `/profile` for routes that exist; where a route is not yet present, use an explicit disabled destination contract rather than a fake screen.

- [ ] Write a failing test for navigation mapping and disabled destinations.
- [ ] Implement the minimal typed mapping.
- [ ] Wire `BottomNav` selection in `app/index.tsx` through Expo Router.
- [ ] Preserve onboarding gate and route-card behavior.
- [ ] Re-run tests and typecheck.

### Task 3: Approved Inicio composition

**Files:**
- Create: `apps/mobile/src/features/home/home-presenter.ts`
- Create: `apps/mobile/src/features/home/home-presenter.test.ts`
- Modify: `apps/mobile/app/index.tsx`
- Reuse: `apps/mobile/src/components/branding/AppHeader.tsx`
- Reuse: `apps/mobile/src/components/routes/FeaturedRouteCard.tsx`

**Interfaces:**
- Produces: `presentHome(routes)` with greeting title, search placeholder, quick actions and featured-route selection derived from existing route data.

- [ ] Write a failing presenter test that proves Inicio uses real route data and approved copy.
- [ ] Implement presenter.
- [ ] Replace the prototype hero copy with the approved Inicio hierarchy: `¿Qué aventura hacemos hoy?`, search, quick actions and featured routes.
- [ ] Keep cards driven by existing route fixtures/domain data.
- [ ] Re-run unit tests and typecheck.

### Task 4: Official brand surface

**Files:**
- Modify: `apps/mobile/src/components/branding/AppLogo.tsx`
- Modify: `apps/mobile/src/components/branding/BrandMark.tsx` only if needed to match the canonical mountain/path/sun mark.
- Verify: `apps/mobile/assets/branding/magina-aventura-logo.svg`
- Verify: `apps/mobile/assets/branding/magina-aventura-icon.svg`
- Verify: `apps/mobile/scripts/generate-brand-assets.mjs`
- Verify: `apps/mobile/app.json`

**Interfaces:**
- App header, onboarding and generated app icon assets must all reference the same canonical identity version `2026-09-16-approved-logo`.

- [ ] Extend the existing branding contract test before changing component behavior if a new exported brand property is needed.
- [ ] Use the canonical identity assets/geometry and remove any duplicate/legacy visual mark from the app header.
- [ ] Run `pnpm brand:assets` in CI and verify app icon/adaptive icon/splash generation still succeeds.
- [ ] Re-run tests, typecheck and Android prebuild.

### Task 5: Full verification checkpoint

**Files:**
- No production source changes unless verification finds a regression.

- [ ] Run complete CI on `feat/mobile-design-v1`.
- [ ] Confirm TypeScript passes.
- [ ] Confirm Vitest passes.
- [ ] Confirm brand raster generation passes.
- [ ] Confirm Android prebuild preserves background-location permissions.
- [ ] Confirm Supabase pgTAP passes.
- [ ] Confirm debug APK assembles and is uploaded.
- [ ] Compare branch against `feat/integration-gps-visual-v1` and verify only design/docs/CI changes are present.
