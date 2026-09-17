# Mágina Aventura RC1 Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidar las ramas existentes de Mágina Aventura en `integration/rc1`, cerrar los huecos de la Master Spec y producir una candidata Android RC1 verificable en campo con Cuadros/Bedmar como piloto canónico.

**Architecture:** La integración parte de la candidata móvil pre-beta y suma capacidades por cadenas completas, evitando volver a fusionar PRs ancestros. Mobile registra evidencia y funciona offline; Supabase/servidor valida y consolida; Admin gestiona contenido/publicación; `packages/domain` mantiene reglas puras e idempotentes. Cada tarea termina con un gate verificable antes de aceptar la siguiente.

**Tech Stack:** Node 22, pnpm 10, TypeScript 6, Expo SDK 57, React Native 0.86, Expo Router, Expo Location/Task Manager/SQLite, MapLibre React Native 11, Supabase Auth/PostgreSQL/PostGIS/Storage/RLS/RPC, Vitest, pgTAP, GitHub Actions, Android Gradle ARM64 release.

**Spec:** `docs/superpowers/specs/2026-09-17-magina-aventura-rc1-master-design.md`

## Global Constraints

- No modificar `main` directamente.
- Base móvil RC1: `feat/prebeta-ux-polish-v1`, SHA auditado `044d89cb12cb20f683d99524ea5f946276e3a045`.
- Cuadros/Bedmar es el piloto canónico. El Peralejo/Cambil puede seguir como fixture técnico, nunca como sustituto del gate final.
- No fabricar geometría, checkpoints, descubrimientos, desnivel, agua, seguridad, clima ni recompensas para superar gates.
- Sólo `VERIFIED` consolida XP, logros, retos, ranking y aceitunas. `FLAGGED` y `REJECTED` no recompensan.
- Una aventura con paquete `READY` debe poder iniciar, continuar, pausar, reanudar y terminar sin Internet.
- Track, ubicación precisa y fotografías nacen privados.
- Una `route_version` publicada y un track GPS original no se sobrescriben destructivamente.
- Mi Olivo visual, wallet comercial, catálogo de premios, partners/almazaras, reservas y QR no bloquean RC1.
- El APK de prueba física debe ser release ARM64 producido por CI para un SHA exacto.
- Los gates manuales no pueden satisfacerse con evidencia de CI.
- Si una rama auditada cambia de SHA antes de ejecutarse este plan, revisar su delta contra la Master Spec antes de integrarla.

## Audited Integration Inputs

| Capability | Branch / PR | SHA auditado |
|---|---|---|
| Mobile pre-beta | `feat/prebeta-ux-polish-v1` / #34 | `044d89cb12cb20f683d99524ea5f946276e3a045` |
| Auth/Profile + Community read chain | `feat/04-community-mobile` / #6 | `9db861b34a96075bc8e10bb58230e14aa2a50f30` |
| Exploration → progression → rewards | `feat/07d-reward-delivery-plan` / #23 | `249f1d8876a0b26a2864ce26794b0fa26afb266e` |
| Beta readiness | `feat/08a-beta-readiness` / #25 | `94b6536e9f037e628cd968b9f1de72529f3dfa25` |
| Canonical catalog | `feat/adventure-catalog-v1` / #28 | `d252a9d4da3dec4e0e96556e47b4083c12a23f78` |
| Admin base | `feat/admin-v1` / #8 | `df697eb38a7b109c0f4aaf9b81314eaba1d54e84` |
| Admin branding | `feat/admin-official-brand-v1` / #29 | `f12e95857e573e4ddf51969321f027607010804c` |
| Admin discoveries | `feat/admin-route-master-discoveries-v1` / #31 | `4f46876ac959f6124b5c56b9d788ddd622359073` |
| Admin catalog ingest | `feat/admin-catalog-ingest-v1` / #33 | `64fd5cd89448b32adae01239d4f66e72793c76d1` |
| ARM64 workflow change | PR #32 | `37dcb101a0860dbb230bb13864c288217cdc4402` |

---

### Task 1: Create `integration/rc1` and prove the baseline before merging anything

**Files:**
- Modify if needed: `.github/workflows/ci.yml`
- Modify if needed: `.github/workflows/android-preview.yml`
- Create: `docs/rc1/integration-ledger.md`

**Interfaces:**
- Produces an isolated `integration/rc1` branch.
- Produces a ledger that records source SHA, result SHA, automated status and manual gates.

- [ ] **Step 1: Create an isolated worktree at execution time**

Use `superpowers:using-git-worktrees`, then:

```bash
git fetch origin --prune
git rev-parse origin/feat/prebeta-ux-polish-v1
```

Expected audited SHA: `044d89cb12cb20f683d99524ea5f946276e3a045`.

If it differs:

