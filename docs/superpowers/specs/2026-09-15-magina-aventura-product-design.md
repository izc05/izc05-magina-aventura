# Mágina Aventura — Product & Architecture Design

**Date:** 2026-09-15  
**Status:** Approved product direction  
**Repository:** `izc05/izc05-magina-aventura`

## 1. Product definition

Mágina Aventura is a standalone, mobile-first hiking application for discovering Sierra Mágina by walking real routes.

It combines four experiences without becoming a generic tourism portal:

1. **Premium route discovery** before the hike.
2. **Sports tracking** during the hike, similar in spirit to Strava: GPS track, distance, time, pace/speed, elevation and route progress.
3. **Location-based exploration** during an active route, inspired by the interaction model of Pokémon GO but with original Mágina Aventura identity and real Sierra Mágina content.
4. **Long-term progression** through XP, levels, achievements, collections, challenges, rankings and rewards.

The product must be useful even for a user who never uses Mi Olivo or Mi Campo.

### Product promise

> **Camina. Descubre. Conquista Mágina.**

### Core loop

`discover route → prepare → start adventure → walk → reach checkpoints/discoveries → earn XP/rewards → finish → validate activity → update progression/rankings → choose another route`

Mágina Aventura must feel like a serious premium hiking application outside an active route and like a game/exploration experience during an active route.

---

## 2. Scope boundaries

### Mágina Aventura owns

- route discovery and filtering;
- route detail pages;
- GPX/route geometry;
- map and offline route preparation;
- GPS activity tracking;
- live route progress;
- checkpoints;
- location-based discoveries;
- collections;
- XP and adventure levels;
- hiking achievements;
- challenges and seasons;
- hiking/exploration rankings;
- adventure profile and statistics;
- activity validation and anti-cheat signals;
- Mágina Aventura reward earning records;
- administration of routes, discoveries, challenges, achievements and moderation.

### Mágina Aventura does not own

- Mi Campo;
- agricultural campaigns, treatments, irrigation or farm management;
- the visual state/evolution logic of Mi Olivo;
- the global rewards catalogue or QR redemption at almazaras;
- general news, tourism directories or large independent town modules.

Those systems may connect later through stable contracts, but they must not become dependencies of the core hiking experience.

---

## 3. Relationship with Mi Olivo and the wider ecosystem

Mágina Aventura is independently usable and independently deployable.

Mi Olivo is a separate product/module. Mágina Aventura can award **aceitunas** through a shared reward contract, but it must not know how Mi Olivo grows, renders or redeems rewards.

Three concepts stay separate:

- **XP:** adventure progression inside Mágina Aventura.
- **Achievements/insignias:** proof of real accomplishments inside Mágina Aventura.
- **Aceitunas:** transferable ecosystem reward units earned from verified activity and special goals.

The integration boundary is event-based. Example event shape:

```json
{
  "eventId": "uuid",
  "eventType": "reward.earned",
  "source": "magina-aventura",
  "userId": "uuid",
  "activityId": "uuid",
  "xp": 530,
  "olives": 75,
  "achievementIds": ["uuid"],
  "occurredAt": "2026-09-15T10:00:00Z"
}
```

The event must be stored in an outbox/ledger so external consumers can process it idempotently later.

---

## 4. Primary user experience

### 4.1 App entry — Discover routes

The default entry is not a game map. It is a premium hiking catalogue.

Primary navigation:

- **Rutas**
- **Retos**
- **Colecciones**
- **Ranking**
- **Perfil**

The route home contains:

- strong Sierra Mágina photography;
- search;
- filters by municipality, difficulty, distance, duration and elevation;
- featured routes;
- nearby/relevant routes when location permission exists;
- seasonal recommendations;
- routes in progress or previously completed;
- active challenges connected to routes.

Each route card prioritizes:

- photo;
- route name;
- municipality;
- distance;
- difficulty;
- elevation gain;
- estimated duration;
- number of discoveries;
- potential XP/aceitunas.

### 4.2 Route detail

A route detail page contains:

- hero photography;
- route name and municipality;
- distance;
- difficulty;
- estimated duration;
- elevation gain/loss;
- minimum/maximum altitude when available;
- map and official route geometry;
- elevation profile;
- route description;
- access/start point information;
- safety notes;
- water/source information where verified;
- relevant weather context;
- checkpoints;
- discoverable categories without necessarily revealing every exact secret location;
- expected rewards and available achievements;
- offline download status;
- prominent **Iniciar aventura** action.

### 4.3 Adventure preparation

Before starting, the app runs a short readiness screen:

- location permission state;
- background-location permission state;
- GPS availability;
- offline map/route package status;
- battery warning when useful;
- route safety notice;
- optional confirmation of route download;
- clear start button.

Lack of network coverage must not block a route whose essential data was downloaded beforehand.

