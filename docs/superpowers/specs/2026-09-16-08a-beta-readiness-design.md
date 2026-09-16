# Plan 08A — Beta Readiness + Merge Train Design

Date: 2026-09-16
Status: Design approved in chat; implementation pending written-spec review
Branch: `feat/08a-beta-readiness-design`

## 1. Purpose

Mágina Aventura already has multiple implementation lanes with green CI, but the project is not yet equivalent to a verified Android beta. Plan 08A introduces a single, auditable readiness layer that answers one question without guessing:

> Is the current candidate safe to call Beta-ready, and if not, exactly which automated or manual gate blocks it?

This layer does not add product features. It coordinates evidence from the existing GPS, visual, community, gamification/rewards and Admin lanes, defines the dependency-aware merge train, and separates automated proof from physical/staging proof.

## 2. Goals

Plan 08A must:

- provide one source of truth for beta readiness;
- classify every gate as `READY`, `BLOCKED`, `MANUAL` or `NOT_APPLICABLE`;
- never convert a manual test into a fake automated success;
- record evidence for each gate rather than relying on prose status;
- define a dependency-aware integration order for stacked PRs;
- prevent a green leaf PR from being treated as merge-safe if its parent chain is not integrated;
- keep `main` protected and avoid automatic merges;
- distinguish code readiness from deployment readiness and field readiness;
- make Android beta installation the final product-facing target of this phase.

## 3. Non-goals

Plan 08A will not:

- modify GPS algorithms or invent GPS quality thresholds;
- modify the mobile visual implementation;
- change Supabase schemas, RLS, Admin, reward QR or community behavior;
- create production/staging infrastructure automatically;
- mark physical Android GPS tests as passed without real-device evidence;
- merge PRs automatically;
- redesign the reward economy;
- duplicate the Admin reward/ledger/QR implementation.

## 4. Readiness model

Every gate has the following conceptual shape:

```ts
interface BetaGate {
  id: string;
  area: 'integration' | 'ci' | 'android' | 'gps-field' | 'supabase' | 'admin' | 'community' | 'rewards' | 'content';
  mode: 'automatic' | 'manual';
  status: 'READY' | 'BLOCKED' | 'MANUAL' | 'NOT_APPLICABLE';
  summary: string;
  evidence: BetaGateEvidence[];
  blockers: string[];
}
```

`READY` means the required evidence exists and currently passes.

`BLOCKED` means the gate is expected to be verifiable now but has failed, is stale, or has an unmet dependency.

`MANUAL` means code can prepare the test, but a human/device/environment action is still required. A manual gate is not a failure; it is an explicit remaining obligation.

`NOT_APPLICABLE` is allowed only when the selected candidate profile deliberately excludes that capability.

The overall candidate state is derived, not manually typed:

- `BLOCKED` if any required automatic gate is blocked;
- `MANUAL` if automatic gates are ready but one or more required manual gates remain;
- `READY` only when all required automatic and manual gates have valid evidence.

## 5. Evidence model

Evidence must be inspectable. Supported evidence classes include:

- Git commit SHA;
- GitHub PR number + head SHA;
- GitHub Actions workflow run ID + conclusion;
- Android build/prebuild result;
- Supabase reset/contract-test result;
- staging URL/smoke-test record when staging exists;
- device field-test record containing device/app build/test checklist;
- signed-off content checklist for the selected pilot route.

A gate may not be marked ready from a statement such as “this passed earlier”. Evidence tied to a stale head SHA is stale and must not count for a changed branch.

## 6. Integration lanes and merge train

The readiness layer treats current work as dependency lanes. Exact PR heads are discovered at evaluation time; PR numbers below describe the current topology and are not hardcoded as permanent product logic.

### 6.1 GPS + exploration + progression + rewards lane

Current dependency chain:

`#3 GPS → #7 exploration → #9 collections → #11 XP/levels → #13 stats → #14 badges → #15 challenges/seasons → #18 rankings → #19 progression cycle → #20 olive grants → #21 outbox → #22 validation → #23 reward delivery`

Rules:

