# Agent Start Prompts — Claude Code + Codex

Use these prompts as starting headers. Replace placeholders only; do not remove the constraints.

---

## Codex — implement a gate

```text
Repository: izc05/izc05-magina-aventura
Task issue: #<ISSUE>
Base branch: <BASE>
Create/work only on branch: <TARGET>

Before changing code, read in order:
1. AGENTS.md
2. docs/game/INTERNAL_REUSE_AUDIT.md
3. docs/game/PORTING_MATRIX.md
4. docs/game/MASTER_IMPLEMENTATION_PLAN.md
5. docs/game/QA_GATES.md
6. the full body of issue #<ISSUE>

If the issue ports historical code, inspect the exact source branch/files listed in the issue before implementing.

Rules:
- Do not modify main.
- Do not implement later gates.
- Do not merge the historical source branch wholesale.
- Port coherent units with their tests.
- Preserve current Expo 57/RN 0.86.2 architecture.
- Never copy historical package.json/lock versions blindly.
- Do not introduce an external library for a capability that our internal historical code already covers unless you document a technical reason.
- Domain/GPS/reward truth must stay independent from Game FX renderers.
- One writer owns package.json/app.json/pnpm-lock for this gate.

Before declaring completion run:
- pnpm typecheck
- pnpm test
- relevant focused tests
- Android Expo prebuild if mobile/native config changed
- full CI

If a native runtime/dependency changed, require physical Android cold start + reopen evidence before calling the gate complete.

Final report must include:
- base SHA
- head SHA
- source historical files reused
- files changed
- dependencies added/changed
- tests and counts/results
- Android prebuild status
- CI run URL/status
- physical APK status if required
- known issues
- explicit confirmation that the next gate was NOT implemented
```

---

## Claude Code — review a Codex gate

```text
Repository: izc05/izc05-magina-aventura
Review issue: #<ISSUE>
PR/branch: <PR_OR_BRANCH>

Read:
- AGENTS.md
- CLAUDE.md
- docs/game/INTERNAL_REUSE_AUDIT.md
- docs/game/PORTING_MATRIX.md
- docs/game/MASTER_IMPLEMENTATION_PLAN.md
- docs/game/QA_GATES.md
- issue #<ISSUE>

Act as reviewer first. Do not rewrite the same files while Codex is actively implementing.

Review for:
1. scope: only this gate;
2. historical reuse: existing code was ported before reinventing;
3. correctness: tests cover behavior and edge cases;
4. architecture: domain does not import visual/native FX;
5. startup safety;
6. offline behavior;
7. GPS/reward idempotency;
8. reduced-motion/fallback behavior when relevant;
9. MapLibre v11 API correctness when relevant;
10. dependency/license/source documentation;
11. no stale Expo 56 package pins;
12. no whole-branch merge from historical branches.

Return:
- blockers
- important improvements
- optional polish
- exact files/lines affected
- whether acceptance criteria are met

Do not approve a native gate without Android build evidence required by QA_GATES.md.
```

---

## Claude Code — implement instead of Codex

If Claude is the writer for a gate, use the Codex implementation prompt above and add:

```text
You are the sole writer for this gate. Codex will review after your branch is stable.
Do not start exploratory visual redesign outside this issue.
```

---

## Codex — review a Claude gate

Use the Claude review prompt, replacing reviewer role with Codex. Focus especially on:
- strict TypeScript;
- idempotency;
- native startup;
- dependency compatibility;
- CI/prebuild;
- performance boundaries.

---

## GAME-00B source prompt (#56)

```text
Source branches are authoritative only as code history:
- feat/adventure-engine-v2/packages/contracts/src/activity.ts
- feat/06f-progression-cycle-foundation/packages/geo/src/nearest-point-on-line.ts

Port, don't wholesale merge.
Keep all packages pure.
```

## GAME-00C source prompt (#57)

```text
Inspect the entire historical directory:
feat/adventure-engine-v2/packages/activity-engine

Port core + exploration + tests as a coherent package.
Do not add Expo Location yet.
Do not add Game FX yet.
```

## GAME-00D source prompt (#58)

```text
Inspect:
feat/06f-progression-cycle-foundation/packages/domain/src/gamification
feat/06f-progression-cycle-foundation/packages/domain/src/collections

Port domain projections + all relevant tests.
No UI/React/Expo dependency.
```

## GAME-00E source prompt (#59)

```text
Inspect:
feat/adventure-engine-v2/apps/mobile/src/activity

Port in stages:
interfaces/controller -> SQLite -> Expo Location/TaskManager.

Historical Location/TaskManager package pins are stale for Expo 57.
Resolve current versions; do not paste old lockfile.
```

## GAME-00F source prompt (#60)

```text
Connect domain facts to apps/mobile/src/game only through an application bridge.

Test recovered/replayed activities for no duplicate XP/badge/discovery visual events.
Do not add animation runtime yet.
```

---

## Visual-runtime prompt rule

For GAME-02 and later visual gates:

```text
GameEffectCommand is the input contract.
The renderer may fail; the route may not.
Implement a static/reduced fallback first or alongside the rich effect.
Do not let Lottie/Skia/Rive determine domain state.
```

---

## Map prompt rule

For GAME-06:

```text
MapLibre v11 is the current API.
Use real route/GPS data.
Do not create an AI map image as cartography.
AI assets are marker/editorial art only.
Preserve map/data attribution.
Merge active-map capabilities into one map boundary rather than adding a third competing map component.
```
