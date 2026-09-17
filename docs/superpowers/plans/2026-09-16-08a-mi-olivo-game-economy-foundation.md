# Plan 08A — Mi Olivo Game Economy Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el núcleo puro y testeable de Mi Olivo: proyectar el estado visual del árbol desde XP/nivel, calcular la cartera auditable de aceitunas, evaluar el catálogo y producir planes idempotentes de compra digital sin tocar todavía persistencia, QR ni UI.

**Architecture:** Reutilizar `projectLevelProgress()` y los grants de Plan 07 como fuentes ya existentes. Añadir tres módulos puros dentro de `@magina-aventura/domain`: proyección de Mi Olivo, cartera/ledger de aceitunas y catálogo/compras. Los módulos no conocen Supabase, React Native, Admin ni red; devuelven decisiones/planes deterministas para que una capa servidor los persista más adelante.

**Tech Stack:** TypeScript 6, Vitest 3, pnpm 10 workspace.

**Spec:** `docs/superpowers/specs/2026-09-16-mi-olivo-rewards-economy-design.md`

## Global Constraints

- Trabajar únicamente en `feat/rewards-redemption-v1`; no modificar `main`.
- No tocar GPS, promo, `apps/admin`, Supabase ni la UI móvil en este plan.
- XP es progreso permanente y no se gasta.
- Aceitunas son la única moneda gastable.
- El nivel del olivo deriva del XP existente; no crear una segunda XP.
- Precios, umbrales y requisitos son datos/configuración, no constantes de producto incrustadas en componentes.
- Todos los movimientos económicos usan claves idempotentes.
- Objetos cosméticos no conceden ventajas deportivas.
- AOVE es premio/coleccionable/producto, nunca moneda.

---

### Task 1: Olive-tree stage projection

**Files:**
- Create: `packages/domain/src/olive-tree/olive-tree-progression.test.ts`
- Create: `packages/domain/src/olive-tree/olive-tree-progression.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**

```ts
export type OliveTreeStageId =
  | 'sprout'
  | 'sapling'
  | 'young'
  | 'developing'
  | 'strong'
  | 'adult'
  | 'mature'
  | 'centenary'
  | 'monumental'
  | 'legend';

export interface OliveTreeStageDefinition {
  id: OliveTreeStageId;
  name: string;
  minLevel: number;
  active: boolean;
}

export interface OliveTreeProjection {
  totalXp: number;
  level: number | null;
  levelName: string | null;
  levelProgressPercentage: number;
  stage: OliveTreeStageDefinition | null;
  nextStage: OliveTreeStageDefinition | null;
  levelsToNextStage: number | null;
}

export function projectOliveTree(
  totalXp: number,
  levels: LevelDefinition[],
  stages: OliveTreeStageDefinition[],
): OliveTreeProjection;
```

- [ ] **Step 1: Write failing tests** for stage selection, inactive stages, unordered input, pre-level state, top-level legend state and invalid XP.

Example test:

```ts
it('projects an adult olive tree from the existing XP level', () => {
  const result = projectOliveTree(5_000, levels, stages);
  expect(result.level).toBe(26);
  expect(result.stage?.id).toBe('adult');
  expect(result.nextStage?.id).toBe('mature');
});
```

- [ ] **Step 2: Run** `pnpm --filter @magina-aventura/domain test -- olive-tree-progression.test.ts` and verify RED because the module does not exist.
- [ ] **Step 3: Implement minimal projection** by calling `projectLevelProgress(totalXp, levels)`; sort active stages by `minLevel`, select the highest `minLevel <= current level`, never mutate inputs, and return no stage before a level exists.
- [ ] **Step 4: Export** the public API from `packages/domain/src/index.ts`.
- [ ] **Step 5: Run** domain test + typecheck and require GREEN.

---

### Task 2: Auditable olive wallet projection

**Files:**
- Create: `packages/domain/src/economy/olive-wallet.test.ts`
- Create: `packages/domain/src/economy/olive-wallet.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**

```ts
export type OliveMovementType =
  | 'grant'
  | 'reserve'
  | 'release'
  | 'spend'
  | 'refund'
  | 'admin-adjustment';

export interface OliveMovement {
  userId: string;
  type: OliveMovementType;
  amount: number;
  sourceKey: string;
  reservationId: string | null;
  occurredAt: string;
}

export interface OliveWalletProjection {
  available: number;
  reserved: number;
  lifetimeGranted: number;
  lifetimeSpent: number;
  acceptedSourceKeys: string[];
  rejectedSourceKeys: string[];
}

export function projectOliveWallet(
  userId: string,
  movements: OliveMovement[],
): OliveWalletProjection;
```

Rules:

- `amount` is always a positive integer; movement type determines direction.
- `grant` adds available and lifetime granted.
- `reserve` moves available -> reserved and is rejected if funds are insufficient.
- `release` moves reserved -> available and requires a matching reservation.
- `spend` with reservation consumes reserved; without reservation consumes available.
- `refund` adds available but does not inflate `lifetimeGranted`.
- duplicate `sourceKey` is ignored after the first accepted movement.
- movements for another user, invalid timestamps, zero/non-finite amounts or operations that would make available/reserved negative are rejected deterministically.

- [ ] **Step 1: Write failing tests** for grants, direct spend, reserve/release, reserve/spend, insufficient funds, duplicate source keys, invalid movements and deterministic ordering.
- [ ] **Step 2: Run** `pnpm --filter @magina-aventura/domain test -- olive-wallet.test.ts` and verify RED.
- [ ] **Step 3: Implement** a pure fold over movements sorted by `occurredAt` then `sourceKey`; keep a per-reservation reserved balance map internally to prevent releasing/spending more than was reserved.
- [ ] **Step 4: Export** from `packages/domain/src/index.ts`.
- [ ] **Step 5: Run** domain test + typecheck and require GREEN.

