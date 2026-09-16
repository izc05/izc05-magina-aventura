# Mágina Aventura Visual Identity & Onboarding V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Mágina Aventura visual identity, branded first-launch experience, four-step onboarding, and reusable Home UI without regressing existing route/map/offline flows.

**Architecture:** Keep Expo Router as navigation source of truth. Put first-launch decision logic in a pure onboarding state module, persist completion through a tiny storage adapter, and split the current Home into focused brand/navigation/route-card components. Keep raster app-icon export separate from UI source of truth so no alternate logo is introduced.

**Tech Stack:** Expo 57, React Native 0.86, Expo Router 57, TypeScript 6, Vitest, existing workspace packages.

**Spec:** `docs/superpowers/specs/2026-09-16-visual-identity-onboarding-v1-design.md`

## Global Constraints
- Do not work on `main` directly.
- Preserve existing route detail, prepare, MapLibre, GPX and offline behavior.
- Palette contract: olive `#2F4A2E`, gold `#D4AF37`, limestone `#E7E1D6`, warm white `#FAF9F6`, sky `#7FB3D9`.
- Onboarding key: `magina_onboarding_seen_v1`.
- Fresh install: splash/loading → onboarding → Home.
- Returning install: splash/loading → Home.
- Do not use emoji placeholders as final bottom-nav iconography.

---

### Task 1: Lock brand and onboarding contracts with tests

**Files:**
- Create: `apps/mobile/src/features/onboarding/onboarding-contract.test.ts`
- Create: `apps/mobile/src/features/onboarding/onboarding-contract.ts`
- Create: `apps/mobile/src/theme/branding.test.ts`
- Create: `apps/mobile/src/theme/branding.ts`

**Interfaces:**
- Produces `ONBOARDING_STORAGE_KEY`, `onboardingSlides`, `resolveFirstLaunchDestination(seen: boolean)`.
- Produces `brand` with palette, copy and navigation labels.

- [ ] **Step 1: Write failing onboarding contract test**

```ts
import { describe, expect, it } from 'vitest';
import { ONBOARDING_STORAGE_KEY, onboardingSlides, resolveFirstLaunchDestination } from './onboarding-contract';

describe('onboarding contract', () => {
  it('keeps the approved four-step first-launch sequence', () => {
    expect(ONBOARDING_STORAGE_KEY).toBe('magina_onboarding_seen_v1');
    expect(onboardingSlides.map((slide) => slide.title)).toEqual([
      'Bienvenido a Mágina Aventura',
      'Descubre rutas',
      'Camina y desbloquea',
      'Gana XP y aceitunas',
    ]);
  });

  it('routes new users to onboarding and returning users home', () => {
    expect(resolveFirstLaunchDestination(false)).toBe('/onboarding');
    expect(resolveFirstLaunchDestination(true)).toBe('/');
  });
});
```

- [ ] **Step 2: Run RED**

Run: `pnpm --filter @magina-aventura/mobile test -- onboarding-contract.test.ts`
Expected: FAIL because `onboarding-contract.ts` does not exist.

- [ ] **Step 3: Implement minimal onboarding contract**

Define the exact four approved slides, versioned storage key and pure destination helper.

- [ ] **Step 4: Write and run failing branding test**

```ts
import { describe, expect, it } from 'vitest';
import { brand } from './branding';

it('uses the approved Mágina Aventura palette and navigation', () => {
  expect(brand.colors.olive).toBe('#2F4A2E');
  expect(brand.colors.gold).toBe('#D4AF37');
  expect(brand.bottomNavigation).toEqual(['Rutas', 'Retos', 'Colecciones', 'Ranking', 'Perfil']);
});
```

Expected: FAIL until `branding.ts` exists.

- [ ] **Step 5: Implement brand constants and make tests green**

Run: `pnpm --filter @magina-aventura/mobile test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/features/onboarding apps/mobile/src/theme
git commit -m "test: lock approved visual onboarding contracts"
```

### Task 2: Add persistence adapter and first-launch controller

**Files:**
- Modify: `apps/mobile/package.json`
- Create: `apps/mobile/src/features/onboarding/onboarding-storage.ts`
- Create: `apps/mobile/src/features/onboarding/onboarding-storage.test.ts`
- Create: `apps/mobile/src/features/onboarding/use-first-launch.ts`

