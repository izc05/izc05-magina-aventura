# Plan 07A — Olive Grant Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir resultados de progresión ya verificados en candidatos deterministas e idempotentes de movimientos positivos de aceitunas, sin escribir en el ledger ni invadir el trabajo concurrente de Admin.

**Architecture:** Añadir un módulo puro en `@magina-aventura/domain` que consuma únicamente `crossedLevels` y `completedChallenges` del ciclo de progresión. El módulo proyectará candidatos compatibles con el ledger (`amount`, `reason`, `sourceType`, `sourceId`, `sourceKey`) y dejará la persistencia/autoridad final al servidor y a la rama Admin.

**Tech Stack:** TypeScript 6, Vitest, pnpm workspace.

**Spec:** Roadmap Plan 07 + contratos observados en Admin (`gamification_levels.reward_olives`, `gamification_challenges.reward_olives`, `olive_transactions`).

## Global Constraints

- No tocar `main`, Supabase, Admin, móvil, GPS ni Comunidad.
- No insertar movimientos en `olive_transactions`; solo proyectar candidatos.
- Reutilizar `VerifiedProgressionCycleProjection` y `LevelDefinition` existentes.
- El importe base de nivel procede de `rewardOlives` ya configurado.
- El importe base de reto llega como catálogo explícito `challengeId -> rewardOlives` para no duplicar el modelo Admin.
- El multiplicador y la política de redondeo son entradas obligatorias; no inventar valores de producto.
- Un `sourceKey` ya concedido nunca se vuelve a emitir.
- Importes no finitos, negativos o resultado final <= 0 no generan candidato.
- Orden de salida determinista por `sourceKey`.

---

### Task 1: Olive grant candidate projection

**Files:**
- Create: `packages/domain/src/rewards/olive-grants.test.ts`
- Create: `packages/domain/src/rewards/olive-grants.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**
- Consumes: `Pick<VerifiedProgressionCycleProjection, 'crossedLevels' | 'completedChallenges'>`.
- Produces: `projectProgressionOliveGrants(input): OliveGrantCandidate[]`.

- [ ] **Step 1: Write failing tests** covering level rewards, challenge rewards, configured multiplier/rounding, already-granted source keys, duplicate source suppression, invalid/non-positive amounts and deterministic ordering.
- [ ] **Step 2: Run CI and verify RED** because `./olive-grants` does not exist.
- [ ] **Step 3: Implement minimal pure projection** with no I/O or database imports.
- [ ] **Step 4: Export the public API** from `packages/domain/src/index.ts`.
- [ ] **Step 5: Run full CI**: TypeScript, unit tests, Android prebuild, pure package boundaries and Supabase contract tests must all pass.
- [ ] **Step 6: Inspect changed filenames** and confirm only this plan, the rewards module/tests and domain export changed.
