# External Location-Game Reference Patterns

This research is for architecture/pattern reuse. It is **not** permission to copy code from repositories without a compatible license.

## 1. LootDropX/Solana-Mobile — pattern reference only

Status observed: active 2026 React Native/Expo GPS scavenger-hunt project.

Useful patterns:
- nearby items loaded by geospatial backend;
- local GPS proximity as a fast pre-flight;
- authoritative validation on a trusted backend/system before valuable reward;
- pulsing map markers;
- rarity tiers influencing visual emphasis;
- inventory/progression after claim;
- haptic celebration;
- Supabase/PostGIS architecture.

Why it matters to Mágina:
- validates the split `client proximity UX -> server-authoritative reward`;
- rarity can map to discovery presentation without changing core proximity truth.

Restriction:
GitHub repository metadata does not declare a license. **Do not copy source code.** Study architecture/UX only.

Also its Expo/RN versions are older than our app; do not copy dependency versions.

## 2. StoutsHonor/GP-Scavenger — idea/reference only

Old React Native GPS scavenger-hunt project.

Useful product patterns:
- reach marker to advance;
- riddle/question challenge;
- visible/invisible markers;
- user-selectable order;
- timed/race/cooperative modes;
- sensor/QR/AR ideas.

Restrictions:
- old 2017 stack;
- no repository license detected;
- no source copying.

Use only to inspire future Game Mode contracts.

## 3. gorjanz/rn-treasure-hunt — concept only

Flow:
- sequential checkpoints;
- puzzle/passphrase;
- next checkpoint unlock;
- photo capture.

License:
GPL-3.0.

Decision:
do not copy/adapt its source into the current product unless a deliberate GPL-compatible licensing decision is made. Product-flow ideas are generic and can be independently implemented.

## 4. Evitras background geolocation SDK — hardening reference

Repository:
`Evitras-Technologies/geo-location-sdk`

License:
MIT.

Interesting implementation areas:
- motion-detection state machine;
- background service survival;
- SQLite queue;
- HTTP sync;
- Android OEM/battery hardening;
- headless/background behavior;
- geofence swapping.

Current limitations reported by project:
- early release;
- limited field testing;
- iOS implementation not yet compiled/tested by maintainers.

Decision:
**do not replace our Activity Engine**.

Use as a reference/checklist later for:
- Android OEM survival;
- battery strategy;
- boot/termination recovery;
- foreground service hardening.

Any substantial code reuse requires THIRD_PARTY_NOTICES.

## 5. @rn-org/react-native-geofencing — optional low-power reference

License:
MIT.

Modern TurboModule/native geofence package.

Important behavior:
OS geofencing is not a substitute for our exact checkpoint/discovery verifier. Native geofence services can use larger practical radii and may deliver events with latency, especially in background conditions.

Possible future role:
- low-power wake/nearby hint;
- broad region trigger.

Not suitable as sole authority for:
- exact discovery unlock;
- route checkpoint verification;
- XP/reward.

Our consecutive-sample Activity/Exploration Engine remains source of truth.

## 6. MapLibre v11 — mandatory modern API

Current app already uses MapLibre React Native v11.x.

Agent warning:
many internet examples use v10-era APIs. v11 requires New Architecture and consolidated layer APIs.

When reading old examples:
- translate old dedicated layers to current `Layer` API;
- check current event/camera prop names;
- prefer repository v11 docs/examples.

Do not downgrade MapLibre just to make an old tutorial work.

## 7. Architecture patterns accepted from external research

Accepted patterns:
- local UX check + authoritative validation;
- rarity-driven presentation;
- sequential prerequisites;
- hidden/hinted/visible objective states;
- photo/riddle/QR challenges as separate future challenge types;
- simulator/replay for GPS gameplay tests;
- broad OS geofence only as optional efficiency hint.

Rejected patterns:
- client-only valuable reward authority;
- single GPS sample unlock;
- direct copying from unlicensed/GPL examples;
- replacing our tested Activity Engine with an early third-party tracker;
- old React Native dependency stacks.