```bash
git log --oneline 044d89cb12cb20f683d99524ea5f946276e3a045..origin/feat/prebeta-ux-polish-v1
git diff --stat 044d89cb12cb20f683d99524ea5f946276e3a045..origin/feat/prebeta-ux-polish-v1
```

Review the delta before continuing.

- [ ] **Step 2: Create the integration branch**

```bash
git switch -c integration/rc1 origin/feat/prebeta-ux-polish-v1
```

- [ ] **Step 3: Run the baseline gate**

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

Expected: all PASS. A red baseline is fixed before any merge.

- [ ] **Step 4: Verify the ARM64 workflow contract**

`.github/workflows/android-preview.yml` must contain:

```bash
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon
```

and a step that fails unless the APK contains only `arm64-v8a`.

- [ ] **Step 5: Add `integration/rc1` to CI/Android workflow branch triggers if absent**

Preserve all current triggers.

- [ ] **Step 6: Create the integration ledger using the actual HEAD**

```bash
head_sha="$(git rev-parse HEAD)"
mkdir -p docs/rc1
cat > docs/rc1/integration-ledger.md <<EOF
# RC1 Integration Ledger

| Order | Capability | Source branch | Audited source SHA | Result SHA | Automated gate | Manual gate | Notes |
|---:|---|---|---|---|---|---|---|
| 0 | Mobile pre-beta baseline | feat/prebeta-ux-polish-v1 | 044d89cb12cb20f683d99524ea5f946276e3a045 | ${head_sha} | READY after baseline gate | GPS/Cuadros field pending | RC1 starting point |
EOF
```

- [ ] **Step 7: Commit**

```bash
git add .github/workflows docs/rc1/integration-ledger.md
git commit -m "chore: establish RC1 integration line"
```

---

### Task 2: Merge the existing capability chains without duplicating ancestry

**Files:**
- Merge: `origin/feat/04-community-mobile`
- Merge: `origin/feat/07d-reward-delivery-plan`
- Merge: `origin/feat/08a-beta-readiness`
- Merge: `origin/feat/adventure-catalog-v1`
- Modify conflict resolutions only in affected files
- Modify: `docs/rc1/integration-ledger.md`

**Interfaces:**
- Community branch carries Auth/Profile + Community foundation ancestry.
- Reward-delivery branch carries exploration/collections/progression/ranking/reward ancestry.
- Catalog exposes `createCatalogReader(snapshot)` and canonical completeness/provenance logic.
- Readiness exposes candidate-SHA-bound `READY | BLOCKED | MANUAL | NOT_APPLICABLE` semantics.

- [ ] **Step 1: Verify branch heads and ancestry before merge**

```bash
git fetch origin --prune
git rev-parse origin/feat/04-community-mobile
git rev-parse origin/feat/07d-reward-delivery-plan
git rev-parse origin/feat/08a-beta-readiness
git rev-parse origin/feat/adventure-catalog-v1
git merge-base --is-ancestor origin/feat/02-platform-auth-geospatial origin/feat/04-community-mobile
git merge-base --is-ancestor origin/feat/03-community-foundation origin/feat/04-community-mobile
```

Expected ancestry checks: exit 0.

- [ ] **Step 2: Merge Community at its chain tip**

```bash
git merge --no-ff origin/feat/04-community-mobile -m "merge: integrate auth and RC1 community chain"
pnpm typecheck
pnpm test
supabase db reset
supabase test db
```

Preserve #34 mobile visual/presenter structure during conflicts; inject Community through adapters/components rather than restoring older screens wholesale.

- [ ] **Step 3: Merge exploration/progression/rewards once at #23 tip**

```bash
git merge --no-ff origin/feat/07d-reward-delivery-plan -m "merge: integrate RC1 exploration progression and rewards domain"
pnpm typecheck
pnpm test
```

Do not separately merge PRs #7, #9, #11, #13, #14, #15, #18, #19, #20, #21 or #22.

- [ ] **Step 4: Add a regression test proving failed activity verification cannot produce reward delivery**

Create `packages/domain/src/rewards/rc1-reward-gate.integration.test.ts` using the exact existing `buildRewardDeliveryPlan` API:

```ts
import { describe, expect, it } from 'vitest';
import { buildRewardDeliveryPlan } from './reward-delivery';

it('produces no ledger or outbox work when activity verification fails', () => {
  const result = buildRewardDeliveryPlan({
    validation: {
      userId: 'user-1',
      activityId: 'activity-1',
      verifiedAt: '2026-09-17T10:00:00.000Z',
      evidence: {
        'activity-verification': false,
        'route-integrity': true,
        'location-integrity': true,
        'account-eligibility': true,
        'abuse-screen': true,
      },
      policy: {
        requiredChecks: [
          'activity-verification',
          'route-integrity',
          'location-integrity',
          'account-eligibility',
          'abuse-screen',
        ],
      },
      alreadyCommittedActivityIds: [],
    },
    progression: { crossedLevels: [], completedChallenges: [] },
    challengeRewards: [],
    multiplier: 1,
    rounding: 'floor',
    alreadyGrantedSourceKeys: [],
    occurredAt: '2026-09-17T10:00:00.000Z',
    alreadyPublishedEventKeys: [],
  });

  expect(result.validation.approved).toBe(false);
  expect(result.shouldPersist).toBe(false);
  expect(result.ledgerEntries).toEqual([]);
  expect(result.outboxEvents).toEqual([]);
});
```

