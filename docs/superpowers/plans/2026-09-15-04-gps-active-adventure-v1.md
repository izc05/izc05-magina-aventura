# GPS + Aventura Activa V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir un motor GPS offline-first que registre una aventura real en Android, sobreviva a background/cierre de app, calcule métricas/progreso/off-route sobre la geometría oficial y sincronice después por lotes.

**Architecture:** Expo Location/Task Manager queda aislado detrás de un provider móvil. Toda la lógica de actividad vive en `packages/activity-engine` como TypeScript puro y consume helpers geoespaciales de `packages/geo`; el móvil persiste track + snapshots de forma transaccional en SQLite y rehidrata la sesión al arrancar. La red no forma parte del camino crítico: los lotes se encolan localmente y se suben después a Supabase de forma idempotente.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript 6, Expo Location, Expo Task Manager, Expo SQLite, MapLibre React Native 11, pnpm 10.15, Vitest, Supabase/PostgreSQL/PostGIS, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-15-gps-active-adventure-design.md`

## Global Constraints

- Rama de trabajo: `feat/gps-activity-v1`, base `feat/foundation-v1`; no tocar `main`.
- Perfil GPS V1: adaptativo equilibrado; no muestreo agresivo fijo a 1 Hz.
- Estado: `DRAFT -> ACTIVE -> PAUSED -> FINISHED -> VALIDATING -> VERIFIED | REJECTED`.
- Snapshot V1: cada 15 s o 10 muestras aceptadas, y siempre en cambios de estado.
- Off-route V1: corredor base 35 m, adaptativo según precisión; 3 muestras consecutivas para confirmar salida y 3 para confirmar recuperación.
- Una actividad queda fijada a `routeId` + `geometryVersion` al iniciarse.
- Track y ubicación son privados por defecto.
- La actividad debe poder llegar a `FINISHED` sin Internet.
- No inventar geometría, checkpoints ni coordenadas oficiales de Cuadros para hacer pasar demos/tests.
- Los fixtures geográficos unitarios son sintéticos y deben estar etiquetados como test.
- `packages/activity-engine` debe ser puro: sin `expo`, `react-native`, `@supabase`, `maplibre` ni APIs nativas.
- El frontend no concede XP, aceitunas ni recompensas; este plan termina en actividad local/finalizada y subida de datos, no en verificación/recompensas.
- La prueba física Android con pantalla bloqueada es un gate manual obligatorio antes de declarar cerrado el bloque V1.

---

## File Structure

### Shared contracts

- `packages/contracts/src/activity.ts` — tipos serializables que cruzan engine/mobile/backend.
- `packages/contracts/src/index.ts` — export del contrato de actividad.

### Pure activity engine

- `packages/activity-engine/package.json` — workspace package puro.
- `packages/activity-engine/tsconfig.json` — configuración TypeScript.
- `packages/activity-engine/src/config.ts` — reglas configurables de filtrado/snapshot/off-route.
- `packages/activity-engine/src/state-machine.ts` — transiciones de estado.
- `packages/activity-engine/src/filter-location.ts` — validación/calidad de muestras.
- `packages/activity-engine/src/metrics.ts` — distancia, tiempo, velocidad, desnivel inicial.
- `packages/activity-engine/src/route-progress.ts` — proyección a LineString y progreso.
- `packages/activity-engine/src/off-route.ts` — máquina de evidencia sostenida.
- `packages/activity-engine/src/engine.ts` — reducer/orquestador puro por muestra/acción.
- `packages/activity-engine/src/replay.ts` — replay determinista de tracks.
- `packages/activity-engine/src/index.ts` — API pública.
- `packages/activity-engine/src/*.test.ts` — TDD del motor.

### Mobile native/adapters

- `apps/mobile/src/activity/activity-store.ts` — interfaz del almacenamiento local.
- `apps/mobile/src/activity/sqlite-activity-store.ts` — implementación Expo SQLite.
- `apps/mobile/src/activity/location-provider.ts` — interfaz de ubicación.
- `apps/mobile/src/activity/expo-location-provider.ts` — foreground/background Expo Location.
- `apps/mobile/src/activity/background-location-task.ts` — `TaskManager.defineTask` en scope de módulo.
- `apps/mobile/src/activity/activity-controller.ts` — une provider + engine + store + snapshots.
- `apps/mobile/src/activity/activity-sync-queue.ts` — batches idempotentes locales.
- `apps/mobile/src/activity/use-active-adventure.ts` — hook UI para pantalla activa.
- `apps/mobile/src/activity/track-geojson.ts` — convierte muestras aceptadas a GeoJSON para MapLibre.
- `apps/mobile/app/adventure/[slug].tsx` — reemplaza simulación por estado real.
- `apps/mobile/app/routes/[slug]/prepare.tsx` — permisos/preflight/inicio de sesión.
- `apps/mobile/app/_layout.tsx` — bootstrap de recuperación si es necesario.
- `apps/mobile/app.json` — configuración nativa de background location.
- `apps/mobile/package.json` + `pnpm-lock.yaml` — dependencias Expo compatibles.

### Supabase upload boundary

- `supabase/migrations/202609150008_activity_tracking.sql` — sesiones + track batches privados + RLS.
- `supabase/tests/database/activity_tracking_test.sql` — contratos/RLS/idempotencia.

### CI/docs

- `.github/workflows/ci.yml` — añadir `packages/activity-engine/src` al boundary puro y conservar Android prebuild.
- `docs/field-tests/gps-active-adventure-v1.md` — checklist de prueba física Android y evidencia requerida.

---

### Task 1: Shared activity contracts + package scaffold

**Files:**
- Create: `packages/contracts/src/activity.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/activity-engine/package.json`
- Create: `packages/activity-engine/tsconfig.json`
- Create: `packages/activity-engine/src/index.ts`
- Test: `packages/activity-engine/src/contracts.test.ts`

**Interfaces:**
- Produces `ActivityState`, `LocationSample`, `ActivitySession`, `ActivitySnapshot`, `ActivityAction`, `ActivitySyncBatch`.
- Later tasks import these types only through `@magina-aventura/contracts`.

- [ ] **Step 1: Write the failing contract test**

```ts
import { describe, expect, it } from 'vitest';
import type { ActivitySession, LocationSample } from '@magina-aventura/contracts';

it('keeps an activity pinned to a route geometry version', () => {
  const session: ActivitySession = {
    activityId: 'activity-test-1',
    routeId: 'route-test-1',
    routeSlug: 'synthetic-route',
    geometryVersion: 3,
    state: 'ACTIVE',
    startedAt: '2026-09-15T10:00:00.000Z',
    pausedAt: null,
    finishedAt: null,
    lastProcessedSequence: 0,
    syncState: 'local',
  };

  const sample: LocationSample = {
    sequence: 1,
    timestamp: '2026-09-15T10:00:05.000Z',
    latitude: 37.0,
    longitude: -3.0,
    accuracyMeters: 8,
    altitudeMeters: 900,
    speedMps: 1.2,
    headingDegrees: 90,
    validForMetrics: true,
    rejectionReason: null,
  };

  expect(session.geometryVersion).toBe(3);
  expect(sample.sequence).toBe(1);
});
```

- [ ] **Step 2: Run RED**

Run: `pnpm --filter @magina-aventura/activity-engine test`
Expected: FAIL because package/contracts do not exist yet.

- [ ] **Step 3: Add the contracts**

Define exactly:

```ts
export type ActivityState =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'FINISHED'
  | 'VALIDATING'
  | 'VERIFIED'
  | 'REJECTED';

export type SyncState = 'local' | 'queued' | 'syncing' | 'synced' | 'failed';
export type LocationRejectionReason =
  | 'invalid_coordinate'
  | 'non_monotonic_time'
  | 'poor_accuracy'
  | 'impossible_speed';

export interface LocationSample {
  sequence: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  altitudeMeters: number | null;
  speedMps: number | null;
  headingDegrees: number | null;
  validForMetrics: boolean;
  rejectionReason: LocationRejectionReason | null;
}

export interface ActivitySession {
  activityId: string;
  routeId: string;
  routeSlug: string;
  geometryVersion: number;
  state: ActivityState;
  startedAt: string;
  pausedAt: string | null;
  finishedAt: string | null;
  lastProcessedSequence: number;
  syncState: SyncState;
}

export interface ActivitySnapshot {
  activityId: string;
  state: ActivityState;
  lastProcessedSequence: number;
  validDistanceMeters: number;
  totalElapsedSeconds: number;
  movingElapsedSeconds: number;
  currentSpeedMps: number | null;
  paceSecondsPerKm: number | null;
  elevationGainMeters: number;
  elevationLossMeters: number;
  routeProgress: number;
  maxRouteProgress: number;
  distanceToRouteMeters: number | null;
  offRouteState: 'on_route' | 'uncertain' | 'off_route' | 'recovering';
  lastValidSample: LocationSample | null;
  algorithmVersion: 1;
  createdAt: string;
}

export type ActivityAction =
  | { type: 'START'; at: string }
  | { type: 'PAUSE'; at: string }
  | { type: 'RESUME'; at: string }
  | { type: 'FINISH'; at: string }
  | { type: 'LOCATION'; sample: LocationSample };

export interface ActivitySyncBatch {
  batchId: string;
  activityId: string;
  sequenceStart: number;
  sequenceEnd: number;
  idempotencyKey: string;
  samples: LocationSample[];
  snapshot: ActivitySnapshot | null;
  createdAt: string;
}
```

- [ ] **Step 4: Scaffold package and export contracts**

`packages/activity-engine/package.json` must declare only `@magina-aventura/contracts`, `@magina-aventura/geo`, TypeScript and Vitest; no Expo/native packages.

- [ ] **Step 5: Run GREEN**

Run: `pnpm --filter @magina-aventura/activity-engine test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/contracts packages/activity-engine pnpm-lock.yaml
git commit -m "feat: add activity tracking contracts"
```

---

### Task 2: Activity state machine + GPS quality filter

**Files:**
- Create: `packages/activity-engine/src/config.ts`
- Create: `packages/activity-engine/src/state-machine.ts`
- Create: `packages/activity-engine/src/filter-location.ts`
- Test: `packages/activity-engine/src/state-machine.test.ts`
- Test: `packages/activity-engine/src/filter-location.test.ts`
- Modify: `packages/activity-engine/src/index.ts`

**Interfaces:**
- Produces `transitionActivityState(state, actionType): ActivityState`.
- Produces `normalizeLocationSample(raw, previous, config): LocationSample`.
- Default rules: `maxAccuracyMeters: 50`, `maxHikingSpeedMps: 4.5`; values remain configurable, not UI constants.

- [ ] **Step 1: Write failing transition tests**

Cover allowed path `DRAFT -> ACTIVE -> PAUSED -> ACTIVE -> FINISHED`, and reject `FINISHED -> ACTIVE`.

```ts
expect(transitionActivityState('DRAFT', 'START')).toBe('ACTIVE');
expect(transitionActivityState('ACTIVE', 'PAUSE')).toBe('PAUSED');
expect(transitionActivityState('PAUSED', 'RESUME')).toBe('ACTIVE');
expect(() => transitionActivityState('FINISHED', 'RESUME')).toThrow('Invalid activity transition');
```

- [ ] **Step 2: Run RED**

Run: `pnpm --filter @magina-aventura/activity-engine test -- state-machine.test.ts`
Expected: FAIL because implementation is absent.

- [ ] **Step 3: Implement the state machine with an explicit transition table**

No `if` chain spread across UI/controllers. `VALIDATING/VERIFIED/REJECTED` are accepted model states but local mobile actions cannot jump into them.

- [ ] **Step 4: Write failing filter tests**

Required cases:
- coordinate outside lat/lon range -> `invalid_coordinate`;
- timestamp <= previous timestamp -> `non_monotonic_time`;
- accuracy > 50 m -> `poor_accuracy`;
- derived speed > 4.5 m/s -> `impossible_speed`;
- good sample -> `validForMetrics: true`.

- [ ] **Step 5: Implement `normalizeLocationSample`**

Input raw type:

```ts
export interface RawLocationSample {
  sequence: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  altitudeMeters: number | null;
  speedMps: number | null;
  headingDegrees: number | null;
}
```

Use `distanceMeters` from `@magina-aventura/geo` when speed must be derived.

- [ ] **Step 6: Run GREEN**

Run: `pnpm --filter @magina-aventura/activity-engine test`
Expected: all Task 1–2 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/activity-engine
git commit -m "feat: add activity state and GPS quality rules"
```

---

### Task 3: Metrics, route projection and sustained off-route detection

**Files:**
- Create: `packages/geo/src/nearest-point-on-line.ts`
- Test: `packages/geo/src/nearest-point-on-line.test.ts`
- Modify: `packages/geo/src/index.ts`
- Create: `packages/activity-engine/src/metrics.ts`
- Create: `packages/activity-engine/src/route-progress.ts`
- Create: `packages/activity-engine/src/off-route.ts`
- Test: `packages/activity-engine/src/metrics.test.ts`
- Test: `packages/activity-engine/src/route-progress.test.ts`
- Test: `packages/activity-engine/src/off-route.test.ts`

**Interfaces:**
- `nearestPointOnRoute(position, line)` returns `{ distanceToRouteMeters, distanceAlongRouteMeters, routeLengthMeters }`.
- `calculateRouteProgress(...)` returns `{ currentProgress, maxProgress, distanceToRouteMeters }`, progress clamped `[0,1]`.
- `updateOffRouteState(previous, distanceToRouteMeters, accuracyMeters, config)` returns next evidence/state.

- [ ] **Step 1: RED for line projection using synthetic coordinates**

Use a short synthetic east-west LineString around latitude 37; test a point north of the middle. Assert nearest segment, positive distance-to-line and approximately 50% distance-along-route. Do not use Bedmar coordinates.

- [ ] **Step 2: Implement line projection**

Iterate each segment, project in a local meter approximation suitable for short hiking segments, clamp projection `t` to `[0,1]`, accumulate segment lengths with existing `distanceMeters`, and select minimum perpendicular distance.

- [ ] **Step 3: RED for metrics**

Assert:
- two accepted points increase distance;
- rejected point does not;
- `PAUSED` sample does not accumulate distance/moving time;
- small altitude noise below 3 m does not create elevation gain;
- altitude delta >= 3 m updates gain/loss.

- [ ] **Step 4: Implement metrics reducer**

Export:

```ts
export function updateActivityMetrics(
  snapshot: ActivitySnapshot,
  previousAccepted: LocationSample | null,
  sample: LocationSample,
  state: ActivityState,
): ActivitySnapshot;
```

- [ ] **Step 5: RED for off-route evidence**

With base corridor 35 m:
- one 60 m sample -> `uncertain`;
- third consecutive 60 m sample -> `off_route`;
- first in-corridor sample after off-route -> `recovering`;
- third in-corridor sample -> `on_route`;
- an accuracy of 45 m expands threshold enough to avoid a false critical warning at 40 m.

- [ ] **Step 6: Implement configurable off-route state**

Use effective corridor `max(baseCorridorMeters, accuracyMeters * accuracyMultiplier)` with defaults `35` and `1.25`, and `samplesToConfirm = 3` for both exit/recovery.

- [ ] **Step 7: RED/GREEN for visual monotonic progress**

Projection may move backward, but `maxRouteProgress` must never decrease. Keep `routeProgress` as current projection and `maxRouteProgress` for UI.

- [ ] **Step 8: Run package tests**

Run: `pnpm --filter @magina-aventura/geo test && pnpm --filter @magina-aventura/activity-engine test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/geo packages/activity-engine
git commit -m "feat: add route progress and off-route engine"
```

---

### Task 4: Pure engine reducer + deterministic replay

**Files:**
- Create: `packages/activity-engine/src/engine.ts`
- Create: `packages/activity-engine/src/replay.ts`
- Test: `packages/activity-engine/src/engine.test.ts`
- Test: `packages/activity-engine/src/replay.test.ts`
- Modify: `packages/activity-engine/src/index.ts`

**Interfaces:**
- `createInitialActivitySnapshot(activityId, at): ActivitySnapshot`.
- `reduceActivity(input): ActivityEngineResult` where result contains session, snapshot, accepted/rejected sample and `shouldPersistSnapshot`.
- `replayActivity(session, routeLine, actions, config): ActivityEngineResult`.

- [ ] **Step 1: RED for a complete synthetic session**

Sequence: START -> 4 location samples -> PAUSE -> 2 samples -> RESUME -> 4 samples -> FINISH.
Assert final state `FINISHED`, distance excludes paused points, and last sequence is retained.

- [ ] **Step 2: Implement pure reducer**

No Date.now inside engine. Every action carries `at`/timestamp so replay is deterministic.

- [ ] **Step 3: RED for snapshot policy**

Assert `shouldPersistSnapshot === true` on START/PAUSE/RESUME/FINISH, after 10 accepted samples, and after elapsed 15 s since the last persisted snapshot marker.

- [ ] **Step 4: Implement snapshot policy in config/engine**

Expose defaults `snapshotEveryAcceptedSamples: 10` and `snapshotEverySeconds: 15`.

- [ ] **Step 5: RED/GREEN for replay determinism**

Run same action sequence twice and deep-equal snapshots except no nondeterministic fields should exist.

- [ ] **Step 6: Run tests**

Run: `pnpm --filter @magina-aventura/activity-engine test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/activity-engine
git commit -m "feat: add deterministic activity engine"
```

---

### Task 5: Transactional SQLite TrackStore + recovery

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `apps/mobile/src/activity/activity-store.ts`
- Create: `apps/mobile/src/activity/sqlite-activity-store.ts`
- Create: `apps/mobile/src/activity/activity-store.test.ts`

**Interfaces:**

```ts
export interface ActivityStore {
  initialize(): Promise<void>;
  createSession(session: ActivitySession, snapshot: ActivitySnapshot): Promise<void>;
  appendBatch(activityId: string, samples: LocationSample[], snapshot: ActivitySnapshot | null): Promise<void>;
  loadActiveSession(): Promise<{ session: ActivitySession; snapshot: ActivitySnapshot; samplesAfterSnapshot: LocationSample[] } | null>;
  updateSession(session: ActivitySession, snapshot: ActivitySnapshot): Promise<void>;
  loadTrack(activityId: string): Promise<LocationSample[]>;
}
```

- [ ] **Step 1: Install SQLite with Expo-compatible resolver**

From `apps/mobile`: `pnpm exec expo install expo-sqlite`
Then return CI/install to frozen lockfile after lock regeneration.

- [ ] **Step 2: RED against an in-memory fake implementing the same store contract**

Test atomic semantics at interface level: append samples + snapshot, recover only samples after snapshot sequence, preserve activity after process-like re-instantiation.

- [ ] **Step 3: Implement SQLite schema**

Tables:

```sql
activity_sessions(activity_id PK, route_id, route_slug, geometry_version, state, started_at, paused_at, finished_at, last_processed_sequence, sync_state)
activity_samples(activity_id, sequence, timestamp, latitude, longitude, accuracy_m, altitude_m, speed_mps, heading_deg, valid_for_metrics, rejection_reason, PRIMARY KEY(activity_id, sequence))
activity_snapshots(activity_id, last_processed_sequence, payload_json, created_at, PRIMARY KEY(activity_id, last_processed_sequence))
activity_sync_batches(batch_id PK, activity_id, sequence_start, sequence_end, idempotency_key UNIQUE, payload_json, state, created_at)
```

Use one SQLite transaction when writing a sample batch and its snapshot.

- [ ] **Step 4: Implement recovery query**

Load exactly one local `ACTIVE`/`PAUSED` session, latest snapshot by sequence, then only later samples.

- [ ] **Step 5: Typecheck + tests + prebuild**

Run: `pnpm --filter @magina-aventura/mobile test && pnpm typecheck`
Then: `cd apps/mobile && pnpm exec expo prebuild --platform android --no-install --clean`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/package.json pnpm-lock.yaml apps/mobile/src/activity
git commit -m "feat: persist activity tracks in SQLite"
```

---

### Task 6: Expo Location/Task Manager provider + Android background service

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `apps/mobile/app.json`
- Create: `apps/mobile/src/activity/location-provider.ts`
- Create: `apps/mobile/src/activity/expo-location-provider.ts`
- Create: `apps/mobile/src/activity/background-location-task.ts`
- Test: `apps/mobile/src/activity/location-provider.test.ts`

**Interfaces:**

```ts
export interface LocationPermissionState {
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  servicesEnabled: boolean;
}

export interface LocationProvider {
  getPermissionState(): Promise<LocationPermissionState>;
  requestAdventurePermissions(): Promise<LocationPermissionState>;
  start(activityId: string): Promise<void>;
  stop(): Promise<void>;
}
```

- [ ] **Step 1: Install SDK-compatible native modules**

From `apps/mobile`: `pnpm exec expo install expo-location expo-task-manager`
Do not pin guessed npm versions; commit the versions and lock produced by Expo SDK 57 resolution.

- [ ] **Step 2: RED provider tests with mocked native adapter boundary**

Assert:
- foreground denied => no background start;
- background denied => return degraded state, do not claim full readiness;
- services disabled => readiness false;
- granted => `start` requests active tracking configuration.

- [ ] **Step 3: Configure Expo app plugin**

Use `expo-location` config plugin with Android background location + foreground service enabled. The generated Android manifest must contain background/fine/coarse location permissions and foreground service location capability after prebuild.

- [ ] **Step 4: Define TaskManager task at module scope**

`TaskManager.defineTask(ACTIVITY_LOCATION_TASK, ...)` must be evaluated outside React components. It forwards batches to a narrow background ingestion function; it must not render UI or award rewards.

- [ ] **Step 5: Configure balanced hiking updates**

Use high accuracy while `ACTIVE`, `distanceInterval` in the single-digit meter range (default 8 m), Android foreground notification `Mágina Aventura · Ruta en curso`, deferred/batched background delivery where supported. Keep constants in one config module.

- [ ] **Step 6: Verify Android prebuild**

Run: `cd apps/mobile && pnpm exec expo prebuild --platform android --no-install --clean`
Inspect generated manifest/config for required background/foreground-service location declarations.

- [ ] **Step 7: Run full type/tests**

Run: `pnpm typecheck && pnpm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/package.json apps/mobile/app.json pnpm-lock.yaml apps/mobile/src/activity
git commit -m "feat: add Android background location provider"
```

---

### Task 7: Activity controller, recovery and offline sync batching

**Files:**
- Create: `apps/mobile/src/activity/activity-controller.ts`
- Create: `apps/mobile/src/activity/activity-sync-queue.ts`
- Create: `apps/mobile/src/activity/activity-controller.test.ts`
- Modify: `packages/offline-sync/src/index.ts` only if reusing/extending existing idempotency primitives is required.

**Interfaces:**

```ts
export interface ActivityController {
  start(input: { activityId: string; routeId: string; routeSlug: string; geometryVersion: number; routeLine: RouteLineFeature }): Promise<void>;
  ingest(rawSamples: RawLocationSample[]): Promise<void>;
  pause(at: string): Promise<void>;
  resume(at: string): Promise<void>;
  finish(at: string): Promise<void>;
  recover(): Promise<RecoveredActivity | null>;
}
```

- [ ] **Step 1: RED for controller start/recovery**

With fake provider/store, start creates session + initial snapshot before starting native location. Reconstruct controller with same fake persisted data and assert `recover()` returns same activity/state.

- [ ] **Step 2: Implement start ordering safely**

Persist session first, then start location service. If native start fails, keep recoverable session and surface explicit error; do not silently drop it.

- [ ] **Step 3: RED for batch ingestion**

Feed 12 samples; assert sample sequences persist, snapshot generated at 10 accepted samples, and rejected samples remain stored for diagnostics.

- [ ] **Step 4: Implement ingestion + snapshot writes**

Use pure engine for every sample; buffer writes in small batches and flush on snapshot/state transitions.

- [ ] **Step 5: RED for sync batch idempotency**

Same sequence range twice must produce same idempotency key and only one queued batch.

Key format:

```ts
`activity:${activityId}:track:${sequenceStart}-${sequenceEnd}`
```

- [ ] **Step 6: Implement local queue**

Create batches from unsynced sample ranges; no network call is required to finish the activity.

- [ ] **Step 7: Run tests**

Run: `pnpm --filter @magina-aventura/mobile test && pnpm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/src/activity packages/offline-sync
git commit -m "feat: orchestrate recoverable offline activities"
```

---

### Task 8: Private Supabase activity upload schema + idempotent track batches

**Files:**
- Create: `supabase/migrations/202609150008_activity_tracking.sql`
- Create: `supabase/tests/database/activity_tracking_test.sql`

**Interfaces:**
- `activities`: server record for uploaded local session summary.
- `activity_track_batches`: private idempotent raw track chunks.
- No reward/verification decision in this migration.

- [ ] **Step 1: Write pgTAP RED contract**

Test table existence, geometry version field, private RLS, owner-only select/insert, unique `(activity_id, idempotency_key)`, and inability for anonymous users to read tracks.

- [ ] **Step 2: Run RED**

Run: `supabase db reset && supabase test db supabase/tests/database/activity_tracking_test.sql`
Expected: FAIL because tables are absent.

- [ ] **Step 3: Implement migration**

Minimal shape:

```sql
create table public.activities (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  route_id uuid not null references public.routes(id),
  geometry_version integer not null,
  state text not null check (state in ('FINISHED','VALIDATING','VERIFIED','REJECTED')),
  started_at timestamptz not null,
  finished_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.activity_track_batches (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  idempotency_key text not null,
  sequence_start integer not null,
  sequence_end integer not null check (sequence_end >= sequence_start),
  samples jsonb not null,
  created_at timestamptz not null default now(),
  unique(activity_id, idempotency_key)
);
```

Enable RLS. Policies must require `auth.uid() = user_id`. Do not grant anonymous read.

- [ ] **Step 4: Run GREEN**

Run: `supabase db reset && supabase test db`
Expected: PASS all existing + new pgTAP tests.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations supabase/tests
git commit -m "feat: add private activity upload schema"
```

---

### Task 9: Real active-adventure UI + MapLibre user track

**Files:**
- Create: `apps/mobile/src/activity/use-active-adventure.ts`
- Create: `apps/mobile/src/activity/track-geojson.ts`
- Test: `apps/mobile/src/activity/track-geojson.test.ts`
- Modify: `apps/mobile/app/adventure/[slug].tsx`
- Modify: `apps/mobile/app/routes/[slug]/prepare.tsx`
- Modify: `apps/mobile/app/_layout.tsx` if bootstrap recovery requires it.

**Interfaces:**
- UI consumes controller state; it never calculates distance/progress itself.
- `trackToGeoJson(samples)` includes only accepted metric samples in displayed user track.

- [ ] **Step 1: RED for track GeoJSON**

Given 3 samples where one is rejected, assert returned LineString has only the two accepted `[longitude, latitude]` points.

- [ ] **Step 2: Implement `trackToGeoJson`**

Return a valid GeoJSON Feature with properties `{ kind: 'activity-track' }`.

- [ ] **Step 3: Replace simulated preparation state**

`prepare.tsx` must show explicit states for foreground permission, background permission, GPS services, offline package, and CTA. Background denied may allow degraded start only after explicit warning; never label it “ready with screen locked”.

- [ ] **Step 4: Replace simulated adventure screen**

Use MapLibre full-screen, official route payload, current user location, live track GeoJSON, and engine snapshot values for progress/distance/time/elevation/off-route. Remove fake discovery emojis and “MODO SIMULADO”.

- [ ] **Step 5: Wire controls**

Pausar -> controller `pause`; Reanudar -> `resume`; Finalizar -> confirmation then `finish`. While GPS signal is degraded, keep activity state and show `Buscando señal`/accuracy status.

- [ ] **Step 6: Recovery bootstrap**

On app startup or entering adventure flow, call `recover()`. If an ACTIVE/PAUSED session exists, resume its screen instead of creating a duplicate activity.

- [ ] **Step 7: Unit/type/prebuild verification**

Run:

```bash
pnpm typecheck
pnpm test
cd apps/mobile && pnpm exec expo prebuild --platform android --no-install --clean
```

Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile
git commit -m "feat: connect active adventure to GPS engine"
```

---

### Task 10: CI boundary hardening + deterministic replay gate + field-test checklist

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `packages/activity-engine/src/fixtures/synthetic-walk.ts`
- Create: `packages/activity-engine/src/replay.integration.test.ts`
- Create: `docs/field-tests/gps-active-adventure-v1.md`

**Interfaces:**
- CI must reject native imports from `packages/activity-engine/src`.
- Replay fixture must be synthetic and deterministic.

- [ ] **Step 1: Add activity-engine to pure boundary grep**

Append `packages/activity-engine/src` to the existing `Verify pure package boundaries` paths.

- [ ] **Step 2: Add deterministic replay integration test**

Fixture must include: normal movement, pause, bad-accuracy sample, impossible jump, sustained off-route, recovery, finish. Assertions: deterministic final snapshot, rejected samples do not inflate distance, off-route transitions recover, final state `FINISHED`.

- [ ] **Step 3: Write physical Android checklist**

Document exact evidence fields:

```md
- Build SHA:
- Device / Android version:
- Route/test area:
- Start timestamp:
- Screen locked for >= 5 min: PASS/FAIL
- Track continuous after unlock: PASS/FAIL
- Pause/resume: PASS/FAIL
- Force-close/reopen recovery: PASS/FAIL
- Offline mode during activity: PASS/FAIL
- Finish + summary persisted: PASS/FAIL
- Notes / screenshots / exported diagnostic track:
```

The route/test area can be a safe short local walk; do not claim Cuadros field validation until physically performed there.

- [ ] **Step 4: Run full automated gate locally/CI**

Run:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
cd apps/mobile && pnpm exec expo prebuild --platform android --no-install --clean
cd ../..
supabase db start
supabase db reset
supabase test db
supabase stop --no-backup
```

Expected: zero failures.

- [ ] **Step 5: Open Draft PR against `feat/foundation-v1`**

Title: `GPS + Active Adventure V1 — background tracking + recovery`

PR body must state clearly that automated gates can be green while the physical Android field test remains pending.

- [ ] **Step 6: Perform physical Android gate before final completion claim**

Use a development/native build, not Expo Go. Complete `docs/field-tests/gps-active-adventure-v1.md`. If background tracking or recovery fails, keep PR Draft and fix before marking the subsystem complete.

- [ ] **Step 7: Final commit for evidence/docs if needed**

```bash
git add .github/workflows/ci.yml docs/field-tests packages/activity-engine/src/fixtures packages/activity-engine/src/replay.integration.test.ts
git commit -m "test: gate GPS activity engine and field validation"
```

---

## Plan Self-Review Checklist

Before executing Task 1, verify:

- Every approved spec area maps to a task: contracts/state, filtering, metrics, route progress, off-route, persistence/recovery, background location, offline batching, private backend upload, UI, replay, physical test.
- No reward/checkpoint/discovery logic has leaked into this plan.
- Every geospatial unit test uses synthetic coordinates only.
- `ActivitySnapshot`, `LocationSample` and state names are consistent across tasks.
- SQLite is the only mobile persistence implementation in V1; the pure engine has no dependency on it.
- Supabase upload is non-critical-path and private; anonymous track read is forbidden.
- Automated CI success is not treated as proof of real background tracking; physical Android evidence remains mandatory.
