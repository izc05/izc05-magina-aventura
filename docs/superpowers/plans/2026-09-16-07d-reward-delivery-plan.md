# Plan 07D — Reward Delivery Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Componer validación servidor, candidatos de ledger de aceitunas y eventos de outbox en un único plan puro de entrega, listo para que una capa transaccional de backend lo persista de forma atómica.

**Architecture:** El módulo orquesta exclusivamente funciones de dominio existentes: `evaluateRewardValidation`, `projectProgressionOliveGrants` y `buildOliveGrantOutboxEvents`. Si la validación no está aprobada, no emite movimientos ni eventos. Si está aprobada, devuelve exactamente el conjunto de entradas de ledger y outbox que un adaptador servidor debe escribir en la misma transacción.

**Tech Stack:** TypeScript 6, Vitest, pnpm workspace.

**Spec:** Roadmap Plan 07 — actividad verificada → antifraude → ledger de aceitunas → contrato independiente de integración.

## Global Constraints

- No tocar `main`, Admin, Supabase, móvil, GPS ni Comunidad.
- No duplicar reglas: reutilizar los módulos 07A, 07B y 07C.
- No escribir ni publicar nada; solo producir un plan de entrega.
- El usuario del grant se deriva de la validación para impedir inconsistencias entre inputs.
- `approved=false` o `already-committed` produce cero entradas de ledger y cero eventos.
- Grants ya concedidos y eventos ya publicados siguen filtrándose mediante sus listas idempotentes existentes.
- `shouldPersist` solo es `true` cuando la validación está aprobada y existe al menos una entrada de ledger pendiente.

---

### Task 1: Compose the reward delivery plan

**Files:**
- Create: `packages/domain/src/rewards/reward-delivery.test.ts`
- Create: `packages/domain/src/rewards/reward-delivery.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**
- Produces: `buildRewardDeliveryPlan(input): RewardDeliveryPlan`.
- Output: validation decision + `ledgerEntries` + `outboxEvents` + `shouldPersist`.

- [ ] **Step 1: Write failing end-to-end domain tests** for approved delivery, rejected validation, replay, ledger idempotency and already-published outbox events.
- [ ] **Step 2: Run CI and verify RED** because `./reward-delivery` does not exist.
- [ ] **Step 3: Implement minimal orchestration** reusing 07A/07B/07C.
- [ ] **Step 4: Export public API** from `packages/domain/src/index.ts`.
- [ ] **Step 5: Run full CI** and require all gates green.
- [ ] **Step 6: Inspect changed filenames** for isolation and then close Plan 07 domain foundation.