Run:

```bash
pnpm --filter @magina-aventura/domain test
```

- [ ] **Step 5: Merge readiness**

```bash
git merge --no-ff origin/feat/08a-beta-readiness -m "merge: integrate RC1 beta readiness"
```

Extend `ANDROID_INTERNAL_BETA_PROFILE.requiredGateIds` with:

```ts
'canonical-catalog',
'cuadros-adventure-ready',
'offline-end-to-end',
'server-validation',
'weather-snapshot',
'safety-emergency',
'observability',
'admin-control-center',
'arm64-release',
'staging-smoke',
```

Keep `community-write` and `reward-qr-redemption` deferred. Add a test showing evidence for SHA `old-sha` cannot satisfy a gate for `new-sha`, and CI evidence cannot satisfy a manual gate.

- [ ] **Step 6: Merge canonical catalog**

```bash
git merge --no-ff origin/feat/adventure-catalog-v1 -m "merge: integrate canonical Sierra Magina catalog"
pnpm --filter @magina-aventura/domain test
pnpm --filter @magina-aventura/geo test
pnpm --filter @magina-aventura/route-import test
pnpm typecheck
pnpm test
```

Resolve `packages/*/src/index.ts` conflicts additively so activity/progression and catalog APIs are all exported.

- [ ] **Step 7: Verify no development fixture can satisfy Cuadros readiness**

```bash
git grep -n "dev-bedmar-cuadros\|sendero-de-cuadros-dev" -- apps packages supabase || true
```

A dev fixture may remain isolated for tests/dev, but must not feed production publication/readiness.

- [ ] **Step 8: Update ledger and commit any conflict/test changes**

```bash
git add .
git commit -m "fix: reconcile RC1 capability chains" || true
```

`|| true` is acceptable only because a clean tree after merge needs no extra conflict-resolution commit; any failing test remains a blocker.

---

### Task 3: Consolidate the Admin branches into one RC1 control plane

**Files:**
- Merge: `origin/feat/admin-v1`
- Merge: `origin/feat/admin-official-brand-v1`
- Merge: `origin/feat/admin-route-master-discoveries-v1`
- Merge: `origin/feat/admin-catalog-ingest-v1`
- `apps/admin/**`
- `supabase/migrations/**`
- `supabase/tests/database/**`
- Modify: `docs/rc1/integration-ledger.md`

**Interfaces:**
- One Route Master owns route identity/version/content/geometry/readiness.
- Canonical import is evidence feeding the same route model, not a second publication system.
- Commercial/QR modules may remain in code but are hidden/deferred from the RC1 default flow.

- [ ] **Step 1: Merge Admin base then siblings**

```bash
git merge --no-ff origin/feat/admin-v1 -m "merge: integrate RC1 admin platform"
git merge --no-ff origin/feat/admin-official-brand-v1 -m "merge: integrate admin branding"
git merge --no-ff origin/feat/admin-route-master-discoveries-v1 -m "merge: integrate admin discovery editor"
git merge --no-ff origin/feat/admin-catalog-ingest-v1 -m "merge: integrate admin catalog ingest"
```

- [ ] **Step 2: Resolve shared Route Master files by preserving all capabilities**

The final Route Master must retain:

```text
base editorial/versioning workflow
track/map import and provenance
discovery editor
official branding
canonical catalog evidence panel
publication/readiness gates
safety/media/audit capabilities
```

Do not resolve a conflict by choosing one whole sibling file if that discards another sibling's feature.

- [ ] **Step 3: Check migration uniqueness without rewriting shared history**

```bash
find supabase/migrations -maxdepth 1 -type f -printf '%f\n' | sort | uniq -d
```

Expected: no duplicate filenames. If a forward fix is needed, add a new `20260917...` migration; do not rewrite already-audited migrations.

- [ ] **Step 4: Keep commercial modules outside RC1 navigation/gates**

Use the existing capability/feature-flag mechanism. Default RC1 Admin navigation prioritizes Dashboard, Route Master, Actividades, Comunidad/Moderación, Progresión, Seguridad/Notificaciones, Configuración/Auditoría and the Control Center added later.

- [ ] **Step 5: Run Admin/database gate**

```bash
pnpm run check:admin
pnpm test
supabase db reset
supabase test db
```

