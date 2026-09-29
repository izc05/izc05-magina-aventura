# Internal Reuse Audit — Existing Aventura Mágina Code

**Status:** mandatory reuse review before adding new domain/GPS/progression engines  
**Rule:** do not rewrite capabilities that already exist in old branches without an explicit reason.

## Executive finding

The current `main` branch is much smaller than several historical feature branches. Important production-oriented work exists outside `main`.

The strongest source is:

- `feat/adventure-engine-v2`: complete activity/exploration stack, mobile adapters, persistence, QA harness and active-adventure map work.
- `feat/06f-progression-cycle-foundation`: pure progression domain including XP, levels, badges, challenges, rankings and collection progress.

These branches are **diverged** from `main`. They must not be merged wholesale. Reuse is surgical: port/adapt pure packages and selected mobile adapters with their tests.

---

## A. Activity + exploration engine — PORT FIRST

Source branch: `feat/adventure-engine-v2`

### Pure package candidates

#### `packages/activity-engine/src/filter-location.ts`
Already implements:
- coordinate validation;
- monotonic timestamp validation;
- GPS accuracy rejection;
- impossible hiking-speed rejection;
- normalized `LocationSample`.

Decision: **PORT/ADAPT**.

Do not replace this with Turf. Turf does geometry; this file owns location-sample quality policy.

#### `packages/activity-engine/src/exploration/proximity.ts`
Already implements:
- configurable exploration policy;
- max GPS accuracy;
- required consecutive samples;
- maximum evidence gap;
- configurable trigger radius;
- target validation;
- exploration state;
- deterministic sample evaluation.

Decision: **PORT/ADAPT AS AUTHORITATIVE PROXIMITY STATE MACHINE**.

This directly solves the safety/product requirement that a single noisy GPS sample must not unlock a discovery.

#### `packages/activity-engine/src/state-machine.ts`
Decision: **AUDIT + PORT if compatible**.

Activity lifecycle belongs here, not in Game FX.

### Mobile runtime candidates

#### `apps/mobile/src/activity/activity-controller.ts`
Already orchestrates:
- Activity Engine;
- exploration state/evaluation;
- route/adventure definition validation;
- location provider;
- background inbox;
- persistence;
- sync queue;
- recovery.

Decision: **PORT IN A DEDICATED GPS/ACTIVITY GATE**, after checking current `main` architecture.

Game Kit should listen to facts produced by this controller; it should not replace the controller.

#### Persistence/runtime
Review and port selectively:
- `activity-store.ts`
- `sqlite-activity-store.ts`
- activity migrations;
- `background-location-handler.ts`
- `background-location-inbox.ts`
- `sqlite-background-location-inbox.ts`
- `background-location-task.ts`
- `expo-location-adapter.ts`
- `expo-location-provider.ts`
- `location-provider.ts`
- `activity-sync-queue.ts`
- `use-active-adventure.ts`
- `track-geojson.ts`

Decision: **REUSE WITH EXPO-57 VERSION AUDIT**.

Important: the historical mobile package file uses `expo-location ~56.0.25` and `expo-task-manager ~56.0.27` while the app itself is Expo 57. Do **not** copy those version pins. Install/resolve Expo 57-compatible versions in the new branch.

### Existing Active Adventure map

#### `apps/mobile/src/map/ActiveAdventureMap.tsx`
Already renders:
- official route;
- actual user track;
- current position;
- MapLibre camera framing.

Decision: **MERGE CONCEPTS WITH CURRENT `RouteMap.tsx`**, not create a third map component.

Target architecture:
- one reusable MapLibre boundary;
- detail/preparation mode;
- active-adventure mode;
- game state layers.

### Existing presentation layer

#### `apps/mobile/src/features/adventure/exploration-presenter.ts`
Already projects:
- completed/total objectives;
- next objective;
- latest checkpoint/discovery;
- meta/progress labels.

Decision: **PORT/ADAPT** and feed the visual Game HUD.

Do not make Reanimated components calculate route/exploration progress.

---

## B. Geo helpers — PORT BEFORE TURF

Source branch: `feat/06f-progression-cycle-foundation`

### `packages/geo/src/nearest-point-on-line.ts`
Already computes:
- distance to official route;
- distance along route;
- total route length.

Decision: **PORT WITH TESTS FIRST**.

Only introduce Turf for operations not already covered or when its implementation is demonstrably more correct/maintainable for the case.

Target division:

```text
internal geo helpers
  distance / nearest route / progress
          +
Turf modules only when needed
  polygon/buffer/advanced geometry
```

This avoids increasing bundle/dependency surface without benefit.

---

## C. XP / levels / achievements — PORT, DO NOT REBUILD

Source branch: `feat/06f-progression-cycle-foundation`