- a child cannot be considered integration-ready while its parent is not landed or explicitly retargeted onto the landed parent;
- after each parent lands, the next PR must be refreshed/retargeted and its final head reverified;
- field GPS validation remains a separate manual gate even if every PR in the chain has green CI.

### 6.2 Identity + community lane

Current dependency chain:

`#4 Auth/profiles → #5 Community Foundation → #6 Community Mobile`

Rules:

- database/RLS contracts must be green at the exact integration head;
- mobile community must not be treated as ready before the identity/community backend chain is integrated;
- authenticated Community write flows are explicitly deferred from the initial internal Android beta and must appear as `NOT_APPLICABLE` for that profile, not as silently passing.

### 6.3 Visual Android lane

Current dependency chain:

`#10 identity/onboarding → #12 route flow → #16 active adventure visual → #17 adventure summary`

Rules:

- the visual lane is presentation only and must not be used as evidence that GPS/rewards are operational;
- demo states remain honest until connected to integrated runtime services;
- final Android candidate must be tested after the visual lane and runtime lanes meet on the same candidate SHA.

### 6.4 Admin lane

Current lane:

`#8 Admin Platform`

Admin remains a separate integration lane because it includes its own Supabase migrations, RBAC, ledger, partner/reward and QR redemption controls.

Before integration with reward-domain work, Beta Readiness requires a compatibility review of:

- `olive_transactions` identity/idempotency assumptions;
- level/challenge reward fields;
- reward/outbox source keys;
- partner/reward/redemption ownership;
- database migration ordering.

No duplicate schema is introduced by Plan 08A.

## 7. Proposed integration strategy

The default strategy is dependency-first and lane-isolated:

1. verify `main` as the baseline candidate;
2. integrate or retarget each stacked lane parent-to-child, never leaf-first;
3. after each integration step, run the complete repository CI at the new candidate SHA;
4. reconcile cross-lane boundaries before combining Admin with runtime/reward work;
5. construct one Android beta candidate SHA containing the selected visual + runtime + backend capabilities;
6. execute staging/manual gates against that exact candidate;
7. do not label the beta `READY` until physical GPS and staging smoke evidence point to that candidate/version.

This design intentionally does not prescribe automatic merging. Integration remains a human-authorized operation.

## 8. Automated gates

The initial required automatic gate set is:

### Repository integrity

- clean dependency graph for the selected PR train;
- no required PR with unresolved merge conflict;
- selected heads trace to the intended parent/base;
- no accidental product-file overlap from a supposedly isolated lane.

### CI

- TypeScript/typecheck;
- unit tests;
- Android Expo prebuild;
- pure package boundary checks;
- Supabase CLI startup/reset;
- database contract tests/pgTAP;
- Admin-specific tests when Admin is part of the candidate.

### Domain/runtime contracts

- exploration/retry idempotency tests;
- progression retry/idempotency tests;
- reward grant/outbox/validation/delivery tests;
- community RLS/contracts only for candidate profiles that include Community.

An automated gate becomes `BLOCKED` if its evidence is missing for the current candidate head, even if an older branch run was green.

## 9. Manual gates

### Android install/smoke

Required evidence:

- installable Android build on a physical device;
- app launches from a cold start;
- splash/onboarding/navigation render correctly;
- route detail/preparation/adventure/summary loop is navigable;
- no fatal crash during the smoke run.

### GPS field test

Required on a physical Android device for the selected pilot route:

- foreground tracking;
- background tracking;
- screen-locked tracking;
- recovery after app process interruption/closure according to supported design;
- route progress;
- off-route behavior;
- checkpoint/discovery proximity evidence;
- no duplicated unlock on retry/recovery;
- final activity can synchronize or produce the expected offline pending state.

The field test must record app version/build and candidate SHA.

### Supabase/Admin staging smoke

Once a staging project exists:

- migrations apply from a clean database;
- first authorized Super Admin can authenticate;
- RBAC prevents unauthorized admin actions;
- route/content operations needed for the pilot work;
- append-only olive ledger invariant holds when reward validation is included;
- no service-role credential is exposed to browser/mobile clients.

Physical/partner QR redemption is not a blocking gate for `android-internal-beta`; it becomes required for the later public/reward-enabled profile.