Required: Route Master discovery test green, catalog ingest tests green, RLS/audit tests green, no `service_role` in browser runtime configuration.

- [ ] **Step 6: Update ledger**

Record the four Admin source SHAs and the resulting integration SHA.

---

### Task 4: Replace the pre-beta fixture production path with one canonical mobile route view

**Files:**
- Create: `apps/mobile/src/features/routes/mobile-route-view.ts`
- Create: `apps/mobile/src/features/routes/catalog-route-adapter.ts`
- Create: `apps/mobile/src/features/routes/catalog-route-adapter.test.ts`
- Create: `apps/mobile/src/features/routes/route-repository.ts`
- Create: `apps/mobile/src/features/routes/use-route-catalog.ts`
- Modify: `apps/mobile/app/index.tsx`
- Modify: route detail screen under `apps/mobile/app/routes/[slug]`
- Modify: `apps/mobile/app/routes/[slug]/prepare.tsx`
- Keep `apps/mobile/src/features/routes/fixtures.ts` dev/test-only

**Interfaces:**

```ts
export type MobileOperationalStatus = 'OPEN' | 'CAUTION' | 'RESTRICTED' | 'CLOSED' | 'UNKNOWN';

export interface MobileRouteView {
  id: string;
  slug: string;
  title: string;
  municipalityNames: string[];
  distanceKm: number | null;
  elevationGainM: number | null;
  durationMinutes: number | null;
  difficulty: 'easy' | 'moderate' | 'hard' | null;
  description: string | null;
  operationalStatus: MobileOperationalStatus;
  adventureReady: boolean;
  routeVersionId: string | null;
  geometryVersion: number | null;
  offlineAvailable: boolean;
}

export interface MobileRouteRepository {
  list(): Promise<MobileRouteView[]>;
  bySlug(slug: string): Promise<MobileRouteView | null>;
}
```

- [ ] **Step 1: Write adapter RED tests**

Use a canonical item with unknown elevation/duration and assert those fields remain `null`. Use a closed route and assert `operationalStatus === 'CLOSED'` and `adventureReady === false`. Use a three-municipality route and preserve all municipality names.

- [ ] **Step 2: Implement the adapter from canonical/published server read model**

Rules:
- unknown is `null`, never fabricated `0`;
- `adventureReady` requires a published version + valid geometry/offline readiness, not catalog presence alone;
- `CLOSED`/`RESTRICTED` overrides start readiness;
- reward preview is not part of this canonical read contract.

- [ ] **Step 3: Implement the production repository boundary**

Use Supabase published route/catalog views/RPCs created by the integrated backend. Keep fixtures injectable only in test/dev configuration.

- [ ] **Step 4: Replace Home fixture source while preserving #34 UX**

`apps/mobile/app/index.tsx` keeps search/filter/empty/loading behavior but obtains data from `useRouteCatalog()`.

- [ ] **Step 5: Route detail and preparation use the same repository identity/version**

A slug must resolve to the same stable route and published `routeVersionId` across Home → Detail → Prepare → Adventure.

- [ ] **Step 6: Run tests and commit**

```bash
pnpm --filter @magina-aventura/mobile test
pnpm typecheck
pnpm test
git add apps/mobile
git commit -m "feat: connect mobile to canonical route truth"
```

---

### Task 5: Persist validation, progression, ledger and outbox with server authority

**Files:**
- Create: `packages/contracts/src/activity-validation.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `supabase/migrations/202609170001_rc1_activity_validation.sql`
- Create: `supabase/migrations/202609170002_rc1_verified_progression.sql`
- Create: `supabase/tests/database/rc1_activity_validation_test.sql`
- Create: `supabase/tests/database/rc1_verified_progression_test.sql`
- Create `supabase/functions/validate-activity/index.ts` only if the merged domain cannot be executed safely through SQL/RPC alone

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

- [ ] **Step 1: Write pgTAP RED authority tests**

Assert an authenticated mobile user cannot:
- set an activity to `VERIFIED`;
- insert arbitrary final XP/stat rows;
- insert arbitrary olive ledger entries;
- write final leaderboard scores.

- [ ] **Step 2: Persist validation decisions without rewriting raw evidence**

Store state, reason codes, policy version, decision time and audit metadata. Preserve original track/events/checkpoint/discovery evidence.

- [ ] **Step 3: Implement one privileged validation entry point**

It loads activity evidence and route-version policy, evaluates structural/route/location/account/abuse checks and returns `VERIFIED`, `FLAGGED`, `REJECTED` or `already-committed` behavior.

- [ ] **Step 4: Consolidate a verified activity atomically**

Within one database transaction or equivalent server-atomic operation persist:

```text
validation decision
verified stats
XP/level projection
badges
challenge progress
ranking contribution
olive ledger rows
integration outbox rows
```

Any failure rolls back the final consolidation.

- [ ] **Step 5: Prove idempotency**

Process the same verified activity twice and assert:
- one committed activity result;
- one XP contribution;
- no duplicated badge/challenge completion;
- unique olive `source_key` entries;
- unique outbox event keys;
- second call is an idempotent no-op/`already-committed`.

- [ ] **Step 6: Run gate and commit**

```bash
pnpm --filter @magina-aventura/domain test
supabase db reset
supabase test db
pnpm typecheck
git add packages/contracts supabase
git commit -m "feat: persist verified RC1 progression atomically"
```

---

### Task 6: Make offline packages atomic, versioned and activity-bound

**Files:**
- Create: `packages/contracts/src/offline-package.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/offline-sync/src/package-manifest.ts`
- Create: `packages/offline-sync/src/package-manifest.test.ts`
- Create/modify package storage/downloader files under `apps/mobile/src/offline/`
- Add a forward Supabase migration only if the integrated map-asset schema lacks package identity/hash/version fields

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

- [ ] **Step 1: Write RED manifest tests**

Reject wrong schema version, malformed hash, missing route version and mismatched route/geometry identity.

- [ ] **Step 2: Implement atomic package installation**

State machine:

```text
NOT_DOWNLOADED -> DOWNLOADING -> VERIFYING -> READY
                                  -> FAILED
