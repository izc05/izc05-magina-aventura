# Plan 08B — Physical Reward Reservation + QR Redemption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el dominio puro del canje físico: reservar aceitunas y stock, emitir una credencial de canje opaca, validar escaneo/partner, confirmar entrega de forma idempotente y cancelar/caducar liberando recursos.

**Architecture:** Plan 08B se apoya en `OliveMovement`, `RewardCatalogItem` y `RewardEligibilityDecision` de 08A. El dominio nunca genera secretos criptográficos ni toca cámara/red/BD: recibe IDs/timestamps/token fingerprints ya creados por un adaptador servidor seguro y devuelve planes deterministas que el backend persistirá de forma atómica. El escaneo solo valida; una segunda acción explícita de entrega consume la reserva y la credencial.

**Tech Stack:** TypeScript 6, Vitest 3, pnpm 10 workspace.

**Spec:** `docs/superpowers/specs/2026-09-16-mi-olivo-rewards-economy-design.md`

## Global Constraints

- Trabajar únicamente en `feat/rewards-redemption-v1`; no modificar `main`.
- No tocar GPS, promo, `apps/admin`, Supabase ni UI móvil en este plan.
- El QR no contiene PII, saldo ni datos sensibles legibles.
- El token real se genera con entropía criptográfica en backend; el dominio solo maneja `credentialId` y `tokenFingerprint`.
- Escanear no consume el canje. Solo `confirmPhysicalRewardDelivery()` produce el gasto definitivo.
- El terminal del partner necesita conectividad en V1 para validar/consumir.
- Toda transición terminal es idempotente y auditable.
- Cancelación/caducidad liberan aceitunas reservadas; no borran historial.
- El stock se representa mediante candidatos de movimiento; la persistencia atómica se implementará después en el adaptador servidor.

---

### Task 1: Physical reward reservation plan

**Files:**
- Create: `packages/domain/src/rewards/physical-reward-reservation.test.ts`
- Create: `packages/domain/src/rewards/physical-reward-reservation.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**

```ts
export type PhysicalRewardKind = 'coupon' | 'experience' | 'physical';

export interface StockReservationCandidate {
  rewardId: string;
  reservationId: string;
  quantity: 1;
  sourceKey: string;
}

export interface PhysicalRewardReservationPlan {
  approved: boolean;
  status: 'approved' | 'rejected' | 'already-committed';
  reasons: string[];
  oliveMovement: OliveMovement | null;
  stockReservation: StockReservationCandidate | null;
}

export interface PhysicalRewardReservationInput {
  userId: string;
  reservationId: string;
  item: RewardCatalogItem;
  eligibility: RewardEligibilityDecision;
  alreadyCommittedReservationIds: string[];
  occurredAt: string;
}

export function buildPhysicalRewardReservationPlan(
  input: PhysicalRewardReservationInput,
): PhysicalRewardReservationPlan;
```

Rules:
- `digital` is rejected as `digital-reward-not-reservable`.
- Eligibility failure propagates catalogue reasons and produces no movements.
- Replay by `reservationId` returns `already-committed`.
- Success emits one `reserve` olive movement for `priceOlives` and one stock candidate with quantity 1.
- Stable keys: `reservation:<id>:olives` and `reservation:<id>:stock`.

- [ ] **Step 1:** Write failing tests for success, digital rejection, eligibility failure, replay, malformed identities/time/price and stable keys.
- [ ] **Step 2:** Run CI and verify RED on missing module.
- [ ] **Step 3:** Implement the minimal pure plan.
- [ ] **Step 4:** Export from `packages/domain/src/index.ts`.
- [ ] **Step 5:** Require typecheck + unit tests GREEN.

---

### Task 2: Redemption credential lifecycle and scan validation

**Files:**
- Create: `packages/domain/src/rewards/redemption-credential.test.ts`
- Create: `packages/domain/src/rewards/redemption-credential.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**

```ts
export type RedemptionCredentialStatus =
  | 'active'
  | 'consumed'
  | 'revoked'
  | 'expired';

export interface RedemptionCredential {
  credentialId: string;
  reservationId: string;
  rewardId: string;
  partnerId: string;
  tokenFingerprint: string;
  status: RedemptionCredentialStatus;
  issuedAt: string;
  expiresAt: string;
}

export interface RedemptionScanInput {
  credential: RedemptionCredential;
  scannedTokenFingerprint: string;
  partnerId: string;
  now: string;
  reservationStatus: 'reserved' | 'redeemed' | 'cancelled' | 'expired';
}

export interface RedemptionScanDecision {
  valid: boolean;
  reasons: string[];
  credentialId: string;
  reservationId: string;
  rewardId: string;
}

export function evaluateRedemptionScan(
  input: RedemptionScanInput,
): RedemptionScanDecision;
```

Canonical reasons:
`invalid-time`, `token-mismatch`, `wrong-partner`, `credential-consumed`, `credential-revoked`, `credential-expired`, `reservation-not-active`.

- [ ] **Step 1:** Write failing tests for valid scan, token mismatch, wrong partner, expired time, each terminal credential status and non-active reservation.
- [ ] **Step 2:** Run CI and verify RED.
- [ ] **Step 3:** Implement exact deterministic reason order; never expose token contents in output.
- [ ] **Step 4:** Export API.
- [ ] **Step 5:** Require GREEN.

