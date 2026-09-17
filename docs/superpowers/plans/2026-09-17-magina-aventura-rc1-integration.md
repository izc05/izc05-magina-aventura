# Mágina Aventura RC1 Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidar las ramas existentes de Mágina Aventura en una única línea `integration/rc1`, cerrar los huecos definidos por la Master Spec y producir una candidata Android RC1 verificable en campo con Cuadros/Bedmar como piloto canónico.

**Architecture:** La integración parte de la experiencia móvil pre-beta actual y suma capacidades por cadenas completas, preservando los motores ya desarrollados y evitando fusionar PRs ancestros de forma redundante. La autoridad se mantiene separada: móvil registra evidencia y opera offline, servidor valida y consolida, Admin publica/versiona, y `packages/domain` contiene reglas puras deterministas. Cada tramo termina en un gate automático o manual antes de aceptar el siguiente.

**Tech Stack:** Node 22, pnpm 10, TypeScript 6, Expo SDK 57, React Native 0.86, Expo Router, Expo Location/Task Manager/SQLite, MapLibre React Native 11, Supabase Auth/PostgreSQL/PostGIS/Storage/RLS/RPC, Vitest, pgTAP, GitHub Actions, Android Gradle ARM64 release.

**Spec:** `docs/superpowers/specs/2026-09-17-magina-aventura-rc1-master-design.md`

## Global Constraints

- No modificar `main` directamente. Toda la integración se ejecuta en `integration/rc1` creada desde la candidata móvil aprobada.
- El punto de partida móvil es `feat/prebeta-ux-polish-v1`; en la auditoría del 2026-09-17 su HEAD era `044d89cb12cb20f683d99524ea5f946276e3a045`.
- Cuadros/Bedmar es el piloto canónico RC1. El Peralejo/Cambil puede permanecer como fixture técnico, pero no sustituye el gate de campo final.
- No fabricar geometría, checkpoints, descubrimientos, desnivel, agua, seguridad ni recompensas para superar gates.
- Mi Olivo visual, wallet comercial, partners/almazaras, reservas y QR quedan fuera del gate RC1 aunque código preexistente permanezca protegido por permisos/feature flags.
- Sólo una actividad `VERIFIED` puede consolidar XP, logros, retos, ranking y aceitunas. `FLAGGED` y `REJECTED` no recompensan.
- Offline es requisito funcional: una aventura descargada debe poder iniciar, continuar, pausar, reanudar y terminar sin Internet.
- Track, ubicación precisa y fotografías nacen privados.
- Una versión publicada de ruta y un track GPS original no se sobrescriben destructivamente.
- El APK de prueba física debe ser un release ARM64 generado por CI y vinculado a SHA exacto; una build local no satisface el gate.
- Los gates manuales no pueden marcarse `READY` mediante CI.
- Antes de integrar cualquier rama cuyo HEAD haya cambiado respecto a esta planificación, comparar cambios con el SHA auditado y revisar que no amplía el alcance RC1.

## Integration Inputs Audited

| Capability | Branch / PR | SHA auditado | Uso RC1 |
|---|---|---:|---|
| Mobile pre-beta | `feat/prebeta-ux-polish-v1` / #34 | `044d89cb12cb20f683d99524ea5f946276e3a045` | base de `integration/rc1` |
| Auth/perfiles | `feat/02-platform-auth-geospatial` / #4 | `d5728378a80315752b6872bbe663e2c650954648` | entra vía cadena Community cuando sea posible |
| Community foundation | `feat/03-community-foundation` / #5 | `5ce62cdb58951ea4e0d12a72c755221c35ca23b4` | mínimo RC1 |
| Community mobile | `feat/04-community-mobile` / #6 | `9db861b34a96075bc8e10bb58230e14aa2a50f30` | lectura mínima RC1 |
| Exploration → progression → rewards | `feat/07d-reward-delivery-plan` / #23 | `249f1d8876a0b26a2864ce26794b0fa26afb266e` | cadena completa de dominio |
| Beta readiness | `feat/08a-beta-readiness` / #25 | `94b6536e9f037e628cd968b9f1de72529f3dfa25` | gates RC1 |
| Canonical catalog | `feat/adventure-catalog-v1` / #28 | `d252a9d4da3dec4e0e96556e47b4083c12a23f78` | catálogo real/procedencia |
| Admin base | `feat/admin-v1` / #8 | `df697eb38a7b109c0f4aaf9b81314eaba1d54e84` | control plane |
| Admin branding | `feat/admin-official-brand-v1` / #29 | `f12e95857e573e4ddf51969321f027607010804c` | entra |
| Admin discoveries | `feat/admin-route-master-discoveries-v1` / #31 | `4f46876ac959f6124b5c56b9d788ddd622359073` | entra |
| Admin catalog ingest | `feat/admin-catalog-ingest-v1` / #33 | `64fd5cd89448b32adae01239d4f66e72793c76d1` | entra |
| ARM64 build | PR #32, ya integrado sobre rama GPS/visual | `37dcb101a0860dbb230bb13864c288217cdc4402` | obligatorio conservar |

---

### Task 1: Create the isolated RC1 integration line and freeze a reproducible baseline

**Files:**
- Modify only if needed for branch trigger: `.github/workflows/ci.yml`
- Modify only if needed for branch trigger: `.github/workflows/android-preview.yml`
- Create: `docs/rc1/integration-ledger.md`

**Interfaces:**
- Produces branch `integration/rc1` based on the exact audited mobile candidate.
- Produces an integration ledger recording merge source, source SHA, resulting SHA, automated gate result and manual gates still pending.

- [ ] **Step 1: Create an isolated worktree at execution time**

Use the `superpowers:using-git-worktrees` skill, then:

```bash
git fetch origin --prune
git rev-parse origin/feat/prebeta-ux-polish-v1
```

Expected audited SHA: `044d89cb12cb20f683d99524ea5f946276e3a045`.

If the SHA differs, stop this task, run:

```bash
git log --oneline 044d89cb12cb20f683d99524ea5f946276e3a045..origin/feat/prebeta-ux-polish-v1
git diff --stat 044d89cb12cb20f683d99524ea5f946276e3a045..origin/feat/prebeta-ux-polish-v1
```

Review the delta against the Master Spec before proceeding.

- [ ] **Step 2: Create integration branch**

```bash
git switch -c integration/rc1 origin/feat/prebeta-ux-polish-v1
```