```

If an old package is `READY`, keep it active until the new package verifies successfully.

- [ ] **Step 3: Bind activity start to exact route/package version**

Persist `routeVersionId` + `packageId` when starting. A later route update cannot rewrite the activity context.

- [ ] **Step 4: Protect evidence from cleanup**

Never auto-evict active-route package, active/unverified activity, unsynced track/events or media pending upload.

- [ ] **Step 5: Test interrupted/corrupt/stale update behavior**

Required tests:
- interrupted download keeps previous package usable;
- bad hash never becomes `READY`;
- valid replacement is used only for future activities;
- current activity remains pinned to the version it started with.

- [ ] **Step 6: Run gate and commit**

```bash
pnpm --filter @magina-aventura/offline-sync test
pnpm --filter @magina-aventura/mobile test
pnpm typecheck
git add packages/contracts packages/offline-sync apps/mobile/src/offline supabase
git commit -m "feat: version RC1 offline adventure packages"
```

---

### Task 7: Add weather snapshots and route safety without coupling them to GPS

**Files:**
- Create: `packages/contracts/src/weather.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `supabase/migrations/202609170003_weather_snapshots.sql`
- Create: `supabase/tests/database/weather_snapshots_test.sql`
- Create: `supabase/functions/weather-refresh/index.ts`
- Create: `apps/mobile/src/features/weather/weather-presenter.ts`
- Create: `apps/mobile/src/features/weather/weather-presenter.test.ts`
- Create: `apps/mobile/src/features/safety/emergency-presenter.ts`
- Create: `apps/mobile/src/features/safety/emergency-presenter.test.ts`
- Create/wire a Safety/Help screen inside the current Expo Router adventure flow
- Modify route detail, prepare and active-adventure screens

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

- [ ] **Step 1: Write weather RED tests**

Test current snapshot, stale snapshot, missing snapshot and provider failure. Stale data must render explicit age/status; provider failure never blocks adventure/GPS.

- [ ] **Step 2: Implement server-only provider adapter**

Only `weather-refresh` handles AEMET/provider-specific credentials and payloads. Mobile receives normalized `weather-snapshot.v1`.

- [ ] **Step 3: Persist readable authoritative snapshots**

Clients can read route snapshots under RLS but cannot forge authoritative snapshots.

- [ ] **Step 4: Add latest available weather to offline package content/manifest**

No weather is a valid package state; display “no current weather” honestly.

- [ ] **Step 5: Write emergency presenter RED tests**

With a valid last position, output formatted coordinates, timestamp, accuracy and optional altitude. With no position, expose unavailable state and never fabricate coordinates.

- [ ] **Step 6: Implement Safety/Help UX**

Show high-contrast coordinates, accuracy/timestamp, route/activity identity, call action, copy coordinates and share action when supported. Opening it must not stop tracking. Do not display gamification UI there.

- [ ] **Step 7: Enforce operational status at preparation**

Online preflight refreshes status. `CLOSED` blocks start; `RESTRICTED` follows configured policy; `CAUTION` warns. Offline uses last known status plus visible timestamp.

- [ ] **Step 8: Run gate and commit**

```bash
pnpm test
supabase db reset
supabase test db
pnpm typecheck
git add packages/contracts supabase apps/mobile
git commit -m "feat: add RC1 weather and safety flow"
```

---

### Task 8: Add private-first camera/media and diagnostics/observability

