# Beta 02 startup diagnostics bisect plan

This branch is diagnostic-only and starts at `f11e82689f89371d262b990e5ca37367f8cc0ea9`. It does not change product behavior, Adventure Engine, GPS, SQLite, or the Beta 02 feature code.

The API 36 workflow builds the exact checked-out SHA and executes the standalone APK without Metro. If the emulator reproduces the failure, use the following logical isolation order. Each candidate build must run the same install, cold-start, process-liveness, splash-exit, and logcat checks from `scripts/android-startup-smoke.sh`.

| Stage | Files or concern to isolate | Diagnostic build change | Evidence to compare |
| --- | --- | --- | --- |
| Home/index | `apps/mobile/app/index.tsx`, onboarding bootstrap, runtime route list | Keep `RootLayout` and background-task import; replace only the index route with the Beta 01 version | Last `[STARTUP]` phase; `ReactNativeJS`; process exit; screen marker |
| Route Detail | `apps/mobile/app/routes/[slug].tsx`, route-detail presenter | Keep Home/index from Beta 02; replace only Route Detail implementation | Same startup result; bundle import/evaluation errors |
| Map | `apps/mobile/src/map/RouteMap.tsx`, `ActiveAdventureMap.tsx`, map style imports | Keep route screens; remove only rendered map components behind a QA diagnostic switch, without removing native MapLibre from the APK | Native library load errors; screen marker; `MapLibre`/`UnsatisfiedLinkError` |
| Prepare | `apps/mobile/app/routes/[slug]/prepare.tsx`, preparation presenter | Keep Home and Route Detail; replace only Prepare screen with Beta 01 implementation | Startup result plus navigation into Prepare if the first screen passes |
| Active Adventure | `apps/mobile/app/adventure/[slug].tsx`, `use-active-adventure.ts` | Keep earlier groups; replace only Active Adventure path | Runtime errors after route navigation, not startup-only evidence |

A group is implicated only when the diagnostic APK changes from failing to passing and the logcat evidence identifies a corresponding import, native-module load, or render-time exception. An emulator pass is not a device resolution; the physical-device `startup-crash-logcat.txt` remains authoritative.

## Required evidence per candidate

Each candidate run must retain `startup-smoke-logcat.txt`, `startup-smoke-result.txt`, the launch output, and the first-screen screenshot when available. The result file records the resolved activity, final status, and last startup phase. No candidate should be called a fix until the physical-device logcat confirms the same failure is gone.