### 4.4 Active Adventure mode

After starting a route, the UI changes to a dedicated live experience.

The map dominates the screen and shows:

- current user position;
- official route line;
- recorded user track;
- route direction/progress;
- next checkpoint;
- nearby discoveries;
- interaction radius where appropriate;
- off-route warning state;
- recenter/orientation controls.

Top HUD displays a compact set of live metrics:

- completion percentage;
- distance;
- elapsed/moving time;
- elevation gain;
- optional current altitude/pace through secondary view.

Bottom controls expose:

- next objective;
- pause/resume;
- route/safety actions;
- finish action with protection against accidental termination.

The map may use a tilted, heading-aware camera to make movement feel like exploration, while preserving hiking usability and clarity.

### 4.5 Discoveries

Discoveries are real Sierra Mágina elements, not random fictional spawns.

Six initial collection families:

1. Flora
2. Fauna
3. Patrimonio
4. Olivar
5. Tradiciones
6. Paisaje

A discovery can have:

- geographic trigger/area;
- category;
- name;
- description;
- images;
- rarity/special status;
- XP reward;
- aceitunas reward;
- prerequisites when applicable;
- seasonal availability when scientifically or culturally justified;
- hidden/silhouette state until found.

The interaction pattern is:

`unknown/nearby → approach → enter valid zone → discovery presentation → server-backed award → collection update`

The app must avoid claiming the user discovered something solely from an unreliable GPS sample.

### 4.6 Checkpoints

Checkpoints are route-verification and gameplay locations.

They can be:

- required route checkpoints;
- optional scenic checkpoints;
- discovery-linked checkpoints;
- challenge checkpoints.

A route completion can require a configurable combination of route coverage and required checkpoints.

### 4.7 End-of-route summary

Finishing a route creates an activity summary inspired by modern sports apps but styled for Mágina Aventura.

It shows:

- route;
- recorded map/track;
- distance;
- elapsed and moving time;
- elevation gain/loss;
- pace/speed summary;
- discovered items;
- checkpoints completed;
- personal bests when meaningful;
- provisional XP/aceitunas/achievements while validation is pending;
- final verified rewards after server validation.

---

## 5. Activity lifecycle and validation

Activities follow explicit states:

`DRAFT → ACTIVE → PAUSED (optional) → FINISHED → VALIDATING → VERIFIED | FLAGGED | REJECTED → REWARDED`

The client records evidence; the server is authoritative for verified rewards and ranking eligibility.

Validation signals include:

- route geometry coverage;
- required checkpoint presence;
- GPS sample accuracy;
- impossible jumps;
- implausible hiking speeds;
- timestamp consistency;
- distance consistency;
- suspicious repeated data;
- device/runtime integrity signals where reasonably available;
- whether the activity originated from a permitted offline flow.

The system must tolerate normal GPS noise and mountain conditions. Anti-cheat must not punish ordinary hikers for temporary loss of signal.

Only server-verified activity can produce final reward ledger entries used for valuable ecosystem rewards.

---

## 6. Sports tracking model

An activity records enough information to produce trustworthy hiking statistics without requiring continuous network access.

Core captured fields per track sample:

- latitude;
- longitude;
- timestamp;
- horizontal accuracy;
- altitude when available;
- vertical accuracy when available;
- speed when available;
- heading when available.

Derived metrics include:

- total distance;
- moving distance;
- elapsed time;
- moving time;
- average moving pace/speed;
- elevation gain;
- elevation loss;
- min/max elevation;
- route completion percentage;
- checkpoint completion;
- discovery completion.

Raw tracking remains available for validation, while user-facing summaries use cleaned/derived data.

---

## 7. Offline behavior

Offline route use is a first-class requirement.

Before a hike, the user can download:

- route geometry;
- essential route metadata;
- checkpoints;
- discovery trigger metadata required during the route;
- required map region/tiles within configured limits;
- safety information.

During offline activity:

- tracking continues locally;
- checkpoints/discoveries can be detected locally from signed/versioned downloaded data;
- rewards remain provisional;
- events queue locally;
- data synchronizes when connectivity returns;
- the server validates before final rewards and rankings are updated.

---

## 8. Progression

### 8.1 XP and levels

XP belongs to Mágina Aventura.

Users earn XP from verified actions such as:

- completing routes;
- first completion of a route;
- route variety;
- discovering items;
- completing challenges;
- unlocking achievements;
- exploring new municipalities;
- selected seasonal events.

Repeated grinding of one easy route must have diminishing value where needed.

Initial progression names:

- Level 1: **Caminante**
- Level 5: **Senderista**
- Level 10: **Explorador**
- Level 20: **Montañero**
- Level 30: **Guardián de Mágina**
- Level 40: **Maestro de la Sierra**
- Level 50: **Leyenda de Mágina**

Thresholds and rewards must be data-driven, not hard-coded into UI components.