---

### Task 3: Explicit delivery confirmation plan

**Files:**
- Create: `packages/domain/src/rewards/physical-reward-delivery.test.ts`
- Create: `packages/domain/src/rewards/physical-reward-delivery.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**

```ts
export interface RedemptionRecordCandidate {
  redemptionId: string;
  reservationId: string;
  credentialId: string;
  rewardId: string;
  partnerId: string;
  operatorId: string;
  redeemedAt: string;
  sourceKey: string;
}

export interface CredentialConsumptionCandidate {
  credentialId: string;
  status: 'consumed';
  consumedAt: string;
  sourceKey: string;
}

export interface StockFinalizationCandidate {
  reservationId: string;
  rewardId: string;
  quantity: 1;
  sourceKey: string;
}

export interface PhysicalRewardDeliveryPlan {
  approved: boolean;
  status: 'approved' | 'rejected' | 'already-committed';
  reasons: string[];
  oliveMovement: OliveMovement | null;
  credentialConsumption: CredentialConsumptionCandidate | null;
  stockFinalization: StockFinalizationCandidate | null;
  redemption: RedemptionRecordCandidate | null;
}

export interface PhysicalRewardDeliveryInput {
  redemptionId: string;
  operatorId: string;
  scanDecision: RedemptionScanDecision;
  credential: RedemptionCredential;
  reservedOlives: number;
  alreadyCommittedRedemptionIds: string[];
  redeemedAt: string;
}

export function confirmPhysicalRewardDelivery(
  input: PhysicalRewardDeliveryInput,
): PhysicalRewardDeliveryPlan;
```

Rules:
- Invalid scan produces no candidates.
- Replay by `redemptionId` is `already-committed`.
- `operatorId`, `redemptionId`, timestamps and positive reserved amount are mandatory.
- Success emits one reserved `spend` movement tied to reservation, one credential consumption, one stock finalization and one immutable redemption candidate.
- All source keys derive from `redemptionId` to support transaction retries.

- [ ] **Step 1:** Write failing tests for valid delivery, invalid scan, replay, malformed operator/time/amount and stable keys.
- [ ] **Step 2:** Verify RED.
- [ ] **Step 3:** Implement minimal plan.
- [ ] **Step 4:** Export API.
- [ ] **Step 5:** Require GREEN.

---

### Task 4: Cancellation and expiry release plan

**Files:**
- Create: `packages/domain/src/rewards/physical-reward-release.test.ts`
- Create: `packages/domain/src/rewards/physical-reward-release.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**

```ts
export type ReservationReleaseReason = 'cancelled' | 'expired';

export interface StockReleaseCandidate {
  reservationId: string;
  rewardId: string;
  quantity: 1;
  sourceKey: string;
}

export interface CredentialTerminalCandidate {
  credentialId: string;
  status: 'revoked' | 'expired';
  occurredAt: string;
  sourceKey: string;
}

export interface PhysicalRewardReleasePlan {
  approved: boolean;
  reasons: string[];
  oliveMovement: OliveMovement | null;
  stockRelease: StockReleaseCandidate | null;
  credentialUpdate: CredentialTerminalCandidate | null;
}

export function buildPhysicalRewardReleasePlan(input: {
  userId: string;
  reservationId: string;
  rewardId: string;
  credentialId: string;
  reservedOlives: number;
  reason: ReservationReleaseReason;
  reservationStatus: 'reserved' | 'redeemed' | 'cancelled' | 'expired';
  occurredAt: string;
}): PhysicalRewardReleasePlan;
```

Rules:
- only an active `reserved` reservation can release;
- success emits `release` olives tied to reservation, stock release, and credential status `revoked` for cancellation / `expired` for expiry;
- terminal reservations never generate a second release.

- [ ] **Step 1:** Write failing tests for cancellation, expiry, terminal reservation no-op, invalid amount/time and stable keys.
- [ ] **Step 2:** Verify RED.
- [ ] **Step 3:** Implement minimal plan.
- [ ] **Step 4:** Export API.
- [ ] **Step 5:** Require GREEN.

---

### Task 5: Full 08B verification

- [ ] **Step 1:** Run complete domain test suite and typecheck.
- [ ] **Step 2:** Run repository-wide CI including Android prebuild and Supabase contract tests.
- [ ] **Step 3:** Compare branch against `feat/07d-reward-delivery-plan`; confirm no GPS, promo, Admin or Supabase changes.
- [ ] **Step 4:** Verify security properties: QR scan alone cannot spend, consumed token cannot validate, wrong partner cannot validate, release cannot occur twice, all monetary actions are idempotent.
- [ ] **Step 5:** Keep PR draft until the later persistence/partner scanner/mobile UI integrations are reviewed.

## Self-review

- The plan deliberately does not generate raw QR secrets in pure domain code. A backend adapter must create cryptographically random tokens and persist only the representation required for safe comparison/rotation.
- No PII is encoded into the domain credential.
- Scan and delivery are separate by design.
- Reservation and delivery emit candidates only; atomic database persistence remains an infrastructure responsibility.