**Files:**
- Create: `apps/mobile/src/features/media/activity-media.ts`
- Create: `apps/mobile/src/features/media/activity-media.test.ts`
- Create/wire camera UI under `apps/mobile/src/features/media/`
- Create: `supabase/migrations/202609170004_activity_media.sql`
- Create: `supabase/tests/database/activity_media_test.sql`
- Create: `packages/contracts/src/diagnostics.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `apps/mobile/src/diagnostics/activity-diagnostics.ts`
- Create: `apps/mobile/src/diagnostics/activity-diagnostics.test.ts`
- Create: `apps/mobile/src/diagnostics/support-bundle.ts`
- Create Admin activity-health presenter/test using the existing Admin module pattern

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

- [ ] **Step 1: Write private-media RED tests**

A newly captured photo is `PRIVATE` and creates no community publication. Publishing is a separate explicit operation.

- [ ] **Step 2: Implement local-first media records**

Photos work offline and can link to activity/discovery/checkpoint. Media upload failure never blocks track/activity sync.

- [ ] **Step 3: Protect public media metadata**

Public derivative/upload strips unnecessary GPS EXIF/location metadata. Internal activity relation remains protected by RLS.

- [ ] **Step 4: Add explicit Community publication adapter**

Community publication references approved media but is a distinct record. Hiding/removing the public post does not automatically destroy private activity evidence.

- [ ] **Step 5: Write diagnostic-event RED tests**

Cover START, BACKGROUND, GPS_LOST, GPS_RECOVERED, OFF_ROUTE, SYNC_ATTEMPT, SYNC_ACK, SYNC_ERROR and RECOVERY. Assert no auth token/key fields are serialized.

- [ ] **Step 6: Implement bounded local diagnostics and sanitized support bundle**

Diagnostics explain the activity; they do not replace track persistence. Support bundle includes version/SHA/environment/device metadata available to the app, activity state, event timeline and sync status. Raw track inclusion defaults to false.

- [ ] **Step 7: Add Admin activity-health summary**

Show pending validation, flagged/rejected, sync failures and GPS diagnostic anomalies. Exact track access remains privileged.

- [ ] **Step 8: Run gate and commit**

```bash
pnpm test
pnpm run check:admin
supabase db reset
supabase test db
pnpm typecheck
git add apps packages/contracts supabase
git commit -m "feat: add private media and RC1 diagnostics"
```

---

### Task 9: Activate final mobile tabs and build the Admin RC1 Control Center

**Files:**
- Modify: `apps/mobile/src/features/prebeta/prebeta-ux.ts`
- Modify: `apps/mobile/src/features/prebeta/prebeta-ux.test.ts`
- Create/wire Expo Router screens for Retos, Colecciones, Ranking, Perfil and Historial
- Create: `apps/admin/src/core/rc1-control-center.mjs`
- Create: `apps/admin/tests/rc1-control-center.test.mjs`
- Modify Admin navigation/shell
- Create: `supabase/migrations/202609170005_rc1_readiness_evidence.sql`
- Create: `supabase/tests/database/rc1_readiness_evidence_test.sql`

**Interfaces:**
- Bottom navigation final order: `Rutas · Retos · Colecciones · Ranking · Perfil`.
- Control Center stores candidate-bound evidence and renders `READY | BLOCKED | MANUAL | NOT_APPLICABLE`.

- [ ] **Step 1: Replace bottom-nav `coming-soon` tests with concrete routes**

Use exact final paths:

```ts
expect(resolveBottomNavSelection('Rutas')).toEqual({ kind: 'navigate', href: '/' });
expect(resolveBottomNavSelection('Retos')).toEqual({ kind: 'navigate', href: '/challenges' });
expect(resolveBottomNavSelection('Colecciones')).toEqual({ kind: 'navigate', href: '/collections' });
expect(resolveBottomNavSelection('Ranking')).toEqual({ kind: 'navigate', href: '/ranking' });
expect(resolveBottomNavSelection('Perfil')).toEqual({ kind: 'navigate', href: '/profile' });
```

- [ ] **Step 2: Implement read surfaces from verified server state**

Retos, colecciones, ranking and profile totals use consolidated verified data. Pending activity may show a separate provisional state but cannot inflate final totals/ranking.

- [ ] **Step 3: Add history validation states**

History rows visibly distinguish `SYNC_PENDING`, `VALIDATING`, `VERIFIED`, `FLAGGED`, `REJECTED`.

- [ ] **Step 4: Write readiness evidence security RED tests**

Anonymous/mobile clients cannot forge evidence. CI evidence cannot be stored as manual evidence. Manual evidence requires authorized Admin action.

- [ ] **Step 5: Implement candidate-bound readiness evidence**

Persist `gate_id`, `candidate_sha`, `kind`, `passed`, `reference`, `recorded_at`, `actor`. Keep old evidence for audit but filter readiness by exact current SHA.

- [ ] **Step 6: Implement Control Center view**

Display at minimum:

```text
candidate SHA
APK artifact/hash
staging environment
canonical catalog
Cuadros ADVENTURE_READY
offline end-to-end
GPS runtime
physical GPS field gate
server validation
weather
safety/emergency
observability
Admin smoke
P0/P1 blockers
```

- [ ] **Step 7: Run gate and commit**

```bash
pnpm --filter @magina-aventura/mobile test
pnpm run check:admin
supabase db reset
supabase test db
pnpm typecheck
pnpm test
git add apps supabase
git commit -m "feat: activate RC1 navigation and control center"
```

---

### Task 10: Separate runtime environments and validate staging without secrets in clients

**Files:**
- Modify: `apps/mobile/src/backend/supabase-config.ts`
- Modify its existing test file
- Modify: `apps/admin/config.js` and existing config generator/guard files
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/android-preview.yml`
- Create: `docs/rc1/staging-runbook.md`

