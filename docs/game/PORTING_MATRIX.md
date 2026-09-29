# Porting Matrix — Historical Code -> Current Game Architecture

This document is the implementation map for Claude/Codex. It converts the internal reuse audit into concrete transplant units.

## Status codes

- **P0 PORT FIRST**: foundational, pure/tested, low risk.
- **P1 PORT NEXT**: needed for actual route runtime.
- **P2 ADAPT**: useful but must be merged with current implementation.
- **P3 REFERENCE**: inspect ideas/tests, do not transplant directly.
- **DROP**: obsolete/redundant.

---

## Unit 1 — Activity contracts [P0]

Source:
- branch: `feat/adventure-engine-v2`
- `packages/contracts/src/activity.ts`

Contains:
- `ActivityState`
- `SyncState`
- `LocationRejectionReason`
- `LocationSample`
- `ActivitySession`
- `ActivitySnapshot`
- `ActivityAction`
- `ActivitySyncBatch`

Target:
- current `packages/contracts/src/activity.ts`
- export from contracts index

Why first:
Every Activity Engine file depends on these contracts.

Review before port:
- confirm current approved lifecycle includes FLAGGED/REWARDED or keep server-only state separate;
- preserve immutable activity/adventure/geometry version pinning;
- preserve rejection reason semantics.

Tests:
- type tests;
- contract compile boundary.

---

## Unit 2 — Geo nearest-route primitive [P0]

Source:
- `feat/06f-progression-cycle-foundation`
- `packages/geo/src/nearest-point-on-line.ts`
- matching test.

Provides:
- distance to route;
- distance along route;
- route total length.

Target:
- current `packages/geo`.

Reason:
Required by route progress/off-route logic.

Do not replace with Turf by default.

---

## Unit 3 — Pure Activity Engine core [P0]

Source:
- `feat/adventure-engine-v2/packages/activity-engine`

Port as one coherent workspace package:

### Core
- `config.ts`
- `state-machine.ts`
- `engine.ts`
- `metrics.ts`
- `filter-location.ts`
- `off-route.ts`
- `route-progress.ts`
- `replay.ts`

### Tests
- `contracts.test.ts`
- `engine.test.ts`
- `metrics.test.ts`
- `filter-location.test.ts`
- `off-route.test.ts`
- `route-progress.test.ts`
- `replay.test.ts`
- `replay.integration.test.ts`
- `snapshot-policy.test.ts`
- `state-machine.test.ts`

Important behaviors already present:
- GPS quality rejection;
- impossible-speed rejection;
- ACTIVE/PAUSED lifecycle;
- distance/time/pace/elevation;
- off-route hysteresis with multiple samples;
- monotonic route progress;
- snapshot persistence policy;
- deterministic replay.

Acceptance:
all historical tests pass against current TS/contracts before any mobile adapter is ported.

---

## Unit 4 — Exploration Engine [P0]

Source:
- `feat/adventure-engine-v2/packages/activity-engine/src/exploration`

Port:
- `types.ts`
- `adventure-definition.ts`
- `proximity.ts`
- `observation.ts`
- tests.

Key behavior:
- configurable trigger radius;
- max accepted accuracy;
- required consecutive samples;
- max evidence gap;
- prerequisites/sequence;
- deterministic unlock evidence.

This becomes authoritative for checkpoint/discovery facts.

Game Kit consumes the result; Game Kit does not determine proximity.

---

## Unit 5 — Progression domain [P0]

Source:
- `feat/06f-progression-cycle-foundation/packages/domain/src/gamification`

Port:
- `activity-xp.ts`
- `adventure-stats.ts`
- `level-progression.ts`
- `badge-eligibility.ts`
- `challenge-progress.ts`
- `ranking.ts`
- `progression-cycle.ts`
- all matching tests.

Responsibilities:
- verified activity XP;
- repeat-route anti-farming;
- aggregate statistics;
- level projection/crossing;
- badge eligibility;
- challenge/season progress;
- rankings;
- one combined progression projection.

Game bridge:
- positive XP -> `xp.earned`
- crossed level -> `level.up`
- new badge -> `badge.unlocked`
- completed challenge -> future `challenge.completed`

Do not move calculations into screens.

---

## Unit 6 — Collection domain [P0]

Source:
- `feat/06f-progression-cycle-foundation/packages/domain/src/collections`

