# Mágina Aventura — RC1 Section 7: Map V2, Navigation, Weather and Safety

Status: **approved product canon**  
Date: 2026-09-17

This section is authoritative RC1 product direction and supplements `2026-09-17-rc1-master-design.md`.

## 1. Map roles

The same map engine serves three distinct experiences:

- **Explorar Mágina** — territorial discovery before an adventure.
- **Modo Aventura** — operational navigation during an active activity.
- **Mi Mágina** — personal exploration history after activities.

The map is the living representation of Sierra Mágina and of the user's exploration history.

## 2. Progressive disclosure

Avoid icon saturation. Content appears by zoom and context:

- territory level: municipalities/areas, major peaks, adventure availability;
- route/area level: routes, heritage, water, nature, viewpoints, parking;
- adventure level: user position, official route, traveled track, discoveries, checkpoints, incidents, closures and operational POIs.

Rule: **more zoom + more context = more detail**.

## 3. Technical map architecture

Keep the current MapLibre strategy. Business rules do not live inside rendering components.

Conceptually:

`map sources → normalized geodata/content → versioned map assets/PMTiles → MapLibre presentation`

Core sources and domains include:

- base cartography;
- PostGIS route/content geometry;
- verified GPX/route geometry;
- user activity track;
- discoveries and POIs;
- community incidents;
- official closures/restrictions;
- weather context.

MapLibre renders state; domain services decide what the state means.

## 4. Offline adventure package

"Download adventure" means downloading an operational package, not only a GPX line.

The package model can contain:

- map assets;
- verified route geometry;
- elevation profile;
- operational POIs;
- discoveries/checkpoints;
- safety metadata;
- restriction/closure snapshot;
- cached weather snapshot;
- essential media/content;
- manifest/version metadata.

Internet must not be required to continue, pause or finish a prepared adventure.

## 5. Versioning and freshness

Offline assets and content are versioned independently where useful. A package must know whether route geometry, maps, content or restrictions changed and request only the necessary refresh when possible.

Never present stale operational information as current without showing its age/source.

## 6. Route preparation map

Preparation should surface:

- complete route geometry when verified;
- start/end and meaningful POIs;
- distance, elevation gain and estimated duration where supported;
- elevation profile linked to map position;
- offline readiness;
- weather snapshot/freshness;
- official closures/restrictions and relevant community incidents.

Without verified geometry, the app can record an activity but must not claim navigation/progress certainty.

## 7. Active adventure map

During an activity prioritize readability over feature density. Show the minimum useful operational HUD:

- adventure identity;
- GPS quality;
- user position;
- official route when verified;
- traveled track;
- remaining/elapsed metrics where legitimately derivable;
- nearby operational POIs/discoveries;
- a clear Explore/camera entry point.

Normal application navigation yields to the active adventure surface.

## 8. GPS confidence

The position marker must communicate uncertainty. Distinguish good, degraded and unreliable location quality rather than presenting all samples equally.

The visual accuracy radius, last-valid-fix time and degraded-GPS state can be used to explain uncertainty.

## 9. Official route vs traveled track

Always distinguish:

- **official/verified route geometry**;
- **the user's recorded track**.

The traveled track is persistent evidence and can help the user retrace their own movement.

Rule: **never draw a fabricated straight-line 'safe path' between the user and a route/POI where no verified traversable path exists.**

## 10. Contextual navigation

Mágina Aventura is not turn-by-turn road navigation. Prefer contextual outdoor guidance:

- on-route / attention / off-route state;
- relevant upcoming POI/checkpoint;
- meaningful junction alerts;
- discovery proximity;
- rejoin-state acknowledgement.

Do not produce constant noisy prompts when they do not add safety or orientation value.

## 11. POI vs discovery

Distinguish operational POIs from game/discovery content.

Operational examples: water source, parking, refuge, information point.

Discovery examples: heritage, nature, viewpoint, secret, narrative objective.

A POI can be both when the content model explicitly says so, but the semantics remain separate.

## 12. Weather architecture

Weather is adventure context, not map decoration.

Architecture:

`AEMET/provider → backend adapter/normalization → cache → mobile snapshot`

The mobile client consumes a normalized `WeatherSnapshot` rather than coupling screens directly to a provider.

Snapshots should carry generation/freshness metadata and relevant values such as temperature, precipitation, wind/gusts, weather condition and relevant warnings when available.

## 13. Temporal weather

Preparation should align forecast timing with the estimated adventure window rather than showing only a single current-condition value.

Offline use shows the latest cached snapshot and its age. A stale forecast remains visibly stale.

Forecast changes and official alerts/restrictions must remain distinct concepts.

## 14. Safety surface

Provide a fast safety view with useful local information such as:

- current/last-valid position;
- approximate altitude;
- GPS accuracy and last fix;
- battery state;
- adventure identity;
- distance already traveled where available;
- share position action where supported;
- show traveled path/retrace context.

The app assists orientation but is not represented as a rescue device.

## 15. Battery-aware adventure mode

Low-battery mode may reduce non-essential animation, refresh and secondary work, but must not silently disable critical tracking. GPS/activity persistence/offline safety functions remain prioritized.

## 16. Incidents and closures

Community incidents and official closures must be visibly and semantically distinct.

Community incident lifecycle includes source, age, confirmations and resolution state.

Official closures/restrictions retain official provenance and authority.

## 17. Water source state

Water sources can show recent community observations with age and confirmation counts, while the existence/identity of the source remains separately sourced. Users can submit quick observations after visiting.

## 18. Secret/sensitive content

Hidden discoveries do not require exposing exact coordinates. Sensitive flora/fauna, caves, archaeological assets or secrets may use:

- private exact validation geometry;
- generalized public geometry/zone;
- proximity hints instead of exact pins.

## 19. Mi Mágina

After exploration, the map reflects personal history:

- territory completion/progress;
- discovered places;
- unlocked secrets;
- completed adventures;
- optional personal photo memories.

A place can show when/how it was discovered and related collection/adventure context.

## 20. Canon rules added by Section 7

1. **The map never implies a safe traversable path from sparse coordinates alone.**
2. **Offline capability is part of basic adventure safety, not decorative premium functionality.**
3. **Map rendering is presentation; route/discovery/safety/weather meaning stays in domain services.**
4. **Operational freshness and provenance remain visible.**
5. **Weather informs decisions but does not masquerade as certainty.**