**Interfaces:**
- Exact environment identifiers: `dev`, `staging`, `production`.
- Mobile/browser receive only public runtime configuration; privileged secrets remain server/CI-side.

- [ ] **Step 1: Write config RED tests**

Reject missing environment identifier, malformed public Supabase URL/key and privileged-key-like client configuration.

- [ ] **Step 2: Implement explicit environment configuration**

Every diagnostic/support bundle and candidate record includes one of `dev | staging | production`.

- [ ] **Step 3: Verify clean database recreation**

```bash
supabase db reset
supabase test db
```

No manual SQL/editor operation counts as deployment readiness.

- [ ] **Step 4: Write exact staging smoke sequence**

`docs/rc1/staging-runbook.md` must include:

```text
Auth signup/login
catalog read
published route read
Cuadros read when ready
offline manifest fetch
activity upload
server validation
progression read
Admin login
Route Master read
RC1 Control Center read
community public read
```

- [ ] **Step 5: Run gate and commit**

```bash
pnpm test
pnpm typecheck
pnpm run check:admin
git add apps .github docs/rc1/staging-runbook.md
git commit -m "chore: separate RC1 runtime environments"
```

---

### Task 11: Promote Cuadros/Bedmar through real content, version and offline gates

**Files:**
- Create: `docs/field-tests/cuadros-rc1-content-validation.md`
- Data changes flow through the integrated Admin/import/versioning system; commit only sourced migrations/seeds when they are actually required

**Interfaces:**
- One stable Cuadros route identity.
- Published route version references verified geometry/content/offline package.

- [ ] **Step 1: Create the content evidence checklist before entering data**

For each item record source/reference and one of `VERIFIED | PENDING | NOT_APPLICABLE`:

```text
canonical route identity
track/geometry source
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
field validation
```

- [ ] **Step 2: Import the real track through Route Master**

Use existing GPX/KML/GeoJSON tooling. Compute metrics from geometry. Record provenance. Do not manually invent metrics.

- [ ] **Step 3: Add checkpoints/discoveries only with verified coordinates/content**

Every published point belongs to the correct route version and has provenance/editorial evidence.

- [ ] **Step 4: Generate and verify the offline package**

It contains exact route version, geometry, checkpoints, discoveries, safety snapshot, latest available weather snapshot if present, map assets and manifest hash.

- [ ] **Step 5: Reach pre-field lifecycle state only**

Before physical validation the expected maximum is:

```text
BORRADOR -> REVISIÓN -> CONTENIDO_VERIFICADO -> FIELD_TEST_PENDING
```

Do not claim `ADVENTURE_READY`/`PUBLICADA` until Task 12 physical evidence passes if the configured publication policy requires it.

- [ ] **Step 6: Commit the evidence document**

```bash
git add docs/field-tests/cuadros-rc1-content-validation.md
git commit -m "docs: record Cuadros RC1 content validation"
```

---

### Task 12: Produce the ARM64 candidate, execute the physical Cuadros gate, and audit RC1

**Files:**
- `.github/workflows/ci.yml`
- `.github/workflows/android-preview.yml`
- Create: `docs/field-tests/rc1-cuadros-end-to-end.md`
- Create: `docs/rc1/release-audit.md`
- Modify: `docs/rc1/integration-ledger.md`

**Interfaces:**
- Candidate identity = source SHA + APK SHA-256 + staging environment + route version + offline package identity.
- Manual field evidence is valid only for that candidate SHA.

- [ ] **Step 1: Run the full automatic gate at intended candidate HEAD**

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

- [ ] **Step 2: Push the candidate and use the CI-generated ARM64 release**

Do not use a local rebuild for the field gate. Record source SHA, workflow run, artifact identifier/name, APK SHA-256, APK size, environment, Cuadros route version and offline package id/hash in the Control Center/field record.

- [ ] **Step 3: Keep manual gates manual**