### 8.2 Achievements / insignias

Achievements represent real accomplishments and cannot be purchased.

Examples:

- first verified route;
- 50 km total;
- 500 km total;
- 1,000 m cumulative ascent;
- multiple unique routes;
- municipality completion;
- specific landmark/discovery achievements;
- seasonal achievements.

### 8.3 Aceitunas

Aceitunas are ecosystem rewards, not adventure levels.

Sources can include:

- verified route completion;
- discovery milestones;
- challenge completion;
- achievements;
- special events.

Reward amounts are configurable server-side and recorded in an immutable/auditable ledger.

---

## 9. Challenges and seasons

Challenges create reasons to return and diversify exploration.

Supported categories:

- daily/lightweight challenges where appropriate;
- weekly challenges;
- municipality challenges;
- distance/elevation challenges;
- collection/discovery challenges;
- seasonal challenges;
- event/sponsored challenges subject to clear labelling and fair reward rules.

A challenge specifies:

- availability window;
- eligibility;
- completion rule;
- progress source;
- XP reward;
- aceitunas reward;
- achievement/collectible reward if any.

Seasons provide a bounded competitive period and can have their own achievements and rankings without deleting historical lifetime progress.

---

## 10. Rankings

Mágina Aventura has multiple ranking views so speed alone does not dominate the product.

### Senderista ranking

Weighted toward:

- verified unique routes;
- distance;
- elevation;
- consistency.

### Explorador ranking

Weighted toward:

- discoveries;
- collections;
- municipalities;
- variety of routes/territory.

### Mágina ranking

A balanced composite of verified hiking and exploration activity.

Filters can include:

- week;
- month;
- season;
- lifetime;
- municipality;
- Sierra Mágina overall;
- friends/following when social relationships exist.

The scoring algorithm must be versioned and server-controlled.

---

## 11. Collections

Collections act as a digital field album of Sierra Mágina.

Collection entries support:

- undiscovered silhouette/hidden presentation;
- discovered state;
- first discovery date;
- associated route/activity;
- rarity/special label;
- educational content;
- verified images/sources where needed.

A user profile shows completion progress per family and overall exploration progress.

---

## 12. Adventure profile

The profile is the user's Sierra Mágina adventure passport.

It includes:

- avatar/display name;
- current level/title;
- XP progress;
- verified kilometres;
- verified elevation gain;
- verified hiking time;
- unique routes completed;
- municipalities explored;
- discoveries;
- collection completion;
- achievements;
- challenge history;
- ranking summaries;
- percentage/progress indicators only where the denominator is well-defined.

---

## 13. Safety and privacy

### Safety

The product must clearly state that route conditions can change and that digital guidance does not replace preparation or local safety instructions.

Active mode includes practical access to:

- route status/safety information;
- off-route warning;
- pause/end controls;
- emergency guidance/phone actions appropriate to the platform;
- optional future live-share feature, not required for V1.

### Privacy

- Activity tracks are private by default.
- Public sharing is opt-in.
- Exact home/start/end locations must not be exposed casually in community surfaces.
- Real-time location sharing is not enabled by default.
- Public leaderboards expose only the minimum data necessary.

---

## 14. Pilot territory

The first complete production-quality territory is **Bedmar y Garcíez**.

The objective is not to load every municipality immediately. The engine must support all of Sierra Mágina, but the first field-testable experience is built deeply for Bedmar.

A route in the Cuadros area is the preferred pilot because it can combine:

- hiking;
- landscape;
- water;
- vegetation;
- heritage;
- olive-grove identity;
- multiple discovery/checkpoint types.

Only verified route geometry, content and safety facts should be published as authoritative.

---

## 15. Visual direction

### Outside an active route

Style: **premium outdoor / Sierra Mágina**.

Characteristics:

- high-quality territorial photography;
- olive green, limestone/stone, earth, warm white and AOVE gold accents;
- large route cards;
- clear typography;
- restrained game decoration;
- data hierarchy similar to quality outdoor/sports products.

### During an active route

Style: **exploration HUD**, still adult and premium.

Characteristics:

- map-first layout;
- heading-aware/tilted camera when useful;
- subtle interaction radius;
- strong next-objective treatment;
- discoveries that feel exciting but not childish;
- minimal controls while moving;
- high contrast and large touch targets outdoors.

Pokémon GO, Strava, AllTrails/Wikiloc-style route products and NatureGo are interaction references only. Mágina Aventura must have original branding, art direction and assets.

---

## 16. Technical architecture

### Repository shape

Monorepo:

```text
apps/
  mobile/        # Expo / React Native app
  admin/         # web administration app

packages/
  domain/        # pure business rules: activity, XP, achievements, challenges, rankings
  contracts/     # shared types and external integration contracts
  ui/            # reusable design tokens/components when genuinely shared

supabase/
  migrations/
  functions/
  seed/

docs/
  superpowers/
    specs/
    plans/
```

