# Mágina Aventura — RC1 Master Design

Status: **approved product canon, sections 1–5**  
Date: 2026-09-17  
Repository: `izc05/izc05-magina-aventura`

This document is the authoritative product and architecture direction for RC1. Agents, contributors and future implementation work should preserve these principles unless the product owner explicitly changes them.

## 0. Non-negotiable product canon

**Mágina Aventura = explorar físicamente Sierra Mágina.**

The route is the medium, not the complete product. The core loop is:

`descubrir → elegir aventura → preparar → caminar → explorar → capturar → conseguir → compartir → progresar → volver a explorar`

The product must reward real exploration of the territory, not interaction from home.

Primary navigation is conceptually:

- **Explorar** — map, routes, places, search and territorial discovery.
- **Aventura** — active/prepared adventures and history.
- **Comunidad** — useful territorial contributions, route conditions, photos and recent activity.
- **Progreso** — XP, levels, collections, badges, challenges and rankings.
- **Perfil** — identity, personal exploration history, privacy and settings.

During an active route the normal navigation yields to a dedicated **Modo Aventura**.

The approved official visual identity remains the green mountain, white path and golden sun. The previous olive-branch symbol must not return as the primary application symbol.

---

## 1. RC1 integration architecture

Do not integrate the project by blindly merging every historical PR. Several branches are stacked and represent superseded iterations. RC1 integrates **capabilities**, preserving the latest valid implementation and its required ancestors.

### 1.1 Integration principle

1. Stabilize the technical base first.
2. Create a clean RC integration branch from the stabilized base.
3. Integrate mobile, real data, backend, community and progression by capability.
4. Run automated gates after each integration slice.
5. Keep mandatory physical Android field tests independent from CI.
6. Merge to `main` only after the RC candidate is demonstrably stable.

Target topology:

```text
main
  └─ stabilization
       └─ integration/rc1
            ├─ mobile
            ├─ catalog/data
            ├─ Supabase/backend
            ├─ community
            ├─ progression
            ├─ admin
            └─ promo web
```

### 1.2 RC1 capability scope

Required for RC1:

- stable dependency graph and green CI;
- official branding and onboarding;
- Android mobile flow;
- MapLibre, GPX and offline maps;
- real GPS activity engine;
- activity persistence/recovery;
- route preparation and adventure summary;
- authentication and profiles;
- real Sierra Mágina route catalog with provenance;
- Admin Route Master and administrative controls;
- community foundation and useful route community;
- discoveries, collections, XP, levels and meaningful badges;
- initial challenges/rankings where already technically sound;
- ARM64 beta APK;
- cinematic promotional web as a parallel application.

Feature-flagged or secondary for the first RC if they threaten stability:

- complete physical rewards economy / Mi Olivo;
- advanced camera AR;
- AI flora/fauna recognition;
- large-scale user-created routes;
- advanced clubs/groups/events.

### 1.3 Stabilization gate

`main` is not the experimentation surface. Dependency and lockfile integrity, Supabase configuration, tests, Android prebuild and APK verification must be green before RC integration begins.

The stabilization branch is treated as the technical entry point only after its full verification pipeline passes.

---

## 2. Mágina as an explorable world

Sierra Mágina is modeled internally as a territory containing routes, places, discoveries, stories, collections and evolving conditions. Municipalities provide a useful content and progression partition, but users primarily experience a continuous geographic world.

### 2.1 Content domains

Core content families:

- **Aventuras** — routes and physical itineraries.
- **Patrimonio** — castles, towers, archaeological/historical/ethnographic elements.
- **Flora** — singular trees, botanical formations and notable species.
- **Fauna** — observable species and habitat-based content.
- **Agua** — springs, fountains, waterfalls, channels and water heritage.
- **Paisaje** — peaks, viewpoints and geological landscapes.
- **Olivar** — olive culture and agricultural heritage.
- **Historias** — legends, traditions and documented historical narratives.
- **Pueblos** — urban and ethnographic exploration.
- **Fotografía** — selected photographic viewpoints.
- **Secretos** — initially hidden discoveries.
- **Retos** — physical objectives tied to places or journeys.

