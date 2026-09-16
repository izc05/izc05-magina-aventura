# Plan 07B — Olive Outbox Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir candidatos de aceitunas ya validados en eventos de integración idempotentes y versionados, preparados para un outbox servidor y un consumidor externo como Mi Olivo.

**Architecture:** Añadir un módulo puro en `@magina-aventura/domain` que no persista ni publique nada. Recibe `OliveGrantCandidate[]`, crea un evento canónico por `sourceKey`, filtra duplicados/ya publicados y deja al backend la transacción que escribirá ledger + outbox de forma atómica.

**Tech Stack:** TypeScript 6, Vitest, pnpm workspace.

**Spec:** Roadmap Plan 07 — contrato independiente para alimentar Mi Olivo sin convertirlo en dependencia del núcleo de Mágina Aventura.

## Global Constraints

- No tocar `main`, Admin, Supabase, móvil, GPS ni Comunidad.
- No publicar red, webhook ni mensaje real; solo construir el contrato.
- Evento versionado: `magina-aventura.olive-grant.v1`.
- Idempotencia estable derivada del `sourceKey` del grant.
- Un grant inválido, no positivo o duplicado no genera evento.
- Un evento ya publicado no se vuelve a emitir.
- `occurredAt` debe ser ISO válido; entrada inválida produce cero eventos.
- Orden determinista por `eventKey`.

---

### Task 1: Outbox event projection

**Files:**
- Create: `packages/domain/src/integration/olive-outbox.test.ts`
- Create: `packages/domain/src/integration/olive-outbox.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**
- Consumes: `OliveGrantCandidate[]`, `occurredAt`, `alreadyPublishedEventKeys`.
- Produces: `buildOliveGrantOutboxEvents(input): OliveGrantOutboxEvent[]`.

- [ ] **Step 1: Write failing tests** for canonical event shape, stable event keys, duplicate suppression, published-key suppression, invalid amounts/timestamp and deterministic ordering.
- [ ] **Step 2: Run CI and verify RED** because `./olive-outbox` does not exist.
- [ ] **Step 3: Implement minimal pure projection** without I/O.
- [ ] **Step 4: Export public API** from `packages/domain/src/index.ts`.
- [ ] **Step 5: Run full CI** and require TypeScript, unit tests, Android prebuild, pure package boundaries and Supabase contract tests all green.
- [ ] **Step 6: Inspect changed filenames** to confirm isolation.
