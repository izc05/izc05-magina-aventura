# Game Kit Foundation (QA-only)

**Branch:** `feat/game-kit-foundation`  
**Status:** mock-only; not connected to GPS or the production Adventure Engine.

**Related work:** [MANUS-04 issue #76](https://github.com/izc05/izc05-magina-aventura/issues/76) · [Draft PR #75](https://github.com/izc05/izc05-magina-aventura/pull/75)

## Purpose and safety boundary

This feature gives design and QA a way to exercise an adventure HUD, progression, discoveries, rewards, checkpoint states, and feedback without going outdoors. It is a separate `/game-kit-playground` route with a development-only home entry and a release-mode guard.

**No changes were made to** GPS sampling/tracking, location permissions, Activity SQLite/persistence, process recovery, pause/resume runtime, real synchronization, the production Adventure Engine, or Android build configuration. The playground uses only local in-memory state; it does not request location permissions, read coordinates, persist sessions, contact a server, or import the GPS/map runtime.

## Architecture

```text
Future Activity / Exploration sources
              │ (future adapter; not implemented)
              ▼
       GameEventListener ← transport-agnostic GameEvent contract
              │
              ▼
       reduceGameEvent  ← pure in-memory transition / event-ID dedupe
          /     |     \
        HUD     FX    Rewards / Discovery / Checkpoints
```

A future adapter may translate already-validated Activity/Exploration facts into Game Kit events. That adapter must not change GPS sampling, permission handling, SQLite/session lifecycle, pause/resume, or recovery. Stable event IDs are needed when a source can retry a fact; the current ID ledger exists only in memory and is cleared by Playground reset.

## Deterministic Playground flow

`createMockFullAdventureSequence()` creates a fixed, replayable fictional flow:

1. adventure start;
2. active objective;
3. checkpoint approach;
4. checkpoint reached;
5. checkpoint XP;
6. discovery unlocked and XP;
7. badge reward;
8. route progress;
9. completion, route XP, and completion badge.

The events carry stable demo IDs. Replaying without a reset is idempotent; **Reset completo** clears all progress, recent events, and processed IDs so the same scenario can be replayed from its initial state. The individual buttons remain available for isolated tests. Repeated checkpoint/discovery/challenge/collectible/completion actions do not grant their reward again.

All route, objective, checkpoint, discovery, badge, and challenge content is fictional and visibly marked `MOCK` / `DEMO`. The fictional route is not navigation guidance or a claim about a real trail or historical fact.

## Reducer behavior and tests

The reducer now:

- ignores duplicate events when their stable `eventId` has already been processed;
- does not regress a reached/completed checkpoint when an older “nearby” event arrives;
- keeps progress, distance, and elapsed time monotonic against stale updates;
- treats repeated discovery/badge/challenge/collectible/checkpoint/completion events as no-ops;
- clamps XP to **0–9,999**, ignores non-finite/negative awards, and resolves the five configured explorer levels;
- ignores unknown runtime event variants without corrupting state;
- supports a Playground-only reset action that is not an Adventure Engine event.

The mobile test suite includes cases for duplicate IDs, idempotence, out-of-order events, reset, XP boundaries and level transitions, repeated checkpoint/discovery rewards, unknown events, and deterministic end-to-end replay.

## Small-screen and accessibility review

The isolated Playground/components were reviewed for the requested 360–420 dp Android widths:

- the action grid stays two-column, metric cells flex instead of using a fixed minimum width, and HUD labels constrain long copy with accessible full labels;
- discovery titles/descriptions and action labels have bounded lines; the page remains scrollable;
- the route uses the app's existing `portrait` orientation and now observes both top and bottom safe-area insets;
- primary controls are at least 44 dp high; compact discovery and checkpoint controls were raised to a 44 dp minimum target;
- reset has an explicit disabled visual/accessibility state before any event is recorded; the mock surface has no asynchronous operations, so it has no loading state to present;
- key button text uses the existing high-contrast olive/white palette; feedback respects the system Reduce Motion preference.

**Evidence limitation:** no Android device/emulator (`adb` is not installed/available in this sandbox) and no Expo web renderer (`react-dom` / `react-native-web`) are available. Therefore no genuine Android screenshot or physical visual sign-off is claimed. This review is based on source/layout constraints and automated tests; a device capture remains a follow-up QA artifact.

## Future integration contract (documentation only; no wiring)

The event names below are intended as the next integration seam. Entries marked **proposed** are documentation-only and are not present in the current event union. No adapter, lifecycle behavior, persistence, or GPS functionality is implemented here.

| Activity / Exploration fact | GameEvent mapping | Expected visual effect | Status / constraint |
|---|---|---|---|
| Activity started | `ADVENTURE_STARTED` (+ `OBJECTIVE_ACTIVATED` when an objective is assigned) | Start HUD state and show the current objective | Current typed events; mock-only in Playground |
| A valid GPS sample was accepted | `LOCATION_SAMPLE_VALID` | Optional transient “signal valid” indicator; never render/store raw coordinates in Game Kit | Proposed only; Activity/Exploration remains the authority for sample validity |
| Route progress changed | `ROUTE_PROGRESS { percent, distanceKm, elapsedMinutes }` | Update progress bar and compact distance/time metrics | Current typed event; values remain monotonic in the reducer |
| Checkpoint became available | `CHECKPOINT_STATE_SET { state: 'AVAILABLE' }` | Change that checkpoint card to available; later proximity/reach events advance its display | Current typed event, presently used only by the QA state editor |
| Discovery was unlocked | `DISCOVERY_UNLOCKED` | Mark the discovery card and allow its reward feedback | Current typed event; XP remains a separate event |
| Activity paused | `ACTIVITY_PAUSED` | Show a paused indicator and freeze activity-derived HUD values | Proposed only; no pause/runtime control here |
| Activity resumed | `ACTIVITY_RESUMED` | Clear the paused indicator and resume rendering incoming facts | Proposed only; no resume/runtime control here |
| Adventure completed | `ADVENTURE_COMPLETED` (+ `XP_GAINED` / `BADGE_UNLOCKED` as separate reward facts) | Complete progress, settle discovered checkpoints, and show completion feedback | Current typed events; local simulation only |
| Activity restored after process recovery | `ACTIVITY_RECOVERED` with a safe summary reference | Rebuild the HUD from the authoritative restored activity snapshot, without replaying rewards | Proposed only; requires Activity-owned persistence and stable reward IDs; no Game Kit persistence/recovery |

**Before integration after the physical GPS gate:** validate the gate on its own branch with real device evidence; agree the authoritative Activity/Exploration event source and payload mapping; use stable IDs for retryable reward facts; add adapter tests for the table; explicitly reconcile pause/resume and process recovery with the Activity store; keep raw location/session persistence outside Game Kit; and then wire the adapter in a separate reviewed change. This PR does not satisfy or replace the physical GPS gate.

## Files in scope

- `apps/mobile/src/features/game-kit/model.ts` — typed event contract, bounded/idempotent reducer, event ledger, XP limits, and reset action.
- `apps/mobile/src/features/game-kit/mock-content.ts` — fictional content and deterministic end-to-end event sequence.
- `apps/mobile/src/features/game-kit/GameKitComponents.tsx` — compact HUD, discovery/checkpoint/badge cards, and reduced-motion-aware event feedback.
- `apps/mobile/src/features/game-kit/model.test.ts` — reducer edge cases and complete replay/reset tests.
- `apps/mobile/app/game-kit-playground.tsx` — isolated development/QA surface.
- `apps/mobile/app/index.tsx` — development-only route entry.

## Validation, risks, and explicit non-goals

- `pnpm typecheck` and the workspace test suite are required gates; GitHub CI must pass on the final PR head.
- No dependency, production navigation, APK configuration, service/API integration, or real Activity adapter is added.
- Residual risk: automated/source review cannot substitute for Android device screenshots, screen-reader interaction, or physical location testing. Do not describe those gates as passed without evidence.
- PR remains **Draft** and must not be merged to `main` as part of this task.