### 2.2 Discovery model

A discovery is not merely `name + latitude + longitude`. Its domain model must be able to express:

- territory / municipality;
- category and subtype;
- geographic location and activation radius;
- access difficulty;
- descriptive/history content;
- media;
- documentary provenance;
- ecological or archaeological sensitivity;
- seasonal/temporal availability;
- whether an active adventure is required;
- camera / QR / checkpoint interaction requirements;
- XP/progression linkage;
- collection linkage;
- related badge/challenge;
- server-side validation requirements;
- visibility mode: visible, hinted/hidden, secret.

One place can participate simultaneously in the map, a route, a collection, a challenge, a badge and a narrative chain.

### 2.3 Narrative exploration chains

The system supports multi-place thematic adventures that may cross routes and municipalities, e.g. defensive heritage, water culture, summits, olive heritage or local legends. These are not required to map one-to-one to a single GPX route.

### 2.4 Personal exploration map

The map is also a personal history surface. Two users may see different progression states because discovered items, completed territories, unlocked secrets and personal photos differ.

A user can have an exploration completion indicator such as `Mágina explorada`, derived from configured content coverage rather than arbitrary screen interaction.

### 2.5 Zoom/context progressive disclosure

Avoid map saturation. Content appears according to zoom and context:

- territory level: municipalities/areas and adventure counts;
- route/area level: routes, heritage, water, viewpoints, nature and parking;
- close/adventure level: discoveries, checkpoints, incidents and contextual objectives.

### 2.6 Provenance and trust

Every operationally relevant datum needs provenance. At minimum distinguish:

- official source;
- editorially reviewed source;
- community report;
- community report backed by verified activity/evidence.

Store publisher/source reference, check/review date and confidence/state where appropriate.

A historical GPX or old third-party description never automatically means access is currently permitted.

Route/place operational status must support at least:

- verified/active;
- caution;
- temporarily restricted;
- officially closed;
- unknown.

Official restrictions must remain distinguishable from community incidents.

---

## 3. Modo Aventura — core operating model

Modo Aventura is the operational heart of the application. It must be useful without mobile data and resilient to normal Android lifecycle interruptions.

### 3.1 Offline-first architecture

```text
GPS / sensors
      ↓
local activity engine
      ↓
SQLite persistence
      ↓
map + metrics + discoveries
      ↓
local sync queue
      ↓
Supabase when connectivity returns
```

Internet cannot be required to continue, pause or finish an already prepared adventure.

### 3.2 Activity state machine

Use explicit states rather than a single active boolean. Conceptually:

`idle → preparing → ready → starting → active ↔ paused → finishing → completed → syncing → verified`

Additional operational states include degraded GPS and recovery after process/app termination.

If Android closes the UI/process, reopening must recover the same local activity without creating a duplicate.

### 3.3 Pre-adventure readiness

Before starting, the user receives an honest readiness check covering relevant items such as:

- route/track availability and verification;
- offline map readiness;
- GPS/location permission;
- precise/background location state where needed;
- battery state;
- cached weather context;
- content/map freshness.

Features that cannot be supported must be described honestly. For example, without a verified route geometry the app can record the walk but must not claim that the user is “on route” or invent route completion percentage.

### 3.4 Location processing pipeline

Each candidate GPS sample conceptually flows through:

`raw location → quality/accuracy check → impossible-jump filtering → persistence → track update → metrics → route relation → off-route logic → discovery proximity → UI snapshot`

Rule: **persist the source activity data before relying on presentation state**.

### 3.5 Adaptive tracking