### Mobile

- Expo + React Native + TypeScript;
- Expo Router;
- background-capable location tracking using Expo Location/Task Manager;
- MapLibre React Native for maps;
- local persistent store/queue for offline activity state;
- no dependence on continuous network connectivity during an active downloaded route.

### Backend

- Supabase Auth;
- PostgreSQL;
- PostGIS for route/checkpoint/discovery geometry and spatial queries;
- Supabase Storage for media;
- server-side functions/services for validation, scoring and reward finalization;
- Row Level Security for user-owned/private data;
- immutable/auditable reward ledger semantics.

### Admin

Web application for trusted editors/admins to:

- create/edit/publish routes;
- import and version GPX/geometry;
- manage checkpoints;
- manage discoveries and collections;
- manage achievements;
- manage challenges and seasons;
- configure XP/aceitunas rewards;
- moderate user-submitted media/content;
- review flagged activities;
- publish route safety/status notes.

Content changes that affect an active route must be versioned so downloaded/offline activities remain reproducible.

---

## 17. Core domain entities

Initial domain model:

- `profiles`
- `routes`
- `route_versions`
- `route_geometry`
- `route_media`
- `checkpoints`
- `discoveries`
- `collections`
- `collection_items`
- `activities`
- `activity_track_points`
- `activity_events`
- `challenges`
- `challenge_progress`
- `achievements`
- `user_achievements`
- `seasons`
- `leaderboard_scores`
- `reward_ledger`
- `integration_outbox`
- `reports`
- `moderation_cases`

Stable IDs are UUIDs and must not be derived from display names.

---

## 18. Error and recovery behavior

The app must gracefully handle:

- permission denied;
- temporary GPS loss;
- low-accuracy GPS;
- network loss;
- app backgrounding;
- process restart during an activity where platform constraints allow recovery;
- duplicated sync attempts;
- server validation delays;
- stale route/download versions;
- partial media failures.

User activity data must be written incrementally locally so a crash does not erase an entire hike.

Sync operations and external reward events must be idempotent.

---

## 19. Testing strategy

### Domain/unit tests

Cover deterministic rules for:

- distance/elevation calculations;
- route completion criteria;
- XP calculation;
- reward eligibility;
- challenge progress;
- ranking scoring;
- activity state transitions;
- idempotency.

### Integration tests

Cover:

- Supabase/RLS boundaries;
- PostGIS spatial queries;
- route publication/versioning;
- activity upload and validation;
- reward ledger creation;
- outbox delivery semantics.

### Mobile tests

Cover critical navigation and offline state transitions.

GPS logic must support replaying deterministic recorded tracks in tests instead of requiring physical movement for every test run.

### Field QA

A real field test is mandatory before V1 is considered complete.

---

## 20. V1 completion criterion

Mágina Aventura V1 is not complete merely because every screen exists.

It is complete when a tester can physically go to the Bedmar pilot area and, without manual database intervention:

1. browse and select the pilot route;
2. inspect route information and download the required offline package;
3. start the adventure;
4. lock/background the phone and continue recording within platform constraints;
5. follow the route and receive meaningful off-route/progress information;
6. reach real checkpoints;
7. unlock real discoveries;
8. finish the route;
9. receive a correct activity summary;
10. have the activity validated server-side;
11. receive final XP, aceitunas and achievements;
12. see collections/profile/ranking progress update consistently;
13. persist the external reward event for later Mi Olivo integration.

The pilot must be usable on a real Android phone in outdoor conditions. iOS parity follows the same architecture and is required before broad public release, but Android is the initial field-testing target.

---

## 21. Development priorities

Implementation order follows product risk, not feature count:

1. foundations, repository and visual system;
2. authentication and profile;
3. route catalogue/detail and admin route publishing;
4. PostGIS route model and GPX/versioning;
5. reliable GPS activity engine;
6. offline route package and recovery;
7. active Adventure map/HUD;
8. checkpoint detection;
9. discoveries and collections;
10. server validation;
11. XP, achievements and reward ledger;
12. challenges/seasons;
13. rankings;
14. external reward outbox for Mi Olivo;
15. moderation/operational admin;
16. Bedmar field QA and hardening.

No unrelated module should be added before the V1 completion criterion is demonstrably achievable.

---

## 22. Non-goals for V1

To prevent scope drift, V1 does not require:

- Mi Campo features;
- Mi Olivo rendering/growth UI;
- QR bottle redemption;
- a generic tourism portal;
- news feeds;
- a full social network;
- augmented-reality camera gameplay;
- live multiplayer;
- real-time friend tracking;
- coverage of every Sierra Mágina municipality before the Bedmar pilot is proven.

These can be evaluated after the core adventure loop succeeds in real field use.
