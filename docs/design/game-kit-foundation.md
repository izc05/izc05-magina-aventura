# Game Kit Foundation (QA-only)

**Branch:** `feat/game-kit-foundation`  
**Status:** mock-only foundation; not connected to GPS or the production Adventure Engine.

## Purpose and safety boundary

This feature gives design and QA a way to exercise adventure HUD, progression, discoveries, rewards, checkpoint states, and feedback without going outdoors. It is a separate route at `/game-kit-playground`, linked from the home screen only in Expo development mode (`__DEV__`). The route also guards against release-mode rendering.

**No changes were made to** the GPS engine, location tracking, production Adventure Engine, session persistence, crash recovery, pause/resume behavior, or the physical-APK validation configuration. The playground owns ephemeral in-memory reducer state only and does not request location permissions, read a device location, write sessions, or import the GPS/map runtime.

## Architecture

```text
Future Adventure Engine
          │ (future adapter; not implemented here)
          ▼
   GameEventListener  ← transport-neutral GameEvent union
          │
          ▼
   reduceGameEvent     ← pure, in-memory state transition
      /    |    \
    HUD    FX   Rewards / Discovery / Checkpoints
```

The UI playground dispatches the same typed `GameEvent` messages locally. The eventual integration seam is `GameEventListener = (event: GameEvent) => void`; a later adapter can subscribe to Adventure Engine messages and forward them to a Game Kit store/controller. That adapter must map existing engine events without changing GPS sampling, tracking, or session lifecycle code. This PR intentionally does **not** implement that adapter or persistence.

## Files added/changed

- `apps/mobile/src/features/game-kit/model.ts` — event contract, reducer/state, configurable XP reward values and five explorer levels.
- `apps/mobile/src/features/game-kit/mock-content.ts` — demo route, discovery categories, mock discoveries, challenges, collectibles, and badge metadata.
- `apps/mobile/src/features/game-kit/GameKitComponents.tsx` — reusable compact adventure HUD, discovery card, checkpoint status editor, badge reward card, and reduced-motion-aware event feedback effect.
- `apps/mobile/src/features/game-kit/model.test.ts` — reducer, checkpoint, XP, level, badge idempotence, and progress tests.
- `apps/mobile/app/game-kit-playground.tsx` — standalone developer/QA simulation surface with controls and feedback.
- `apps/mobile/app/index.tsx` — development-only entry point (`__DEV__`).
- `docs/design/game-kit-foundation.md` — this architecture/scope record.

## Playground coverage

The playground can simulate starting an adventure; nearby and reached checkpoints; the five checkpoint states (`LOCKED`, `NEARBY`, `AVAILABLE`, `DISCOVERED`, `COMPLETED`); discoveries from Historia, Naturaleza, Fauna, Flora, Geología, Patrimonio, Secreto, and Mirador; challenge unlock; XP; manual badge unlock/replay; collectible found; route progress; route completion; and a short multi-event demo sequence.

The HUD preview sits above a purely decorative conceptual map and includes progress, distance, elapsed time, checkpoints found/total, XP, explorer level progress, and the next discovery. There are no map tiles, coordinates, route directions, or location services in this preview. Feedback is implemented with the React Native Animated API and respects the system Reduce Motion preference; the vibration label is explicitly simulated and no haptics API is called.

## Mock data disclosure

The route “El secreto de Mágina”, its checkpoints, points of interest, stories, route geometry concept, challenges, and reward narrative are fictional UI fixtures. The interface and copy explicitly label them `MOCK` / `DEMO FICTICIO`; no historical statement or real-world trail recommendation is asserted.

## XP / levels

Values are centralized in `XP_REWARDS` and are provisional: checkpoint 50 XP; normal discovery 100 XP; secret 200 XP; challenge 75 XP; collectible 25 XP; route completion 500 XP. Levels begin at 0, 200, 500, 900, and 1,400 XP for Explorador I–V. This is a test balance, not a finalized product economy.

## Dependencies and risk

No runtime or test dependencies were added. Effects use `Animated` from the existing React Native dependency. The only product-facing surface is a `__DEV__`-gated link. Main risks are mock content accidentally being mistaken for a real route (mitigated with a persistent disclaimer and fictional names) and future adapters widening into production engine changes (explicitly deferred to a separate, scoped integration effort).

## Tests and evidence

- Automated tests cover the pure reducer and progression rules (see `model.test.ts`).
- CI is the repository `.github/workflows/ci.yml` workflow, which typechecks, runs unit tests, runs Android Expo prebuild, enforces pure-package dependency boundaries, and runs local Supabase database checks.
- Screenshot evidence was not available in this sandbox: Expo web export reports that the existing app has no `react-dom` / `react-native-web` renderer installed. Those dependencies were not added solely to capture a screenshot. The native development route remains reachable in an authenticated development build through the `__DEV__` entry point.

## Explicitly not done

- Not connected to live GPS, location permissions, the production Adventure Engine, real route checkpoints, or real discovery content.
- No persistence, cross-session progression, pause/resume, crash recovery, server writes, physical walking, or APK hardware validation.
- No production balance/content approval and no PR merge.
