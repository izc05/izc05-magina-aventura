# MA-001 Beta Experience Plan

> Status: planned after Phase 4C device hardening. This document is implementation guidance for agentic workers; it does not authorize changes to `main` or merges.

## Goal

Convert MA-001 into the canonical reference adventure for Mágina Aventura: a route that can be studied before leaving, downloaded as an integral offline package, completed with poor connectivity, explored through educational discoveries, and revisited afterwards through a personal adventure journal.

MA-001 is the template for subsequent routes. Route-specific work must live in data/content/admin configuration wherever possible, not in bespoke product code.

## Locked product intent

- Mágina Aventura is not primarily a route recorder. Its differentiation is **discover + learn + explore + enjoy**.
- The map remains the protagonist during an active adventure.
- Checkpoints validate progression; discoveries create narrative and educational value.
- Hidden discoveries must not leak exact solutions before unlock unless editorial policy explicitly says so.
- Real published adventures are offline-first and fail closed when required route data is missing or incompatible.
- Weather is dynamic, timestamped context, never an immutable route truth and never a substitute for official emergency/safety guidance.
- All user-facing factual route/documentary content must be attributable to curated sources in Admin.

## Gate A — Current engine on physical Android

Exit criteria:

- APK installed on a real Android device;
- foreground/background GPS verified;
- screen lock and resume verified;
- process kill/recovery tested;
- intermittent connectivity tested;
- pause/resume/finalize tested;
- no duplicate checkpoints/discoveries;
- track survives recovery and final summary is coherent.

No MA-001 real content should be integrated until this gate is understood.

## Gate B — Integral offline adventure package

Extend the current offline manifest/package model so a real adventure can be prepared as a single compatible version set.

Required package domains:

- PMTiles map asset;
- GPX/route geometry;
- pinned AdventureDefinition;
- checkpoint/discovery target definitions;
- preparation/safety dossier;
- documentary discovery records;
- essential media assets;
- content/version hashes and compatibility metadata.

Production behavior:

- show package size before download when known;
- download/update with visible progress and recoverable errors;
- verify hashes/version compatibility;
- expose `Ready offline` state;
- block start of a real published adventure unless the required package is ready;
- DEV synthetic harness remains explicitly exempt and isolated.

## Gate C — Pre-route dossier

The route detail and preparation flow must answer the questions a hiker needs before travelling:

- What is the route and why is it interesting?
- Where does it start and how do I access it?
- Distance, duration, ascent/descent, altitude and difficulty?
- What terrain/conditions should I expect?
- What equipment/water preparation is recommended?
- Are there current safety incidents or closures?
- What broad categories will I discover without spoiling the adventure?
- Is the adventure fully downloaded?
- What is the current/forecast weather context and when was it last updated?

Target UI blocks:

- hero + route identity;
- route metrics;
- interactive map + elevation profile;
- access/start information;
- `What you will find` teaser;
- safety/preparation;
- weather card;
- offline package state;
- community preview when Community is integrated;
- final readiness checklist.

## Gate D — Documentary discoveries

Create a reusable editorial schema and renderer for discovery content.

Discovery editorial fields should support:

- title/subtitle;
- category;
- celebration copy;
- short introduction;
- long-form explanation/history;
- observation tips/curiosities;
- source references/credits;
- hero + gallery assets;
- optional audio/video/3D asset references;
- visibility policy: visible / hint / hidden;
- prerequisites/missions;
- discovery-specific safety note.

Unlock behavior:

- before unlock: respect visibility policy;
- on new observation: celebration overlay;
- after unlock: full documentary card becomes available offline;
- after route: unlocked card appears in user collection/journal;
- recovery must never replay a stale celebration as a newly unlocked event.

## Gate E — Route weather

Implement weather as a provider-neutral service behind an internal contract.

Minimum route-weather snapshot:

- observed/forecast timestamp;
- provider/source timestamp;
- temperature;
- feels-like when available;
- precipitation probability/amount when available;
- wind and gusts;
- weather condition summary;
- severe-weather/advisory metadata only when the source provides it reliably.

Rules:

- query by MA-001 route/start/representative coordinates, not by arbitrary device location;
- cache last successful snapshot;
- display `updated X ago` and stale state;
- when offline, show the cached snapshot with its age instead of pretending it is current;
- route can remain usable without live weather;
- weather never overrides explicit route closure/safety data.

## Gate F — During-route information architecture

Without leaving the active session, provide compact access to:

- Route;
- Objectives;
- Safety;
- Weather;
- My progress.

The default screen remains the map/HUD. Secondary information must not obscure navigation or create accidental session loss.

## Gate G — Adventure journal

After completion/recovery, the result becomes a persistent journal entry.

Journal content:

- actual track map;
- distance/time/ascent and GPS evidence summary;
- completed checkpoints;
- unlocked discoveries;
- undiscovered count without mandatory spoilers;
- documentary cards unlocked;
- user photos when Community integration is available;
- validated rewards/achievements only after backend verification;
- future share-to-community hook.

## Gate H — MA-001 editorial production

Using Admin, MA-001 must be curated one item at a time:

- verified GPX/geometry;
- access/start/parking data;
- route metrics;
- safety/preparation dossier;
- checkpoint set;
- discovery set;
- documentary text and sources;
- images/media;
- visibility/hints/prerequisites;
- offline package publication;
- weather reference point/policy.

Every field that can be data-driven must be managed through Admin or shared content contracts, not embedded in a MA-001-only screen.

## Gate I — MA-001 field beta

Perform the full real-world loop:

`discover route -> study dossier -> check weather -> download adventure -> travel to start -> readiness -> GPS -> checkpoint -> discovery -> pause/recovery -> poor coverage -> finish -> journal -> backend validation`

Collect:

- screenshots;
- GPS/track evidence;
- logs around recovery/errors;
- battery observations;
- map/offline behavior;
- confusing UI moments;
- discovery trigger accuracy;
- content readability outdoors;
- weather freshness behavior;
- post-route journal correctness.

## Scaling rule

Once MA-001 passes, freeze the reusable route template and author MA-002+ through the same contracts. New routes should require primarily:

1. verified geography/GPX;
2. route metadata and safety;
3. curated checkpoints/discoveries;
4. documentary content/media;
5. offline packaging;
6. field validation.

A request for route-specific product code is a design smell unless the route genuinely introduces a new reusable capability.

## Suggested agent allocation

- ChatGPT: canonical product direction, gates, cross-branch review, acceptance criteria.
- Manus: contained implementation blocks, UI/runtime wiring, QA/documentation when branch constraints are explicit.
- Antigravity: larger local/integration work and visual/interaction implementation after reconciling its branch.
- Codex: code review, difficult refactors/integration, CI/debugging and final reconciliation before merge.
- Qwen/Kimi/DeepSeek: second-opinion audits, edge cases, schema/API critique and test suggestions; no unilateral architecture changes.

All agents must obey the repository roadmap, Visual Lock and current canonical branch. No agent may merge to `main` without an explicit integration gate.