Port:
- `collection-progress.ts`
- test.

Approved categories already match product:
flora, fauna, heritage, olive, tradition, landscape.

Bridge:
new discovery unlock -> collection projection -> `discovery.unlocked` visual event.

---

## Unit 7 — Mobile activity ports/interfaces [P1]

Source:
`feat/adventure-engine-v2/apps/mobile/src/activity`

Port interfaces/pure orchestration first:
- `activity-store.ts`
- `background-location-inbox.ts`
- `location-provider.ts`
- `activity-sync-queue.ts`
- `track-geojson.ts`
- `activity-controller.ts`

Keep/adapt tests.

The controller is the orchestration seam where domain facts can later be surfaced to Game Kit.

Do not import Reanimated/Skia/Lottie here.

---

## Unit 8 — SQLite persistence [P1]

Source:
- migrations;
- `sqlite-activity-store.ts`
- `sqlite-background-location-inbox.ts`
- tests.

Dependency:
use the current Expo 57 `expo-sqlite` resolution.

Acceptance scenarios:
- process restart;
- unfinished activity recovery;
- duplicate background points;
- migrations from empty DB;
- idempotent queue behavior.

---

## Unit 9 — Expo Location/TaskManager adapter [P1]

Source:
- `expo-location-adapter.ts`
- `expo-location-provider.ts`
- `background-location-task.ts`
- `background-location-handler.ts`
- runtime wiring.

Historical version warning:
old branch package metadata uses Expo 56-era Location/TaskManager pins inside an Expo 57 app.

Action:
- port logic;
- reinstall current Expo 57 versions;
- verify API changes;
- run Android prebuild;
- physical background/foreground test.

Never paste old package.json/lockfile.

---

## Unit 10 — Active Map convergence [P2]

Sources:
- current main: `apps/mobile/src/map/RouteMap.tsx`
- historical: `apps/mobile/src/map/ActiveAdventureMap.tsx`

Current `RouteMap` has richer theme/layers:
- park;
- route glow;
- checkpoints;
- POIs;
- hiker.

Historical `ActiveAdventureMap` adds:
- actual recorded track;
- current accepted point;
- active map framing.

Decision:
**do not keep two competing map architectures**.

Target:
one MapLibre boundary with optional active-adventure layers/state.

Then GAME-06 adds game symbols/status/halo.

---

## Unit 11 — Exploration presentation [P2]

Source:
- `apps/mobile/src/features/adventure/exploration-presenter.ts`

Port/adapt as pure presentation projection:
- completed/total;
- next objective;
- latest event;
- meta text.

Game FX Host receives this state but does not own it.

---

## Unit 12 — Simulation/replay QA [P1]

Reuse:
- simulated location provider;
- QA simulation runtime;
- deterministic replay;
- adventure E2E harness.

Reason:
Game FX can be tested from reproducible GPS routes without walking outdoors for every change.

Required fixtures should cover:
1. normal route;
2. poor-accuracy samples;
3. off-route then recovery;
4. checkpoint unlock;
5. discovery unlock;
6. pause/resume;
7. process recovery;
8. finish.

---

## Unit 13 — Visual Game Kit [after P0/P1 facts are stable]

New work:
- Haptics/Audio;
- Reanimated;
- Lottie;
- Skia;
- optional Rive Nitro.

These adapters are consumers, not source of truth.

---

## Things not to port blindly

### Historical `apps/mobile/package.json`
DROP as a file; use only as dependency history.

### Historical lockfile
DROP.

### Old global screen designs
REFERENCE unless still aligned to approved current design.

### Duplicate map component
CONVERGE, don't duplicate.

### Development fixtures presented as real content
DROP/keep explicitly development-only.

### Old CI/workflows
REFERENCE only; current CI owns branch.

---

## Recommended child PR sequence

```text
A. contracts + geo nearest route
B. activity-engine core + exploration
C. progression + collections
D. mobile store/controller interfaces
E. SQLite persistence
F. Expo Location background runtime
G. GameEvent bridge
H. Haptics/Audio
I. Reanimated
J. Map convergence + game layers
K. Lottie
L. Skia
M. Rive spike
N. physical QA
```

Pure packages A-C can be reviewed independently, but avoid incompatible simultaneous edits to contract indexes.