### `activity-xp.ts`
Already implements verified-activity XP with:
- base XP;
- distance;
- ascent;
- discoveries;
- first-route bonus;
- first-municipality bonus;
- duplicate/repeat-route limits.

Decision: **PORT AS DOMAIN AUTHORITY**.

Game FX only visualizes the resulting XP.

### `level-progression.ts`
Already implements:
- level definitions;
- total XP projection;
- current/next level;
- percentage;
- crossed levels.

Decision: **PORT**.

A crossed level can emit `level.up` into Game Kit.

### `badge-eligibility.ts`
Already supports badge criteria against aggregate statistics.

Decision: **PORT**.

New badge candidates emit `badge.unlocked`; animation code does not determine badge eligibility.

### `challenge-progress.ts`
Already supports:
- daily/weekly/municipal/season scopes;
- metrics;
- time windows;
- active seasons;
- progress/completion projection.

Decision: **PORT**.

### `ranking.ts`
Already supports:
- senderista/explorador/magina;
- weekly/monthly/season/all-time;
- configurable weighted scoring;
- repeat-route limits.

Decision: **PORT**.

### `progression-cycle.ts`
Already joins:
- XP;
- level projection;
- level crossing;
- aggregate stats;
- badges;
- challenges;
- rankings.

Decision: **PORT AS ORCHESTRATION BASIS**.

This should become the source of Game Kit reward events after verified activity, not be duplicated inside the app UI.

---

## D. Collections — PORT

### `packages/domain/src/collections/collection-progress.ts`

Already models the six approved families:
- flora;
- fauna;
- heritage;
- olive;
- tradition;
- landscape.

It calculates:
- total/unlocked;
- percentage;
- per-category progress;
- unlock history.

Decision: **PORT**.

Discovery visual cards and album screens consume this projection.

---

## E. What external libraries are still for

After internal reuse:

### Reanimated
Presentation/motion only.

### Lottie
Packaged authored celebration assets only.

### Skia
Optional high-performance visual FX only.

### Rive Nitro
Optional interactive state-machine asset spike only.

### Turf
Advanced geometry missing from internal helpers, not the first proximity implementation.

### Matter.js / Miniplex
Future self-contained minigames only.

---

## F. Required migration order

```text
1. inventory historical code
2. port pure activity-engine + tests
3. port geo helpers + tests
4. port progression/collections + tests
5. port/adapt mobile location/persistence runtime
6. connect Activity/Progression facts to GameEvent
7. add visual runtimes
8. gamify MapLibre
9. physical route QA
```

Do not put visual-runtime dependencies ahead of recovery/GPS/domain reuse if the feature depends on those facts.

---

## G. Merge strategy

Never merge `feat/adventure-engine-v2` or `feat/06f-progression-cycle-foundation` wholesale because they diverged from current `main` and include unrelated/older app configuration.

For each reusable unit:

1. Fetch source + tests from historical branch.
2. Compare current contracts/types.
3. Port the smallest coherent unit.
4. Keep/adapt tests.
5. Resolve Expo/runtime versions from current SDK, not the historical lockfile.
6. Run typecheck/tests.
7. Run Android prebuild if mobile/native files changed.
8. Record source branch and original path in the PR report.

Internal code from this same repository does not require third-party attribution, but provenance must still be recorded so later agents know it was salvaged rather than newly designed.

---

## H. Desired final event flow

```text
Expo Location
   ↓
Location quality filter            [existing internal engine]
   ↓
Activity state + route progress    [existing internal engine]
   ↓
Exploration proximity state        [existing internal engine]
   ↓
checkpoint/discovery domain fact
   ↓
collections/progression            [existing internal domain]
   ↓
GameEvent
   ↓
GameEffectCommand
   ↓
Reanimated / Haptics / Audio / Lottie / Skia / optional Rive
```

The renderer never decides whether a checkpoint was truly reached or a reward was earned.


## I. Historical CI evidence

The historical sources are not merely dead experiments.

### `feat/adventure-engine-v2`
Reviewed Actions history includes multiple successful PR CI runs across the engine/visual/QA work, including:
- run 35586016730 — success;
- 35565301096 — success;
- 35558722291 — success;
- 35549928486 — success;
- 35542896096 — success;
- 35536262336 — success;
- 35533926537 — success;
- and earlier successful runs.

There were also failed intermediate runs; treat the final/source commit of each transplant as code to revalidate, not as proof that every commit in branch history was correct.

### `feat/06f-progression-cycle-foundation`
Reviewed PR CI:
- run 35060595745 — success;
- run 35060408672 — success;
after an earlier failed intermediate run.

### Consequence

Priority order for reuse:
1. historical pure code with tests + known successful CI;
2. maintained external dependency/pattern;
3. new implementation only when neither existing source fits.

All transplanted code still must pass **current** main/Expo-57 CI after adaptation. Historical green CI is evidence, not a waiver.
