# Claude + Codex Handoff Protocol

## Goal

Allow Claude Code and Codex to work on Mágina Aventura without competing writes or unreviewed native dependency changes.

## Parent planning branch

`feat/adventure-game-kit-v1`

This branch owns:
- architecture;
- game-event core;
- agent instructions;
- research;
- task breakdown.

Do not use two agents to write to this branch at the same time.

## Child branch pattern

Create one branch per gate:

- `feat/game-02-haptics-audio`
- `feat/game-03-reanimated-fx`
- `feat/game-04-lottie-runtime`
- `feat/game-05-turf-geo`
- `feat/game-06-maplibre-game-layer`
- `feat/game-07-skia-fx`
- `spike/game-08-rive-nitro`
- `feat/game-09-ai-assets`
- `feat/game-10-full-integration`

The next native gate starts only after the previous gate is green and its intended base is clear.

## Ownership model

For each gate:

### Implementer
One agent owns writes:
- code;
- package/lock;
- tests;
- docs;
- CI fixes inside scope.

### Reviewer
The other agent is read/review-first:
- inspect diff;
- find race/startup risks;
- check spec;
- check tests;
- check license/source;
- suggest changes via PR review/comment.

Do not let both agents independently “fix” the same file.

## Suggested specialization

Not mandatory, but useful:

### Codex
Prefer for:
- TypeScript architecture;
- native dependency integration;
- CI;
- tests;
- MapLibre/Turf implementation;
- performance/debug fixes.

### Claude
Prefer for:
- UX coherence;
- Game FX behavior/spec;
- screen-by-screen visual audit;
- asset/style system;
- independent code review;
- acceptance-criteria review.

Roles can swap, but only one writer per gate.

## High-conflict files

Single-writer only:
- `apps/mobile/package.json`
- `pnpm-lock.yaml`
- `apps/mobile/app.json`
- root workflow files
- `RouteMap.tsx`
- `GameRuntimeProvider.tsx`

## Agent prompt header

Every task should start with:

```text
Repository: izc05/izc05-magina-aventura
Read AGENTS.md first.
Read docs/game relevant to this issue.
Issue: #<number>
Base branch: <branch>
Target branch: <branch>
Do not modify main.
Do not implement the next gate.
Report exact tests/build/CI status.
```

## Native dependency rule

When a gate adds a native dependency:
1. implementer is the only writer to package/lock/app config;
2. run Expo-compatible install;
3. prebuild Android;
4. CI;
5. physical cold start/reopen;
6. reviewer inspects before next runtime is added.

## Review checklist

Reviewer answers:
- Is domain still independent of renderer?
- Does the feature degrade safely?
- Does it work offline where required?
- Does it respect reduced motion?
- Does it leak hidden discovery coordinates?
- Does it preserve map attribution?
- Does it add startup risk?
- Is third-party reuse licensed/documented?
- Are tests testing behavior instead of snapshots only?

## Expo agent tooling

Expo currently publishes official agent integrations/skills. Agents may use the official Expo integration when available, especially for:
- SDK compatibility;
- package installation;
- prebuild/native configuration;
- upgrade/config diagnostics.

This tooling does not override repository rules or the one-writer policy.