### Pilot content

For the selected Bedmar/Sierra Mágina pilot route:

- route geometry/GPX reviewed;
- distance/elevation metadata coherent;
- checkpoints/discoveries have real coordinates/content;
- safety/route-status information present;
- offline map/package expectation defined;
- no fabricated official data.

## 10. Candidate profiles

The readiness system supports explicit candidate profiles so unfinished optional features do not create ambiguous status.

### `android-internal-beta`

Required areas:

- route catalogue/detail;
- visual onboarding/navigation;
- active adventure runtime;
- GPS/offline/recovery;
- exploration/checkpoints/discoveries;
- progression domain;
- reward-domain validation/idempotency contracts;
- backend/auth required by the selected runtime flow;
- Admin/staging capabilities needed to provision real pilot content and inspect authoritative state.

Explicitly deferred (`NOT_APPLICABLE` for this profile):

- authenticated Community write flows;
- public moderation operations not needed by the pilot;
- partner-facing physical reward handoff;
- real bottle redemption/canje QR.

This keeps the first beta focused on proving the core promise: install the app on Android, follow a real Sierra Mágina route, track it robustly, discover/check in at real points, finish the adventure, and produce trustworthy progression/reward state.

### Later profile: `public-beta`

The later public beta promotes Community, moderation, partner/reward operations and one-time QR redemption to required gates, along with the corresponding operational and security smoke tests.

## 11. Readiness report

Implementation should produce a machine-readable readiness artifact plus a concise human-readable summary.

Conceptual machine output:

```json
{
  "candidate": "<sha-or-version>",
  "profile": "android-internal-beta",
  "state": "MANUAL",
  "automatic": { "ready": 18, "blocked": 0 },
  "manual": { "ready": 1, "remaining": 2 },
  "gates": []
}
```

The human summary must answer:

- what is green;
- what is blocked;
- which manual actions remain;
- which exact candidate/build the evidence applies to;
- whether the candidate is safe to install for internal testing.

## 12. Failure and staleness behavior

The readiness layer is conservative:

- changed head SHA invalidates older CI evidence for that branch/candidate;
- missing evidence blocks automatic readiness rather than defaulting to green;
- a failed manual test remains recorded until a later passing test for the same candidate or an explicitly identified successor candidate supersedes it;
- merging/rebasing changes the candidate identity and requires appropriate re-verification;
- failures never silently downgrade a required gate to optional.

## 13. Security and privacy

Readiness artifacts must not contain:

- Supabase service-role keys;
- user auth tokens;
- private location tracks from field testers unless explicitly sanitized/approved;
- raw QR redemption secrets;
- private user/community content.

Field-test evidence should use coarse test metadata and identifiers sufficient for reproducibility without publishing unnecessary personal route history.

## 14. Testing strategy for Plan 08A itself

Implementation must use TDD where logic is introduced.

At minimum, tests must prove:

- overall state precedence: `BLOCKED` > `MANUAL` > `READY`;
- stale evidence does not satisfy a gate;
- manual gate cannot become ready from CI evidence;
- optional/`NOT_APPLICABLE` gates do not block the selected profile;
- dependency child is blocked while required parent is not integrated/retargeted;
- deterministic report ordering/output;
- no automatic merge action exists in the readiness module.

CI must remain green after introducing the readiness layer.

## 15. Definition of Done for Plan 08A

Plan 08A code is complete when:

- the readiness model and candidate profile are implemented and tested;
- current repository/CI evidence can be projected into a deterministic report;
- dependency/merge-train blockers are visible;
- manual Android, GPS and staging gates can be recorded without faking automation;
- CI is green on the final Plan 08A head;
- the PR is Ready for Review;
- `main` remains untouched until explicit integration authorization.

The Mágina Aventura beta itself is only `READY` after the manual gates for the chosen candidate have real evidence.

## 16. Next step after written-spec approval

After this specification is reviewed and approved, create the implementation plan for Plan 08A. The first implementation slice should be the pure readiness-domain model and tests, followed by evidence adapters/reporting. No product lane should be modified as part of 08A.