Tracking policy can adapt to context such as normal movement, stationary state, proximity to a discovery, possible route deviation and pause state. Numerical thresholds are calibrated through real Android field testing rather than invented as immutable product constants.

### 3.6 Off-route detection

Off-route status requires verified route geometry and sustained evidence rather than a single noisy GPS point. UX can progress from normal to attention/warning states and return to normal when the user rejoins the route.

### 3.7 Discovery proximity and anti-fraud

Entering a geofence produces a **candidate discovery**, not an automatic reward.

Potential evidence includes:

- location and accuracy;
- timestamp;
- active activity identity;
- coherent preceding track;
- dwell/presence evidence;
- discovery and route identity;
- optional camera/checkpoint/QR evidence.

The client collects evidence. The server validates reward/progression outcomes. Physical rewards receive stricter checks than cosmetic/local progression.

### 3.8 Camera as an adventure tool

The camera belongs inside Modo Aventura rather than as an unrelated section. Initial modes:

- capture memory/photo;
- discovery interaction with camera overlay;
- QR/checkpoint scanning.

Advanced AR is a later enhancement for selected places and must not block V1.

### 3.9 Weather as adventure context

Weather is not merely a standalone screen. Architecture:

`provider (AEMET) → weather adapter → normalized model → cache/snapshot → preparation + adventure context`

This allows provider fallback in the future without rewriting UI contracts. Critical adventure behavior must not require a live weather request while outdoors.

### 3.10 Safety model

Mágina Aventura assists navigation and context but is not presented as a rescue device.

A safety surface should provide useful local information such as current/last valid position, approximate altitude, route identity, last GPS time, battery and shareable position where permitted.

Official closures and warnings remain visually and semantically distinct from user-generated incidents.

### 3.11 Community utility during activity

Users can contribute low-friction operational information, e.g. source water availability or route incidents, especially at the end of or during a real activity.

### 3.12 Adventure completion

Finishing an adventure should feel like completing an experience, not merely stopping a tracker. The summary can combine:

- distance/time/elevation from real activity data;
- discoveries found;
- collection progress;
- XP/level progression after validation;
- newly earned badges/challenge progress;
- prompt for useful route-condition feedback and selected photos.

If offline, local completion succeeds immediately and reward/progression verification waits in the synchronization queue.

### 3.13 Mandatory physical Android gate

GPS/background tracking is not considered validated solely by unit tests, emulator tests or CI.

The physical field test must include at least:

- start from preparation;
- valid GPS and growing track;
- screen locked for at least five minutes;
- pause/resume;
- force-close and recovery without duplicate activity;
- operation with mobile data disabled / airplane scenario as applicable;
- offline completion and persistence;
- sync queue persistence;
- poor-accuracy / impossible-jump resilience;
- honest behavior with and without verified route geometry.

---

## 4. Community of Mágina

Community exists to improve the territory and the next adventure. It must not degrade into a generic follower-count social network.

Core relationship:

`territory → adventure → real activity → contribution`

### 4.1 Route community

Each route/adventure can surface:

- aggregate rating with sample size;
- recent photos;
- recent trail condition;
- water/source reports;
- vegetation/passability;
- incidents;
- recent verified activities;
- comments/reviews.

Recent operational information carries more practical weight than old observations, while old photos/reviews may remain valuable as historical/community content.

### 4.2 Trust classes

Keep explicit distinctions such as:

- official information;
- editorially reviewed information;
- community contribution;
- community contribution backed by verified activity/evidence.

Never visually equate an official closure with a single community report.

### 4.3 Verified activities

Where sufficient activity evidence exists, mark the adventure/activity as verified. Manual activities can exist but must remain distinguishable.

Verified activity can strengthen trust in condition reports without giving the client unilateral authority to award protected progression/rewards.

### 4.4 Photos and privacy

Photos may associate with user, activity, route, place/discovery and time. Public presentation must not automatically reveal exact capture coordinates.

