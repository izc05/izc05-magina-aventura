# FX Reuse Recipes — Reanimated / Lottie / Skia / Rive

Use this document before implementing GAME-03, GAME-04, GAME-07 or GAME-08.

The objective is to adapt maintained upstream patterns, not invent animation infrastructure.

## Reanimated — GAME-03

Source: `software-mansion/react-native-reanimated` (MIT).

### Badge wobble / discovery emphasis
Reference:
`docs/docs-reanimated/src/examples/SequenceWobble.tsx`

Pattern:
- `useSharedValue`
- `withSequence`
- bounded `withRepeat`
- `withTiming`
- animated transform

Mágina use:
- badge enters, settles, one short wobble;
- rare discovery emphasis.

Do not create infinite wobble loops.

### Cancellation / navigation safety
Reference:
`docs/docs-reanimated/src/examples/CancelAnimation.tsx`

Pattern:
- keep shared value;
- use `cancelAnimation` when effect is aborted/unmounted.

Mágina requirement:
Game FX must stop cleanly if the user pauses, exits or navigates away.

### Reduced motion
Reference:
`docs/docs-reanimated/src/examples/UseReducedMotion.tsx`

Pattern:
- `useReducedMotion()`;
- substitute static/low-motion transform.

Mágina requirement:
Every repeating/pulsing/large movement component has a reduced-motion path.

### Suggested first recipes

#### XPBurst
```text
0ms      opacity 0 -> 1, scale .85 -> 1
150ms    +XP number settles
500ms    translateY small negative
800ms    opacity -> 0
```

#### GameToast
```text
enter 180-250ms
hold 900-1400ms
exit 180-250ms
```

#### BadgeUnlock
```text
scale .6 -> 1.05 -> 1
optional bounded wobble
no infinite loop
```

---

## Lottie — GAME-04

Source: `lottie-react-native/lottie-react-native` (Apache-2.0).

Current upstream requirement:
- modern React Native;
- New Architecture for current line.

Our RN 0.86/New Architecture satisfies the framework direction, but the exact package version must be build-tested in the gate.

Use only for effects difficult/expensive to recreate in code:
- badge celebration;
- rare discovery;
- route complete.

Preferred V1:
- local bundled JSON;
- `autoPlay`;
- `loop={false}`;
- explicit fixed container size;
- completion callback only for UI lifecycle, never domain truth.

Fallback:
static badge/image + Reanimated scale/fade.

Asset rule:
Lottie renderer license and Lottie asset license are separate. Every downloaded animation must have its own asset provenance/license.

---

## Skia — GAME-07

Source: `Shopify/react-native-skia` (MIT).

### Soft halo / atmospheric FX
Reference:
`apps/example/src/Examples/Breathe/Breathe.tsx`

Useful primitives:
- `Canvas`
- `Circle`
- `Group`
- `BlurMask`
- Reanimated `useDerivedValue`
- bounded transform/scale

Mágina use:
- active-objective halo;
- soft rare-discovery aura;
- a few olive leaves/dust motes.

Do NOT:
- draw the map in Skia;
- put a full-screen permanent Skia Canvas over MapLibre without profiling;
- spawn unbounded particles.

Performance fallback:
Skia off -> Reanimated/MapLibre static pulse.

---

## Rive Nitro — GAME-08 spike only

Source: `rive-app/rive-nitro-react-native` (MIT).

Current repository includes:
- `expo57-example`;
- React 19 / RN 0.86 example stack;
- Reanimated 4.x;
- Worklets;
- Nitro modules.

Upstream requirements include:
- RN 0.78+;
- Expo 53+;
- Android SDK 24+;
- Nitro Modules.

Candidate Mágina spike:
one interactive compass or badge.

Use Rive when state machines/data binding materially simplify:
```text
idle -> nearby -> discovered -> completed
```

Do not use Rive:
- for simple +XP text;
- for static badges;
- at splash/startup;
- as a requirement to start a route.

Spike measurements:
- Android build success;
- APK size delta;
- cold-start impact;
- time to first render;
- memory while map active;
- failure fallback.

Because the runtime is still moving quickly, use the upstream `expo57-example` as the compatibility baseline instead of generic web tutorials.

---

## Map FX interaction

Map effects should first prefer MapLibre's own animated layers where they are a good fit.

Use:
- MapLibre `PulseCircleLayer` adaptation for objective pulse;
- MapLibre animated route examples for route progress;
- Reanimated for React HUD cards/text;
- Skia only for decorative FX that MapLibre/Reanimated do not handle cleanly.

Avoid rendering the same pulse simultaneously in MapLibre + Reanimated + Skia.

---

## Runtime selection table

| Effect | Primary | Fallback |
| --- | --- | --- |
| +XP number | Reanimated | static toast |
| HUD toast | Reanimated | static card |
| checkpoint halo | MapLibre Animated.Layer | static MapLibre circle |
| discovery reveal | Reanimated/Lottie | static discovery card |
| badge unlock | Lottie + Reanimated shell | static badge + scale |
| route completion | Reanimated/Lottie | static summary |
| particles/leaves | Skia | none/simple Reanimated |
| interactive compass | Rive spike | normal native/React compass |

---

## Licensing rule

When adapting substantial upstream code:
- record project;
- exact source file;
- license;
- local destination;
- modifications;
in `THIRD_PARTY_NOTICES.md`.

API usage/pattern inspiration alone does not require copying the source notice, but the dependency remains listed in THIRD_PARTY_RESEARCH.
