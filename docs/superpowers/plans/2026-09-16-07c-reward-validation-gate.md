# Plan 07C — Reward Validation Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir una puerta de validación servidor, pura y configurable, que decida si el resultado de una actividad puede avanzar hacia ledger/outbox sin inventar umbrales antifraude.

**Architecture:** El dominio recibirá evidencias booleanas ya calculadas por adaptadores de servidor/GPS y una política explícita de checks obligatorios. La función devuelve `approved`, `rejected` o `already-committed`, con motivos deterministas y una clave estable; no calcula señales GPS ni persiste nada.

**Tech Stack:** TypeScript 6, Vitest, pnpm workspace.

**Spec:** Roadmap Plan 07 — actividad verificada + antifraude + autoridad servidor antes de conceder aceitunas.

## Global Constraints

- No tocar `main`, Admin, Supabase, móvil, GPS ni Comunidad.
- No inventar umbrales de velocidad, precisión, distancia o frecuencia; esas señales llegan ya resueltas como evidencia.
- Checks disponibles: `activity-verification`, `route-integrity`, `location-integrity`, `account-eligibility`, `abuse-screen`.
- La política decide explícitamente cuáles son obligatorios.
- Un check requerido que no sea `true` rechaza la operación.
- Una actividad ya comprometida produce `already-committed`, no un error antifraude.
- IDs vacíos o timestamp inválido rechazan de forma determinista.
- Motivos y checks se deduplican y ordenan según orden canónico.

---

### Task 1: Pure reward validation gate

**Files:**
- Create: `packages/domain/src/rewards/reward-validation.test.ts`
- Create: `packages/domain/src/rewards/reward-validation.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**
- Produces: `evaluateRewardValidation(input): RewardValidationDecision`.
- Output status: `approved | rejected | already-committed`.

- [ ] **Step 1: Write failing tests** for successful required checks, missing/false evidence, optional checks, duplicate policy checks, replay/already committed, invalid identity/time and deterministic failure ordering.
- [ ] **Step 2: Run CI and verify RED** because `./reward-validation` does not exist.
- [ ] **Step 3: Implement minimal pure decision function**.
- [ ] **Step 4: Export public API** from `packages/domain/src/index.ts`.
- [ ] **Step 5: Run full CI** and require all existing gates green.
- [ ] **Step 6: Inspect changed filenames** for isolation.