Sensitive flora/fauna, caves, archaeological assets, private start/end locations and secret discoveries require privacy-aware location handling.

### 4.5 Feed

The feed is territorial and useful, combining relevant signals such as:

- places/routes the user follows or has saved;
- areas being explored;
- people followed;
- discoveries;
- recent conditions;
- meaningful incidents.

Follower activity is one input, not the sole product.

### 4.6 Explorer profile

Profile emphasizes exploration history rather than popularity:

- level;
- adventures;
- distance and useful activity statistics;
- territory explored;
- municipalities/areas visited;
- discoveries;
- badges;
- collections;
- photographs.

Follower counts must not dominate the profile.

### 4.7 Privacy controls

Support privacy for profile/activity/photos/statistics, with public/followers/private modes as appropriate.

Exact recorded tracks require stronger handling than ordinary activity metadata. Public sharing can use a sanitized track that avoids unnecessarily exposing precise start/end or sensitive coordinates.

### 4.8 Incident reporting lifecycle

Supported categories can include obstacles, blocked trail, landslide, water/flooding, damaged signage, livestock/risk and other contextual issues.

Lifecycle:

`report → optional evidence → community confirmations → confidence changes → resolved/closed`

This never transforms a community incident into an official restriction unless an official source provides that status.

### 4.9 Moderation and audit

Preserve separated privileged roles (e.g. owner/admin/moderator), Row Level Security, protected moderation fields, soft deletion where required and auditable moderation operations.

Moderation actions include retaining, hiding/removing and user enforcement where justified, with who/what/when/reason retained in audit history.

### 4.10 Contribution reputation

Avoid opaque public reputation scores in V1. Prefer understandable contribution evidence such as verified adventures, useful water updates and confirmed incident reports.

A future **Guardianes de Mágina** concept may recognize sustained, useful, geographically grounded contribution. It is not equivalent to administrative moderation and should not be driven by popularity alone.

### 4.11 Community loop

`user chooses adventure → downloads/prepares → walks → discovers/captures → finishes → reports conditions/shares selected media → community data improves → next explorer benefits`

Approved principle: **Cada aventura puede mejorar Mágina Aventura para el siguiente explorador.**

---

## 5. Architecture guardrails

These rules apply across subsequent RC1 sections.

1. **No invented certainty.** Missing verified track, weather, closure or reward evidence must remain visibly unknown/pending rather than fabricated.
2. **Offline-first outdoors.** Local adventure completion cannot depend on network success.
3. **Server validates protected outcomes.** The mobile client collects evidence; it does not unilaterally grant valuable rewards.
4. **Provenance is first-class.** Operational content records where it came from and when it was checked.
5. **Privacy by design.** Exact GPS data is more sensitive than ordinary community content.
6. **Official vs community is explicit.** Do not merge their semantics.
7. **Progress rewards physical exploration.** Avoid mechanics optimized for taps, spam or remote farming.
8. **Map complexity is progressive.** Reveal content by zoom, context and exploration state.
9. **Field validation remains mandatory.** Android location behavior cannot be declared proven by CI alone.
10. **Integrate by capability, not PR count.** Prefer current authoritative branch tips and deliberate migration/cherry-pick/rebase strategies over big-bang merges.
11. **The hiking/exploration core has priority.** Mi Olivo, AR and other attractive subsystems cannot destabilize the core RC.
12. **No generic social-network drift.** Community features must connect to territory, adventures, useful contributions or exploration history.

---

## 6. Document evolution

Sections 1–5 above are explicitly approved product direction and should be treated as locked canon unless the product owner requests a change.

Further RC1 design sections will be appended after conversational approval, including the progression/game engine, rewards economy boundaries, Map V2/weather/safety details, admin/content governance, promotional web and final integration/test/release train.

No implementation should reinterpret the locked principles merely for convenience. Where existing code conflicts with this design, the conflict should be surfaced during the implementation plan and resolved deliberately.