**Interfaces:**
- `OnboardingStorage` exposes `hasSeen(): Promise<boolean>` and `markSeen(): Promise<void>`.
- `useFirstLaunch()` exposes `{ loading, destination }`.

- [ ] **Step 1: Add failing storage behavior test using an injected key-value port**
- [ ] **Step 2: Run RED and confirm missing implementation**
- [ ] **Step 3: Implement adapter with `@react-native-async-storage/async-storage` behind the port**
- [ ] **Step 4: Run unit tests and typecheck**
- [ ] **Step 5: Commit**

### Task 3: Build reusable brand mark/header and navigation primitives

**Files:**
- Create: `apps/mobile/src/components/branding/BrandMark.tsx`
- Create: `apps/mobile/src/components/branding/AppLogo.tsx`
- Create: `apps/mobile/src/components/branding/AppHeader.tsx`
- Create: `apps/mobile/src/components/navigation/BottomNav.tsx`
- Modify: `apps/mobile/src/theme/tokens.ts`

**Interfaces:**
- `BrandMark({ size?: number, inverse?: boolean })`
- `AppLogo({ compact?: boolean, inverse?: boolean })`
- `AppHeader()`
- `BottomNav({ active: 'Rutas' | 'Retos' | 'Colecciones' | 'Ranking' | 'Perfil' })`

- [ ] **Step 1: Write failing contract tests for token values and nav labels**
- [ ] **Step 2: Run RED**
- [ ] **Step 3: Implement minimal reusable components with React Native primitives**
- [ ] **Step 4: Typecheck and run unit tests**
- [ ] **Step 5: Commit**

### Task 4: Implement splash/loading and onboarding screen

**Files:**
- Create: `apps/mobile/app/launch.tsx`
- Create: `apps/mobile/app/onboarding.tsx`
- Create: `apps/mobile/src/features/onboarding/OnboardingSlide.tsx`
- Modify: `apps/mobile/app/_layout.tsx`

**Interfaces:**
- Launch screen resolves first-launch state and replaces route with `/onboarding` or `/`.
- Onboarding persists seen state on Skip or final CTA and replaces route with `/`.

- [ ] **Step 1: Add pure tests for next-slide/final-slide actions**
- [ ] **Step 2: Run RED**
- [ ] **Step 3: Implement launch and four-slide onboarding UI**
- [ ] **Step 4: Confirm SafeArea behavior and typecheck**
- [ ] **Step 5: Commit**

### Task 5: Refactor Home into approved visual structure

**Files:**
- Create: `apps/mobile/src/components/routes/FeaturedRouteCard.tsx`
- Modify: `apps/mobile/app/index.tsx`

**Interfaces:**
- `FeaturedRouteCard({ route, onPress })` receives existing route fixture shape and does not own navigation logic.

- [ ] **Step 1: Add a unit test for the formatting helpers used by the card**
- [ ] **Step 2: Run RED**
- [ ] **Step 3: Extract route card and replace inline header/nav with reusable components**
- [ ] **Step 4: Apply approved hero/value/search/filter hierarchy without changing route behavior**
- [ ] **Step 5: Run mobile tests and typecheck**
- [ ] **Step 6: Commit**

### Task 6: Configure launch appearance without introducing a fake raster logo

**Files:**
- Modify: `apps/mobile/app.json`
- Create: `apps/mobile/assets/branding/README.md`

**Interfaces:**
- Expo background color matches approved olive.
- README defines required raster exports: `icon.png`, `adaptive-icon.png`, `splash-logo.png`, all generated from approved master mark.

- [ ] **Step 1: Add configuration assertions where practical**
- [ ] **Step 2: Set splash/background metadata supported without binary placeholders**
- [ ] **Step 3: Document exact raster export contract**
- [ ] **Step 4: Run Expo Android prebuild in CI**
- [ ] **Step 5: Commit**

### Task 7: Integration verification

**Files:**
- No new production files unless verification exposes an issue.

- [ ] **Step 1: Run `pnpm typecheck`**
- [ ] **Step 2: Run `pnpm test`**
- [ ] **Step 3: Run `cd apps/mobile && pnpm exec expo prebuild --platform android --no-install --clean`**
- [ ] **Step 4: Confirm existing database/package-boundary CI remains green**
- [ ] **Step 5: Compare branch against `main` and confirm only intended visual/onboarding files changed**
- [ ] **Step 6: Keep PR draft until CI is green and Android physical-device smoke test can be performed**