Import automatic evidence only for automatic gates. GPS/Cuadros physical gate remains `MANUAL` until performed.

- [ ] **Step 4: Execute the physical critical journey on the exact CI APK**

```text
install APK
onboarding/account
find Cuadros
route detail
download and verify offline package
preparation checks
start adventure
walk with real GPS
lock screen for at least 5 minutes
background/switch apps
lose network / airplane mode
reach checkpoint
trigger discovery
take private photo
safely deviate enough to exercise configured off-route logic
rejoin route
pause/resume
force-close/reopen and recover when safe to test
finish while offline
relaunch and confirm summary persists
restore network
sync
server validation
confirm exactly one verified activity
confirm final progression and olive result once
confirm history/profile/ranking/collection updates
```

- [ ] **Step 5: Exercise Safety/Help during the route**

Confirm coordinates display without network, timestamp/accuracy are honest, actions behave according to platform availability, and opening the screen does not stop tracking.

- [ ] **Step 6: Record quality/battery/diagnostics**

Record device/Android version, duration, battery start/end, continuity gaps, GPS accuracy behavior, off-route transition/recovery, process recovery and support-bundle reference.

- [ ] **Step 7: Apply severity gate**

P0/P1 blocks RC1. P0/P1 includes lost/corrupt activity, broken background recovery, unsafe/misleading critical route state, duplicate rewards, inability to finish/sync/validate, unauthorized access or unusable emergency information.

A failed candidate keeps field readiness `MANUAL/BLOCKED`; fix on a new code SHA and repeat the field gate. Manual evidence never transfers to a new code SHA.

- [ ] **Step 8: Promote Cuadros after successful manual evidence**

Complete configured lifecycle:

```text
FIELD_TEST_PENDING -> ADVENTURE_READY -> PUBLICADA
```

Record authorized manual evidence for the exact tested candidate.

- [ ] **Step 9: Write final release audit**

`docs/rc1/release-audit.md` records `READY | BLOCKED | MANUAL | NOT_APPLICABLE` plus evidence for:

```text
mobile flow
auth/privacy
canonical catalog
Cuadros route/version/offline package
GPS/background/recovery
offline end-to-end
checkpoints/discoveries/camera
weather
safety/emergency
server validation
progression/rankings/rewards
community minimum
Admin/Route Master
RC1 Control Center
observability
staging
ARM64 candidate
physical field gate
```

- [ ] **Step 10: Search for release shortcuts**

```bash
git grep -n "MODO SIMULADO\|coming-soon\|dev-bedmar-cuadros\|sendero-de-cuadros-dev" -- apps packages supabase || true
git grep -n "service_role" -- apps || true
git diff --check
git status --short
```

Any production-reachable simulation/coming-soon path for required RC1 functionality is a blocker. Any `service_role` in mobile/browser runtime code is a blocker.

- [ ] **Step 11: Distinguish tested binary SHA from documentation commits**

If any runtime/code/config file changes after the physical test, build a new APK and repeat the physical gate. Documentation-only commits may reference the tested code SHA but are not themselves treated as tested binaries.

- [ ] **Step 12: Commit evidence/audit and prepare the PR only when required gates are READY**

```bash
git add docs/field-tests/rc1-cuadros-end-to-end.md docs/rc1/release-audit.md docs/rc1/integration-ledger.md
git commit -m "test: record RC1 Cuadros validation and release audit"
```

Only then prepare `integration/rc1 -> main`. Do not merge while any required gate is `BLOCKED` or `MANUAL`.

---

## Self-Review Result

### Spec coverage

- Integration/branch strategy: Tasks 1–3.
- Canonical route truth/mobile: Task 4.
- Validation/progression/rewards: Task 5.
- Offline/versioning: Task 6.
- Weather + route safety + emergency: Task 7.
- Camera/privacy/community media + diagnostics: Task 8.
- Final mobile navigation + Admin readiness: Task 9.
- Dev/staging/production separation: Task 10.
- Verified Cuadros content: Task 11.
- ARM64/staging/physical field/release audit: Task 12.

### Scope guard

The plan does not add Mi Olivo visual/ecommerce/QR, turn-by-turn voice/recalculation, live family tracking, fall detection, automatic SOS, AR, AI species recognition, advanced social networking, iOS as an RC1 blocker or the promotional web as a hiking-engine release gate.

### Authority/type consistency

- `buildRewardDeliveryPlan` is the existing reward-domain gate used in Task 2.
- `VERIFIED` is the only path to final progression/rewards.
- Mobile never writes final validation/reward authority.
- Canonical route identity and published route versions remain distinct.
- Manual evidence is tied to exact candidate SHA.
- Offline remains a first-class execution path, not a cache-only optimization.

### Execution rule

Execute tasks in order. Fix every blocking regression before starting the next task; never accumulate known red gates across multiple merges.