- [ ] **Step 3: Run baseline automated gate before any merge**

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
supabase db start
supabase db reset
supabase test db
supabase stop --no-backup
cd apps/mobile
pnpm exec expo prebuild --platform android --no-install --clean
cd ../..
```

Expected: all commands PASS. If baseline is red, do not merge another capability until the baseline cause is isolated.

- [ ] **Step 4: Verify ARM64 workflow semantics already exist**

`.github/workflows/android-preview.yml` must contain:

```bash
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon
```

and a check that the APK contains exactly `arm64-v8a`. If either is absent, restore the PR #32 behavior before continuing.

- [ ] **Step 5: Add integration branch to CI triggers if not already covered**

Both CI and Android preview workflows must run on `integration/rc1`. Preserve all existing triggers.

- [ ] **Step 6: Create integration ledger**

Create `docs/rc1/integration-ledger.md` with this exact initial table:

```md
# RC1 Integration Ledger

| Order | Capability | Source branch | Audited source SHA | Result SHA | Automated gate | Manual gate | Notes |
|---:|---|---|---|---|---|---|---|
| 0 | Mobile pre-beta baseline | feat/prebeta-ux-polish-v1 | 044d89cb12cb20f683d99524ea5f946276e3a045 | <record after branch creation> | READY when CI passes | GPS field pending | RC1 starting point |
```

Replace `<record after branch creation>` with `git rev-parse HEAD` before committing; it must not remain as text.

- [ ] **Step 7: Commit branch-only setup**

```bash
git add .github/workflows docs/rc1/integration-ledger.md
git commit -m "chore: establish RC1 integration line"
```

---

### Task 2: Integrate Auth + minimal Community as one ancestry-aware chain

**Files:**
- Merge source: `origin/feat/04-community-mobile`
- Expected important paths after merge:
  - `apps/mobile/src/backend/supabase-config.ts`
  - `apps/mobile/src/backend/supabase-config.test.ts`
  - Community mobile route files introduced by PR #6
  - `supabase/migrations/202609150008_profiles.sql`
  - `supabase/migrations/202609150009_profile_creation.sql`
  - Community migrations/tests introduced by PR #5
- Modify: `docs/rc1/integration-ledger.md`

**Interfaces:**
- Provides Supabase identity/profile base plus safe public route-community reads.
- RC1 accepts route photos/reviews/incidents read surface; advanced social writes/chat are not release gates.

- [ ] **Step 1: Verify branch head and ancestry**

```bash
git fetch origin --prune
git rev-parse origin/feat/04-community-mobile
git merge-base --is-ancestor origin/feat/02-platform-auth-geospatial origin/feat/04-community-mobile
git merge-base --is-ancestor origin/feat/03-community-foundation origin/feat/04-community-mobile
```

Expected head from audit: `9db861b34a96075bc8e10bb58230e14aa2a50f30`; both ancestry checks exit 0.

- [ ] **Step 2: Merge the highest community branch once**

```bash
git merge --no-ff origin/feat/04-community-mobile -m "merge: integrate auth and RC1 community chain"
```

Do not separately merge PR #4 and #5 afterward; they are ancestors of this chain.

- [ ] **Step 3: Resolve conflicts with mobile-first rules**

If mobile route/detail files conflict, preserve the current #34 visual/presenter structure and inject community access through adapters/components rather than restoring an older screen wholesale. Preserve #34 search/filter/navigation behavior.

- [ ] **Step 4: Run focused auth/community gate**

```bash
pnpm typecheck
pnpm test
supabase db reset
supabase test db
```

Required invariants:
- profile RLS permits own read/update only as designed;
- anonymous users cannot read private user data;
- public community reads do not expose exact private coordinates;
- mobile still compiles with the official pre-beta visual flow.

- [ ] **Step 5: Record merge result and commit any conflict resolution**

Update `docs/rc1/integration-ledger.md` with source/result SHAs and gate result. If conflict resolution created staged changes after the merge commit, commit them separately:

```bash
git add .
git commit -m "fix: reconcile community chain with RC1 mobile"
```

---

### Task 3: Integrate exploration, collections, progression, rankings and reward domain as one chain

**Files:**
- Merge source: `origin/feat/07d-reward-delivery-plan`
- Important packages after merge:
  - `packages/activity-engine/src/exploration/`
  - `packages/domain/src/gamification/`
  - `packages/domain/src/rewards/`
  - `packages/domain/src/integration/olive-outbox.ts`
  - `packages/domain/src/index.ts`
- Modify: `docs/rc1/integration-ledger.md`

**Interfaces:**
- Provides provisional discovery evidence, collections, XP/levels/stats/badges/challenges/rankings, reward validation, olive grants, outbox and atomic delivery planning.
- Does not itself grant rewards from the mobile client.

- [ ] **Step 1: Verify audited chain head**

```bash
git rev-parse origin/feat/07d-reward-delivery-plan
```

Expected audited SHA: `249f1d8876a0b26a2864ce26794b0fa26afb266e`.

- [ ] **Step 2: Merge once at the chain tip**

```bash
git merge --no-ff origin/feat/07d-reward-delivery-plan -m "merge: integrate RC1 exploration progression and rewards domain"
```

Do not independently merge PRs #7, #9, #11, #13, #14, #15, #18, #19, #20, #21 or #22; their work is already in the #23 ancestry.

- [ ] **Step 3: Protect the newer GPS/mobile integration during conflicts**

If `packages/activity-engine` overlaps with the GPS copy already used by #34, retain all newer GPS/background/recovery behavior and merge only the additional exploration modules/exports needed by this chain. No rollback from real GPS to demo logic is acceptable.

- [ ] **Step 4: Add one integration test proving no reward before verification**

Create or extend `packages/domain/src/gamification/progression-cycle.integration.test.ts` with the equivalent behavior:

```ts
it('does not consolidate progression for a non-verified activity', () => {
  const result = projectVerifiedProgression({
    activity: { id: 'a1', verificationState: 'FLAGGED' },
    // use the exact existing domain input builders/types after merge
  });
  expect(result).toEqual(expect.objectContaining({ applied: false }));
});
```

Use the actual exported API names from the merged domain. The assertion must prove `FLAGGED` cannot produce committed progression; if the existing API rejects non-verified inputs earlier, test that explicit rejection instead.

- [ ] **Step 5: Run pure-domain and GPS regression gates**

```bash
pnpm typecheck
pnpm test
```

Required: exploration/progression/reward tests pass and existing GPS replay/background tests remain green.

- [ ] **Step 6: Update integration ledger**

Record the source SHA, resulting SHA and note: `Domain ready; persistence/transaction wiring still pending Task 8`.

---

### Task 4: Integrate Beta Readiness and bind all evidence to the exact RC1 candidate

**Files:**
- Merge source: `origin/feat/08a-beta-readiness`
- `packages/domain/src/readiness/beta-readiness.ts`
- `packages/domain/src/readiness/beta-report.ts`
- `packages/domain/src/readiness/dependency-readiness.ts`
- Tests in the same directory
- Modify: `docs/rc1/integration-ledger.md`

**Interfaces:**
- Uses existing `READY | BLOCKED | MANUAL | NOT_APPLICABLE` gate semantics.
- Evidence must match both `gateId` and exact `candidateSha`.

- [ ] **Step 1: Merge readiness chain**

```bash
git merge --no-ff origin/feat/08a-beta-readiness -m "merge: integrate RC1 beta readiness gates"
```

Audited head: `94b6536e9f037e628cd968b9f1de72529f3dfa25`.

- [ ] **Step 2: Extend the internal beta profile for Master Spec RC1**

Modify `ANDROID_INTERNAL_BETA_PROFILE.requiredGateIds` to include these additional required gate IDs if absent:

```ts
'canonical-catalog'
'cuadros-adventure-ready'
'offline-end-to-end'
'server-validation'
'weather-snapshot'
'safety-emergency'
'observability'
'admin-control-center'
'arm64-release'
'staging-smoke'
```

Keep `community-write` and `reward-qr-redemption` deferred.

- [ ] **Step 3: Add tests for stale candidate evidence**

In `packages/domain/src/readiness/beta-report.test.ts`, create evidence for SHA `old-sha` and build the report for `new-sha`; assert the matching required gate remains `BLOCKED` or `MANUAL` according to gate mode. CI evidence must never satisfy a manual gate.

- [ ] **Step 4: Run domain suite**

```bash
pnpm --filter @magina-aventura/domain test
pnpm typecheck
```

- [ ] **Step 5: Update ledger**

Record resulting SHA and list manual gates still expected: physical GPS, Cuadros field validation and any device-specific battery/background verification.

---

### Task 5: Integrate the canonical Sierra Mágina catalog without replacing operational Route Master data

**Files:**
- Merge source: `origin/feat/adventure-catalog-v1`
- `packages/contracts/src/catalog.ts`
- `packages/domain/src/catalog/`
- `packages/geo/src/geometry-validation.ts`
- `packages/geo/src/track-metrics.ts`
- `packages/route-import/src/gpx.ts`
- `packages/route-import/src/geojson.ts`
- `docs/catalog/source-ledger.md`
- Modify: `docs/rc1/integration-ledger.md`

**Interfaces:**
- `createCatalogReader(snapshot)` remains the storage-independent canonical read model.
- Catalog facts are evidence; they do not auto-publish routes.

- [ ] **Step 1: Merge catalog branch**

```bash
git merge --no-ff origin/feat/adventure-catalog-v1 -m "merge: integrate canonical Sierra Magina catalog"
```

Audited head: `d252a9d4da3dec4e0e96556e47b4083c12a23f78`.

- [ ] **Step 2: Resolve package export conflicts additively**

`packages/contracts/src/index.ts`, `packages/domain/src/index.ts`, `packages/geo/src/index.ts` and `packages/route-import/src/index.ts` must export both the already-integrated activity/progression APIs and catalog APIs. Do not choose one branch's index wholesale.

- [ ] **Step 3: Run catalog tests and full package suite**

```bash
pnpm --filter @magina-aventura/domain test
pnpm --filter @magina-aventura/geo test
pnpm --filter @magina-aventura/route-import test
pnpm typecheck
pnpm test
```

- [ ] **Step 4: Verify no fake Cuadros geometry entered through merge**

Search:

```bash
git grep -n "sendero-de-cuadros-dev\|dev-bedmar-cuadros" -- . ':!docs'
```

Any development fixture may remain only if clearly isolated from the canonical production read path. No fixture can satisfy `cuadros-adventure-ready`.

- [ ] **Step 5: Update integration ledger**

Record `Catalog integrated; publication still blocked until Admin ingest + verified Cuadros geometry/content`.

---

### Task 6: Consolidate Admin base + branding + discoveries + catalog ingest into one Admin RC1 line

**Files:**
- Merge sources in this order:
  1. `origin/feat/admin-v1`
  2. `origin/feat/admin-official-brand-v1`
  3. `origin/feat/admin-route-master-discoveries-v1`
  4. `origin/feat/admin-catalog-ingest-v1`
- `apps/admin/**`
- `supabase/migrations/202609160001_admin_platform.sql` through existing Admin migrations
- Admin pgTAP and Node tests
- Modify: `docs/rc1/integration-ledger.md`

**Interfaces:**
- Admin manages one route model; imported canonical evidence is read/review material, not an alternate published-route system.
- Commercial/QR code may stay present but is not an RC1 readiness dependency.

- [ ] **Step 1: Merge Admin base**

```bash
git merge --no-ff origin/feat/admin-v1 -m "merge: integrate RC1 admin control plane"
```

- [ ] **Step 2: Merge the three sibling Admin branches**

```bash
git merge --no-ff origin/feat/admin-official-brand-v1 -m "merge: integrate admin branding"
git merge --no-ff origin/feat/admin-route-master-discoveries-v1 -m "merge: integrate admin discovery editor"
git merge --no-ff origin/feat/admin-catalog-ingest-v1 -m "merge: integrate admin canonical catalog ingest"
```

Because all three were based on `feat/admin-v1`, Git should bring only their deltas after the base is present. Resolve shared Route Master files by preserving all four capabilities: base Route Master, branding, discovery editor and canonical evidence panel.

- [ ] **Step 3: Resolve migration collisions by history, never by renumbering old migrations after they have been shared**

Run:

```bash
find supabase/migrations -maxdepth 1 -type f -printf '%f\n' | sort | uniq -d
```

Expected: no duplicate filenames. If two different migrations share a timestamp/name, create a new forward migration on `20260917...`; do not rewrite already-audited migration history.

- [ ] **Step 4: Hide non-RC1 commercial modules from normal RC1 navigation**

Use existing capability/feature-flag mechanisms. Do not delete ledger/reward/partner/QR code. The RC1 Admin default navigation must prioritize Dashboard, Rutas/Route Master, Actividades, Comunidad, Progresión, Seguridad/Notificaciones, Configuración/Auditoría and RC1 Control Center.

- [ ] **Step 5: Run Admin + database gate**

```bash
pnpm run check:admin
pnpm test
supabase db reset
supabase test db
```

Required: `route-master-discoveries` is green, catalog ingest tests are green, RLS/audit tests remain green, no direct `service_role` exposure in browser config.

- [ ] **Step 6: Update integration ledger**

Record all four source SHAs and the final result SHA as one Admin integration block.

---

### Task 7: Replace the pre-beta fixture as the production read path with a canonical route repository adapter

**Files:**
- Create: `apps/mobile/src/features/routes/route-repository.ts`
- Create: `apps/mobile/src/features/routes/catalog-route-adapter.ts`
- Create: `apps/mobile/src/features/routes/catalog-route-adapter.test.ts`
- Create: `apps/mobile/src/features/routes/use-route-catalog.ts`
- Modify: `apps/mobile/app/index.tsx`
- Modify: `apps/mobile/app/routes/[slug].tsx` if this route exists after integration
- Modify: `apps/mobile/app/routes/[slug]/prepare.tsx`
- Retain only as explicit fixture: `apps/mobile/src/features/routes/fixtures.ts`

**Interfaces:**

```ts
export interface MobileRouteRepository {
  list(): Promise<AdventureRouteCard[]>;
  bySlug(slug: string): Promise<AdventureRouteDetail | null>;
}
```

`catalog-route-adapter.ts` maps the canonical/server read model into the existing mobile presenter types without inventing values.

- [ ] **Step 1: Write RED adapter tests**

Use a canonical route with missing elevation/reward/geometry and assert the mobile model exposes explicit unavailable/pending state rather than `0` unless zero is a verified value. Include a multi-municipality route and a `CLOSED` operational status.

- [ ] **Step 2: Implement adapter with honest nullability**

Rules:
- verified `0` remains zero;
- unknown distance/elevation/duration is unavailable, not converted to zero;
- `ADVENTURE_READY` requires a published/versioned operational route payload, not catalog completeness alone;
- operational `CLOSED`/`RESTRICTED` status overrides visual readiness to start.

- [ ] **Step 3: Implement repository boundary**

The production repository reads from Supabase published route/catalog views or RPCs already provided by integrated backend. Keep `developmentRoutes` injectable only for tests/dev mode.

- [ ] **Step 4: Replace `developmentRoutes` in Home production path**

`apps/mobile/app/index.tsx` must obtain routes via `useRouteCatalog()`. Preserve #34 search/filter UX and loading/empty/error states.

- [ ] **Step 5: Replace fixture lookup in detail/prepare**

Route detail and preparation must use the same repository and the same stable `route_id`/published version. A slug cannot resolve to one fixture on Home and another entity during adventure.

- [ ] **Step 6: Run mobile regression gate**

```bash
pnpm --filter @magina-aventura/mobile test
pnpm typecheck
pnpm test
```

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/features/routes apps/mobile/app
git commit -m "feat: connect mobile to canonical route catalog"
```

---

### Task 8: Persist server validation, verified progression, ledger and outbox atomically

**Files:**
- Create: `supabase/migrations/202609170001_rc1_activity_validation.sql`
- Create: `supabase/migrations/202609170002_rc1_verified_progression.sql`
- Create: `supabase/tests/database/rc1_activity_validation_test.sql`
- Create: `supabase/tests/database/rc1_verified_progression_test.sql`
- Create: `supabase/functions/validate-activity/index.ts` only if domain execution cannot safely remain in SQL/RPC
- Create: `packages/contracts/src/activity-validation.ts`
- Modify: `packages/contracts/src/index.ts`

**Interfaces:**

```ts
export type ActivityValidationState = 'VALIDATING' | 'VERIFIED' | 'FLAGGED' | 'REJECTED';
export interface ActivityValidationDecision {
  activityId: string;
  state: ActivityValidationState;
  reasonCodes: string[];
  policyVersion: string;
  decidedAt: string;
}
```

Server operation must be idempotent by `activity_id` and reward `source_key`.

- [ ] **Step 1: Write pgTAP RED for authority boundaries**

Assert authenticated mobile users cannot set validation state to `VERIFIED`, cannot insert arbitrary XP/olive ledger entries and cannot modify leaderboard scores directly.

- [ ] **Step 2: Add validation persistence**

Create/extend activity validation storage with immutable/audited decisions. Preserve the original raw evidence. Store reason codes such as `GPS_ACCURACY_DEGRADED`, `LONG_GPS_GAP`, `ROUTE_COVERAGE_LOW`, `IMPOSSIBLE_LOCATION_JUMP`, `DUPLICATE_ACTIVITY`, `CHECKPOINT_EVIDENCE_MISSING`, `ROUTE_VERSION_MISMATCH`.

- [ ] **Step 3: Add one privileged validation entry point**

Expose a server-only RPC/function that loads activity evidence, applies the already-integrated reward/activity validation domain policy and returns one of `VERIFIED | FLAGGED | REJECTED | already-committed`.

- [ ] **Step 4: Make verified consolidation idempotent and transactional**

Within one database transaction or one server operation with equivalent atomicity:

```text
validation decision
+ verified stats
+ XP/level projection
+ badges
+ challenge progress
+ ranking contribution
+ olive ledger entries
+ integration outbox events
```

If any persistence step fails, no partial final reward state may remain.

- [ ] **Step 5: RED/GREEN retry test**

Process the same verified activity twice. Assert:
- one committed activity result;
- one XP contribution;
- no duplicated badge/challenge completion;
- one olive ledger `source_key` per intended grant;
- one outbox `eventKey` per grant;
- second execution returns/behaves as `already-committed`.

- [ ] **Step 6: Run database + domain tests**

```bash
pnpm --filter @magina-aventura/domain test
supabase db reset
supabase test db
pnpm typecheck
```

- [ ] **Step 7: Commit**

```bash
git add packages/contracts supabase/migrations supabase/tests supabase/functions
git commit -m "feat: persist verified RC1 progression atomically"
```

---

### Task 9: Make the offline package a versioned, atomic adventure artifact

**Files:**
- Create: `packages/contracts/src/offline-package.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/offline-sync/src/package-manifest.ts`
- Create: `packages/offline-sync/src/package-manifest.test.ts`
- Modify/create mobile package download/store files under `apps/mobile/src/offline/`
- Add/extend Supabase migration only if existing `route_map_assets` schema lacks package-manifest identity

**Interfaces:**

```ts
export interface OfflineAdventureManifestV1 {
  schemaVersion: 'offline-package.v1';
  packageId: string;
  routeId: string;
  routeVersionId: string;
  geometryVersion: number;
  mapAssetVersion: number;
  createdAt: string;
  contentHash: string;
  safetySnapshotUpdatedAt: string | null;
  weatherSnapshotUpdatedAt: string | null;
}
```

- [ ] **Step 1: Write RED package validation tests**

Reject missing route version, wrong schema version, malformed hash and mismatched route/geometry identity. A partial package must never become `READY`.

- [ ] **Step 2: Implement atomic installation state**

Use:

```text
NOT_DOWNLOADED -> DOWNLOADING -> VERIFYING -> READY
                                  -> FAILED
READY(old) + download(new) keeps old active until new is VERIFIED
```

Store to temporary location first, validate manifest/hash, then atomically switch the active package pointer.

- [ ] **Step 3: Bind activity start to exact package/version**

When an activity starts, persist `routeVersionId` and `offlinePackageVersion/packageId`. A route update during the walk cannot rewrite that association.

- [ ] **Step 4: Protect pending evidence from cache eviction**

Never auto-delete active-route package, active/unverified activity or media pending upload. Cache cleanup may remove only reconstructible/synced assets.

- [ ] **Step 5: Test interrupted download and stale update**

Required tests:
- interruption leaves old package usable;
- corrupted new hash leaves old package active;
- successful new package replaces old for future activities only;
- existing activity remains pinned to old version.

- [ ] **Step 6: Run offline/mobile tests and commit**

```bash
pnpm --filter @magina-aventura/offline-sync test
pnpm --filter @magina-aventura/mobile test
pnpm typecheck
git add packages/contracts packages/offline-sync apps/mobile/src/offline supabase
git commit -m "feat: version RC1 offline adventure packages"
```

---

### Task 10: Add weather snapshot service without coupling GPS to AEMET

**Files:**
- Create: `packages/contracts/src/weather.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `supabase/migrations/202609170003_weather_snapshots.sql`
- Create: `supabase/tests/database/weather_snapshots_test.sql`
- Create: `supabase/functions/weather-refresh/index.ts`
- Create: `apps/mobile/src/features/weather/weather-presenter.ts`
- Create: `apps/mobile/src/features/weather/weather-presenter.test.ts`
- Modify: route detail/preparation/adventure UI to consume snapshot state

**Interfaces:**

```ts
export interface WeatherSnapshotV1 {
  schemaVersion: 'weather-snapshot.v1';
  provider: string;
  routeId: string;
  observedAt: string | null;
  fetchedAt: string;
  validUntil: string | null;
  temperatureC: number | null;
  windKph: number | null;
  precipitationProbabilityPct: number | null;
  alerts: readonly { id: string; severity: string; title: string }[];
}
```

- [ ] **Step 1: RED normalization/presenter tests**

Test current snapshot, stale snapshot and provider failure. Stale data must render an explicit `Actualizado ...`/`Información no actualizada` state rather than pretending to be live.

- [ ] **Step 2: Implement server-side provider adapter**

Only the server function knows AEMET/provider credentials and provider-specific payloads. Mobile receives normalized `weather-snapshot.v1` only.

- [ ] **Step 3: Persist latest snapshots with provenance/timestamps**

RLS permits safe route-weather reads; clients cannot forge authoritative snapshots.

- [ ] **Step 4: Include the last available snapshot in offline package metadata/content**

No snapshot is a valid state. Weather errors never block adventure start or GPS tracking.

- [ ] **Step 5: Run tests and commit**

```bash
pnpm test
supabase db reset
supabase test db
pnpm typecheck
git add packages/contracts supabase apps/mobile/src/features/weather apps/mobile/app
git commit -m "feat: add cached RC1 weather snapshots"
```

---

### Task 11: Add safety/emergency UX and local critical alerts

**Files:**
- Create: `apps/mobile/app/adventure/[slug]/safety.tsx` or the equivalent nested route supported by current Expo Router structure
- Create: `apps/mobile/src/features/safety/emergency-presenter.ts`
- Create: `apps/mobile/src/features/safety/emergency-presenter.test.ts`
- Modify: `apps/mobile/app/adventure/[slug].tsx`
- Modify: `apps/mobile/app/routes/[slug]/prepare.tsx`
- Reuse integrated Admin route safety/status models

**Interfaces:**
- Emergency screen works without Internet and displays current/last reliable coordinates.
- Local alerts: sustained off-route, prolonged GPS loss and low battery where platform APIs permit.

- [ ] **Step 1: RED presenter tests**

Given a valid last location, output formatted latitude/longitude, accuracy label, timestamp and share payload. Given no location, display a clear unavailable state and never fabricate coordinates.

- [ ] **Step 2: Implement emergency screen**

Show high-contrast:

```text
current/last known coordinates
accuracy + timestamp
altitude when available
activity/route name
call emergency action
copy coordinates
share location when platform connectivity/action permits
```

Do not display XP, olives or challenge UI in this screen.

- [ ] **Step 3: Wire safety entry from active adventure in few taps**

The active-adventure HUD must expose a persistent safety/help affordance without leaving the activity engine or stopping recording.

- [ ] **Step 4: Add local critical alerts**

Critical off-route/GPS-loss alerts use device-local state and do not depend on push. Debounce GPS noise using the already-integrated sustained evidence engine.

- [ ] **Step 5: Prepare route start against operational status**

When online before start, refresh operational status; `CLOSED` blocks start, `RESTRICTED` applies policy, `CAUTION` warns. Offline uses last known status + visible timestamp.

- [ ] **Step 6: Test/typecheck/commit**

```bash
pnpm --filter @magina-aventura/mobile test
pnpm typecheck
git add apps/mobile
git commit -m "feat: add RC1 emergency and local safety flow"
```

---

### Task 12: Integrate camera/media privately first, community publish second

**Files:**
- Create: `apps/mobile/src/features/media/activity-media.ts`
- Create: `apps/mobile/src/features/media/activity-media.test.ts`
- Create/modify camera screen/component under `apps/mobile/src/features/media/`
- Create: `supabase/migrations/202609170004_activity_media.sql`
- Create: `supabase/tests/database/activity_media_test.sql`
- Reuse Community media/publication tables where compatible

**Interfaces:**

```ts
export type MediaPrivacy = 'PRIVATE' | 'PUBLIC';
export interface ActivityMediaRef {
  id: string;
  activityId: string;
  discoveryId: string | null;
  localUri: string | null;
  remoteObjectPath: string | null;
  privacy: MediaPrivacy;
  syncState: 'LOCAL' | 'QUEUED' | 'UPLOADING' | 'SYNCED' | 'FAILED';
}
```

- [ ] **Step 1: RED privacy tests**

A newly captured photo must default to `PRIVATE` and must not create a community publication. Community publish must be an explicit separate action.

- [ ] **Step 2: Implement local-first media record**

Capture/save local reference even offline. Link optionally to discovery/checkpoint. Failure to upload media must not block track/activity sync.

- [ ] **Step 3: Strip unnecessary public EXIF/location metadata**

Public derivative/upload must not expose GPS EXIF by default. Keep internal activity relation server-side under RLS where needed.

- [ ] **Step 4: Implement explicit community publication adapter**

Publishing references the media object but creates a separate community record; deleting/hiding the community record does not automatically delete the private activity evidence.

- [ ] **Step 5: Database security tests**

Owner can read own private media; unrelated users cannot. Public/community views expose only approved/public derivatives.

- [ ] **Step 6: Run tests and commit**

```bash
pnpm test
supabase db reset
supabase test db
pnpm typecheck
git add apps/mobile supabase
git commit -m "feat: add private-first adventure media flow"
```

---

### Task 13: Add observability and diagnostics without turning logs into a second database

**Files:**
- Create: `packages/contracts/src/diagnostics.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `apps/mobile/src/diagnostics/activity-diagnostics.ts`
- Create: `apps/mobile/src/diagnostics/activity-diagnostics.test.ts`
- Create: `apps/mobile/src/diagnostics/support-bundle.ts`
- Create: `apps/mobile/src/diagnostics/support-bundle.test.ts`
- Add Admin activity-health view module/test under existing `apps/admin` patterns

**Interfaces:**

```ts
export interface DiagnosticEventV1 {
  schemaVersion: 'diagnostic-event.v1';
  activityId: string | null;
  appVersion: string;
  candidateSha: string;
  type: string;
  occurredAt: string;
  details: Record<string, string | number | boolean | null>;
}
```

- [ ] **Step 1: RED diagnostic-event tests**

Cover START, BACKGROUND, GPS_LOST, GPS_RECOVERED, OFF_ROUTE, SYNC_ATTEMPT, SYNC_ACK, SYNC_ERROR and RECOVERY. Assert diagnostic payload excludes auth token/key fields.

- [ ] **Step 2: Implement bounded local event buffer**

Diagnostics explain the activity; they do not replace track/activity persistence. Use bounded retention and structured events.

- [ ] **Step 3: Implement support bundle sanitizer**

Output app version, candidate SHA, Android/device metadata available to the app, activity state, event timeline and sync status. Exclude secrets/tokens and unrelated account data. Raw track inclusion must be an explicit option, default false.

- [ ] **Step 4: Add Admin activity-health summary**

Show counts/status for pending validation, flagged, rejected, sync failures and GPS diagnostic anomalies. Exact track access remains a privileged drill-down.

- [ ] **Step 5: Tests and commit**

```bash
pnpm test
pnpm run check:admin
pnpm typecheck
git add packages/contracts apps/mobile/src/diagnostics apps/admin
git commit -m "feat: add RC1 activity diagnostics"
```

---

### Task 14: Replace bottom-nav placeholders with actual RC1 read surfaces

**Files:**
- Modify: `apps/mobile/src/features/prebeta/prebeta-ux.ts`
- Modify: `apps/mobile/app/index.tsx`
- Create or wire Expo Router screens for:
  - Retos
  - Colecciones
  - Ranking
  - Perfil
  - Historial/actividad detail where absent
- Reuse integrated progression/domain/server read models

**Interfaces:**
- Bottom navigation final order: `Rutas · Retos · Colecciones · Ranking · Perfil`.
- Active adventure remains a focused mode above/beyond normal bottom navigation.

- [ ] **Step 1: RED navigation contract test**

Update `prebeta-ux.test.ts` so each final tab resolves to a concrete route, not `coming-soon`.

Example desired contract:

```ts
expect(resolveBottomNavSelection('Retos')).toEqual({ kind: 'navigate', href: '/challenges' });
expect(resolveBottomNavSelection('Colecciones')).toEqual({ kind: 'navigate', href: '/collections' });
expect(resolveBottomNavSelection('Ranking')).toEqual({ kind: 'navigate', href: '/ranking' });
expect(resolveBottomNavSelection('Perfil')).toEqual({ kind: 'navigate', href: '/profile' });
```

Use the exact final route paths chosen in the implementation and keep them consistent in test and router files.

- [ ] **Step 2: Implement read surfaces from verified server state**

Retos, colecciones, rankings and profile must render only consolidated/verified data as final. Pending activity may show a separate provisional state but cannot inflate totals/ranking.

- [ ] **Step 3: Add history validation states**

Activity history rows must visibly distinguish `SYNC_PENDING`, `VALIDATING`, `VERIFIED`, `FLAGGED`, `REJECTED`.

- [ ] **Step 4: Preserve privacy in public profile/ranking**

Expose display name/avatar/permitted stats only. Never expose email, track coordinates or private activity IDs through public list views.

- [ ] **Step 5: Mobile gate and commit**

```bash
pnpm --filter @magina-aventura/mobile test
pnpm typecheck
pnpm test
git add apps/mobile
git commit -m "feat: activate RC1 progression navigation"
```

---

### Task 15: Build the RC1 Control Center in Admin from the readiness domain

**Files:**
- Create: `apps/admin/src/core/rc1-control-center.mjs`
- Create: `apps/admin/tests/rc1-control-center.test.mjs`
- Modify: Admin navigation/shell module appropriate after Task 6
- Create: `supabase/migrations/202609170005_rc1_readiness_evidence.sql`
- Create: `supabase/tests/database/rc1_readiness_evidence_test.sql`

**Interfaces:**
- Stores candidate-bound evidence `{ gate_id, candidate_sha, kind, passed, reference, recorded_at, actor }`.
- Renders domain statuses `READY | BLOCKED | MANUAL | NOT_APPLICABLE` without inventing success.

- [ ] **Step 1: RED evidence security tests**

Anonymous/mobile clients cannot forge readiness evidence. Manual evidence requires an authorized Admin action; CI evidence ingestion cannot masquerade as `kind='manual'`.

- [ ] **Step 2: Implement evidence store/read RPC**

Persist candidate SHA, gate ID, evidence kind/reference and actor. Keep previous candidate evidence for audit but readiness queries must filter exact current SHA.

- [ ] **Step 3: Implement Control Center presenter**

Show at minimum:

```text
Candidate SHA
APK artifact/hash
Supabase environment/staging status
Canonical catalog
Cuadros ADVENTURE_READY
Offline end-to-end
GPS runtime
Physical GPS field test
Server validation
Weather snapshot
Safety/emergency
Observability
Admin smoke
P0/P1 blockers
```

- [ ] **Step 4: Prevent manual gate auto-promotion**

A CI webhook/import may mark automatic gates only. The UI must keep `gps-field`/Cuadros field validation in `MANUAL` until authorized evidence is recorded for the exact candidate SHA.

- [ ] **Step 5: Admin/DB tests and commit**

```bash
pnpm run check:admin
supabase db reset
supabase test db
pnpm typecheck
git add apps/admin supabase
git commit -m "feat: add RC1 readiness control center"
```

---

### Task 16: Separate dev/staging/production configuration and run a reproducible staging smoke

**Files:**
- Create/modify environment configuration files using the repo's established non-secret pattern
- Modify: `apps/mobile/src/backend/supabase-config.ts`
- Modify: `apps/admin/config.js` and/or its existing generator path
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/android-preview.yml`
- Create: `docs/rc1/staging-runbook.md`

**Interfaces:**
- Build identifies target environment explicitly.
- No `service_role` or provider secret is bundled into mobile/browser code.

- [ ] **Step 1: RED config tests**

Mobile/Admin config loaders must reject missing environment identifier or malformed public Supabase URL/key. Add tests that privileged-key-like configuration is rejected from browser/mobile runtime configuration.

- [ ] **Step 2: Define exact environment identifiers**

Use:

```text
dev
staging
production
```

Every diagnostic/support bundle and candidate record includes the environment identifier.

- [ ] **Step 3: Verify database recreation from migrations**

For staging candidate preparation, the documented sequence is:

```bash
supabase db reset
supabase test db
```

Cloud deployment applies the same committed migration order; no manual table creation counts as readiness evidence.

- [ ] **Step 4: Write staging smoke runbook**

Include: Auth signup/login, catalog read, Cuadros route read when ready, offline metadata fetch, activity upload, server validation, progression read, Admin login, Route Master read, readiness control center and community public read.

- [ ] **Step 5: Run tests and commit**

```bash
pnpm test
pnpm typecheck
pnpm run check:admin
git add apps .github docs/rc1/staging-runbook.md
git commit -m "chore: separate RC1 runtime environments"
```

---

### Task 17: Promote Cuadros/Bedmar through the real publication gate without fabricated content

**Files:**
- No fixed code file is required if all necessary Admin/catalog capabilities already exist.
- Data changes must flow through Admin/import/versioning and committed migration/seed only when appropriate and sourced.
- Create: `docs/field-tests/cuadros-rc1-content-validation.md`

**Interfaces:**
- Cuadros route identity is stable.
- Published `route_version` points to verified geometry/content/package version.

- [ ] **Step 1: Prepare the content validation checklist before data entry**

Document evidence for:

```text
canonical route identity
source/provenance
GPX/geometry source
start/end
calculated distance/elevation
difficulty/duration
access
safety/restrictions
water claims
checkpoints
discoveries
offline package
media attribution
field validation date/tester
```

Each line records source/reference and status `VERIFIED | PENDING | NOT_APPLICABLE`.

- [ ] **Step 2: Import the real track through Route Master**

Use GPX/KML/GeoJSON tooling already integrated. Do not paste hand-edited metrics. Compute distance/elevation from accepted geometry and record track provenance.

- [ ] **Step 3: Add checkpoints/discoveries only with verified coordinates/content**

No checkpoint/discovery should be created solely to make the RC1 demo interesting. Each has source/editorial evidence and route-version association.

- [ ] **Step 4: Generate/verify the offline package**

The package must contain exact published route version, geometry, checkpoints, discoveries, safety snapshot, weather snapshot if available, map assets and manifest hash.

- [ ] **Step 5: Pass publication readiness**

Expected lifecycle:

```text
BORRADOR -> REVISIÓN -> CONTENIDO_VERIFICADO -> FIELD_TEST_PENDING
```

Do not mark `ADVENTURE_READY` or `PUBLICADA` until the physical field gate in Task 19 passes if the configured policy requires field evidence first.

- [ ] **Step 6: Commit documentation/evidence references**

```bash
git add docs/field-tests/cuadros-rc1-content-validation.md
git commit -m "docs: record Cuadros RC1 content validation"
```

---

### Task 18: Produce the exact ARM64 RC candidate and bind all automatic evidence to its SHA

**Files:**
- `.github/workflows/ci.yml`
- `.github/workflows/android-preview.yml`
- `docs/rc1/integration-ledger.md`
- RC1 readiness evidence store via Task 15

**Interfaces:**
- Candidate identity = source commit SHA + APK SHA-256 + environment + route version/package version.

- [ ] **Step 1: Run full repository gate at the intended candidate SHA**

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm run check:admin
supabase db start
supabase db reset
supabase test db
supabase stop --no-backup
cd apps/mobile
pnpm exec expo prebuild --platform android --no-install --clean
cd ../..
git diff --check
```

Expected: zero failures.

- [ ] **Step 2: Push candidate SHA and let GitHub Actions generate release**

Do not install a locally rebuilt APK for the field gate. Use the artifact produced for that exact pushed SHA.

- [ ] **Step 3: Verify ARM64 artifact and hash**

CI must verify only `arm64-v8a`, report size and expose artifact. Record:

```text
candidate SHA
workflow run
artifact name/id
APK SHA-256
APK bytes/MiB
staging environment
Cuadros route_version_id
offline package id/hash
```

- [ ] **Step 4: Import automatic gate evidence for exact SHA**

Only automatic gates with successful evidence become `READY`. Physical GPS/Cuadros gates remain `MANUAL`.

- [ ] **Step 5: Freeze candidate**

No source/code/config change after this point can reuse the same field-test evidence. A new commit SHA means a new candidate and stale evidence must not satisfy it.

---

### Task 19: Execute the mandatory physical Android + Cuadros end-to-end field gate

**Files:**
- Create: `docs/field-tests/rc1-cuadros-end-to-end.md`
- Update: `docs/rc1/integration-ledger.md`
- Store readiness evidence through Admin Control Center

**Interfaces:**
- Manual evidence is tied to the exact candidate SHA from Task 18.

- [ ] **Step 1: Install the CI ARM64 release artifact on the physical Android device**

Record device model, Android version, app version, candidate SHA and APK SHA-256 in the field-test document.

- [ ] **Step 2: Execute the critical journey without database intervention**

Exact journey:

```text
install APK
-> onboarding/account
-> find Cuadros
-> open route detail
-> download/verify offline package
-> preparation checks
-> start adventure
-> walk with real GPS
-> lock screen >= 5 minutes
-> switch apps/background
-> lose network / airplane mode
-> reach checkpoint
-> trigger discovery
-> take private photo
-> deliberately deviate enough to test configured off-route logic safely
-> rejoin route
-> pause/resume
-> force-close/reopen and recover if safe to test
-> finish while offline
-> relaunch and confirm summary persists
-> restore network
-> sync
-> server validation
-> confirm exactly one verified activity
-> confirm final XP/progression/olive result once
-> confirm history/profile/ranking/collection updates
```

- [ ] **Step 3: Test emergency screen during the route**

Confirm coordinates are visible without network, timestamp/accuracy are honest, copy/share/call actions behave according to platform availability, and opening safety UI does not stop tracking.

- [ ] **Step 4: Verify track quality and battery/diagnostics**

Record continuity gaps, GPS accuracy behavior, off-route transition/recovery, process recovery, battery start/end, approximate test duration and diagnostic bundle reference.

- [ ] **Step 5: Mark field gate outcome**

`PASS` only if no P0/P1 occurs. P0/P1 includes lost/corrupt activity, unsafe/misleading critical route state, broken recovery, duplicate rewards, inability to complete/sync/validate, unauthorized access or unusable emergency information.

If FAIL, keep readiness `MANUAL/BLOCKED`, fix on a new commit and repeat with the new SHA. Never carry forward the failed candidate's manual evidence.

- [ ] **Step 6: Promote Cuadros and candidate only after successful evidence**

Complete publication state according to configured policy:

```text
FIELD_TEST_PENDING -> ADVENTURE_READY -> PUBLICADA
```

Then record manual evidence in RC1 Control Center for the exact candidate SHA.

- [ ] **Step 7: Commit field-test record**

```bash
git add docs/field-tests/rc1-cuadros-end-to-end.md docs/rc1/integration-ledger.md
git commit -m "test: record RC1 Cuadros physical validation"
```

Because this documentation commit changes SHA after the tested APK, the document must explicitly reference the tested candidate SHA. Do not claim the documentation commit itself was the APK candidate.

---

### Task 20: Final RC1 audit and controlled merge readiness

**Files:**
- Create: `docs/rc1/release-audit.md`
- Update: `docs/rc1/integration-ledger.md`

**Interfaces:**
- Produces a release audit, not an automatic merge.

- [ ] **Step 1: Check every Master Spec requirement against implementation evidence**

The audit must explicitly cover:

```text
mobile flow
auth/privacy
canonical catalog
Cuadros publication/version
GPS/background/recovery
offline package/end-to-end
checkpoints/discoveries/camera
weather
safety/emergency
server validation
progression/rankings/rewards
community minimum
Admin/Route Master
readiness Control Center
observability
staging
ARM64 candidate
physical field test
```

For each: record `READY | BLOCKED | MANUAL | NOT_APPLICABLE`, evidence reference and candidate SHA where applicable.

- [ ] **Step 2: Search for forbidden release shortcuts**

```bash
git grep -n "MODO SIMULADO\|coming-soon\|dev-bedmar-cuadros\|sendero-de-cuadros-dev" -- apps packages supabase || true
git grep -n "service_role" -- apps || true
git diff --check
git status --short
```

Any production-reachable simulation/coming-soon state for required RC1 navigation is a blocker. `service_role` in mobile/browser runtime code is a blocker.

- [ ] **Step 3: Re-run complete automatic gate on integration HEAD**

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm run check:admin
supabase db start
supabase db reset
supabase test db
supabase stop --no-backup
cd apps/mobile
pnpm exec expo prebuild --platform android --no-install --clean
cd ../..
git diff --check
```

- [ ] **Step 4: Distinguish tested APK SHA from documentation-only HEAD**

The final audit names the exact code SHA used to build/test the APK. If code/runtime files changed after the physical test, create a new APK candidate and repeat Task 19. Documentation-only commits may reference the tested SHA but do not silently rebrand themselves as tested binaries.

- [ ] **Step 5: Commit audit**

```bash
git add docs/rc1/release-audit.md docs/rc1/integration-ledger.md
git commit -m "docs: complete RC1 release audit"
```

- [ ] **Step 6: Only then prepare a PR from `integration/rc1` toward `main`**

The PR must state outstanding `BLOCKED/MANUAL` gates if any. Do not merge while any required RC1 gate is not `READY`.

---

## Plan Self-Review

### Spec coverage

- Architecture/integration strategy: Tasks 1–6.
- Canonical catalog and mobile route truth: Tasks 5, 7, 17.
- Offline/versioning: Task 9.
- Server validation/progression/rewards: Task 8.
- Weather: Task 10.
- Safety/emergency: Task 11.
- Camera/private media/community separation: Task 12.
- Observability: Task 13.
- Final navigation/progression screens: Task 14.
- Super Admin readiness control: Task 15.
- Environments/staging: Task 16.
- Real Cuadros content: Task 17.
- CI/ARM64: Task 18.
- Physical Android field gate: Task 19.
- Final audit/merge readiness: Task 20.

### Non-goals preserved

- Mi Olivo visual/ecommerce/QR does not become a gate.
- Turn-by-turn voice/recalculation is not added.
- Live family tracking, fall detection, automatic SOS, AR, AI species recognition and advanced social features are not added.
- iOS is not a blocker for RC1.
- Web promotional completion is not a blocker for the hiking-engine RC1.

### Type/authority consistency

- Mobile never writes final verification/reward authority.
- `VERIFIED` is the only validation state that can consolidate final progression/rewards.
- `FLAGGED`/`REJECTED` remain unrewarded.
- Route and activity identity are stable; versions preserve historical context.
- Manual gates are candidate-SHA-bound and cannot be faked by CI.
- Offline/network absence does not block an already-downloaded valid adventure package.

### Execution order rule

Execute tasks in order. A task's blocking regression is fixed before starting the next task. Do not accumulate known red gates across multiple integration merges.