---

### Task 3: Reward catalogue eligibility

**Files:**
- Create: `packages/domain/src/rewards/reward-catalog.test.ts`
- Create: `packages/domain/src/rewards/reward-catalog.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**

```ts
export type RewardKind = 'digital' | 'coupon' | 'experience' | 'physical';
export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface RewardCatalogItem {
  id: string;
  name: string;
  kind: RewardKind;
  rarity: RewardRarity;
  priceOlives: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  minLevel: number | null;
  minStage: OliveTreeStageId | null;
  requiredBadgeSlugs: string[];
  requiredChallengeIds: string[];
  stockAvailable: number | null;
  perUserLimit: number | null;
  repeatable: boolean;
}

export interface RewardEligibilityInput {
  item: RewardCatalogItem;
  now: string;
  walletAvailable: number;
  level: number;
  stage: OliveTreeStageId | null;
  badgeSlugs: string[];
  completedChallengeIds: string[];
  previousRedemptions: number;
}

export interface RewardEligibilityDecision {
  eligible: boolean;
  reasons: string[];
}

export function evaluateRewardEligibility(
  input: RewardEligibilityInput,
): RewardEligibilityDecision;
```

- [ ] **Step 1: Write failing tests** covering inactive/out-of-window items, insufficient olives, level/stage gates, badge/challenge gates, zero stock, per-user limit and a valid purchase.
- [ ] **Step 2: Run** `pnpm --filter @magina-aventura/domain test -- reward-catalog.test.ts` and verify RED.
- [ ] **Step 3: Implement** deterministic validation with canonical reason order: `inactive`, `not-started`, `expired`, `insufficient-olives`, `level-required`, `stage-required`, `badge-required`, `challenge-required`, `out-of-stock`, `user-limit-reached`.
- [ ] **Step 4: Export** the API from `packages/domain/src/index.ts`.
- [ ] **Step 5: Run** domain test + typecheck and require GREEN.

---

### Task 4: Idempotent digital purchase plan

**Files:**
- Create: `packages/domain/src/rewards/digital-reward-purchase.test.ts`
- Create: `packages/domain/src/rewards/digital-reward-purchase.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**

```ts
export interface DigitalRewardPurchaseInput {
  userId: string;
  purchaseId: string;
  item: RewardCatalogItem;
  eligibility: RewardEligibilityDecision;
  alreadyOwnedRewardIds: string[];
  alreadyCommittedPurchaseIds: string[];
  occurredAt: string;
}

export interface DigitalRewardEntitlementCandidate {
  userId: string;
  rewardId: string;
  sourceKey: string;
  grantedAt: string;
}

export interface DigitalRewardPurchasePlan {
  approved: boolean;
  status: 'approved' | 'rejected' | 'already-committed';
  reasons: string[];
  walletMovement: OliveMovement | null;
  entitlement: DigitalRewardEntitlementCandidate | null;
}

export function buildDigitalRewardPurchasePlan(
  input: DigitalRewardPurchaseInput,
): DigitalRewardPurchasePlan;
```

Rules:

- only `kind='digital'` is accepted;
- an ineligible catalogue decision produces no economic movement;
- a non-repeatable already-owned reward is rejected;
- a committed `purchaseId` is an idempotent no-op (`already-committed`);
- successful purchase emits exactly one direct `spend` movement and one entitlement using stable source keys derived from `purchaseId`;
- no persistence or mutation happens in this module.

- [ ] **Step 1: Write failing tests** for valid purchase, wrong reward kind, failed eligibility, already owned item, replay and stable source keys.
- [ ] **Step 2: Run** `pnpm --filter @magina-aventura/domain test -- digital-reward-purchase.test.ts` and verify RED.
- [ ] **Step 3: Implement** the minimal pure plan.
- [ ] **Step 4: Export** the API from `packages/domain/src/index.ts`.
- [ ] **Step 5: Run** all domain tests and typecheck.

---

### Task 5: Foundation integration verification

**Files:**
- Modify only if required: `packages/domain/src/index.ts`
- Review: all branch changes from base `feat/07d-reward-delivery-plan`

- [ ] **Step 1: Run** `pnpm --filter @magina-aventura/domain test`.
- [ ] **Step 2: Run** `pnpm --filter @magina-aventura/domain typecheck`.
- [ ] **Step 3: Run** repository-wide `pnpm test` and `pnpm typecheck`.
- [ ] **Step 4: Compare** `feat/07d-reward-delivery-plan...feat/rewards-redemption-v1` and confirm no files under GPS, promo, Admin or Supabase changed.
- [ ] **Step 5: Record follow-up boundary:** physical reservation, QR credential generation/validation, partner authorization and atomic redemption belong to Plan 08B; mobile Mi Olivo 2.5D scene and store UX belong to a later visual/mobile plan.

## Self-review

- Spec coverage in 08A: XP -> tree projection, single olive currency, auditable wallet semantics, rarity/catalogue gates, digital purchases and idempotency.
- Deferred deliberately to 08B: physical reservation lifecycle, token security, QR scanner validation, partner permissions, stock finalization and audit persistence.
- Deferred deliberately to visual/mobile plan: 2.5D rendering, animations, history screen, store screens and reward presentation.
- No product economy numbers are hard-coded by this plan; all prices, XP thresholds, stock and requirements remain data-driven.
