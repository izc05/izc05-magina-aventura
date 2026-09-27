# Dependency Baseline — Adventure Game Kit

Purpose: prevent agents from accidentally changing framework versions while implementing gameplay.

## Current repository baseline

From current package/lock state:

- Node: >= 22.13.0
- pnpm: 10.15.0
- Expo package spec: ~57.0.10
- Expo resolved in lock: 57.0.23
- React: 19.2.3
- React Native: 0.86.2
- TypeScript: ~6.0.3
- MapLibre React Native spec: ^11.3.10
- MapLibre resolved: 11.3.10
- New Architecture: enabled

## MapLibre rule

A newer MapLibre release may exist while the Game Kit work is underway.

Do not upgrade MapLibre in the same PR as GAME-06 unless the upgrade is required to fix a reproduced blocker.

Reason:
- map rendering is a critical runtime;
- layer/API changes and native SDK upgrades can confound game-layer regressions;
- current v11.3.10 already has the APIs needed: `Layer`, `paint/layout`, `Images`, `Animated.Layer`, animated GeoJSON.

If an upgrade is desired, create a separate dependency-only PR with map regression tests.

## Turf observation

The current MapLibre dependency itself resolves several Turf modules internally, including distance/helpers/length/nearest-point-on-line.

This does **not** authorize importing transitive modules from our packages.

If `packages/geo` needs a Turf API:
- add the exact module as a direct dependency;
- prefer modular packages;
- document why internal geo helpers are insufficient;
- test bundle/build.

## Expo-native install rule

For SDK-owned or compatibility-sensitive packages use current Expo tooling rather than hand-copying old versions.

Candidates:
- expo-location
- expo-task-manager
- expo-sqlite
- expo-haptics
- expo-audio
- react-native-reanimated / worklets compatibility

Historical feature branches can supply implementation logic, but not dependency pins.

## Rive spike rule

Do not copy the upstream Expo 57 example package versions wholesale.

Use it to confirm architecture compatibility, then resolve versions against this repository's current Expo/RN baseline.

Rive adds Nitro Modules and therefore must remain isolated in GAME-08 until build/startup evidence is good.

## Dependency change report

Every native/dependency gate reports:
- previous version;
- requested spec;
- resolved lock version;
- reason;
- Expo doctor/prebuild result;
- APK/cold-start result when native.
