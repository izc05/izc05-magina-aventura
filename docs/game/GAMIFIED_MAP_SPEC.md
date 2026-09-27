# Gamified Map Specification

## 1. Objetivo

El mapa debe sentirse como un tablero de aventura sin dejar de ser un mapa de senderismo real.

```text
MapLibre real
 + style visual propio
 + route geometry real
 + checkpoints reales
 + discoveries reales
 + player position real
 + game state
 + FX overlay
```

## 2. Capas

Orden conceptual:

1. Base vector/raster real.
2. Park/territory boundary.
3. Terrain/topographic context si el style lo soporta.
4. Official route casing.
5. Official route core.
6. Recorded user trail.
7. Explored/unexplored overlay opcional.
8. Checkpoints.
9. Discoveries/POIs.
10. Active objective.
11. Hiker marker.
12. Temporary FX overlay/HUD.

No meter botones React dentro del árbol MapLibre si pueden vivir como overlay estable.

## 3. Route styling

Estados:

### Upcoming
- ruta visible;
- intensidad media;
- próximo tramo enfatizado.

### Active segment
- glow/casing más fuerte;
- dirección clara;
- objetivo próximo resaltado.

### Completed segment
- color/opacity diferenciados;
- no eliminar geometría.

### Off-route
- no convertir toda la pantalla en rojo;
- warning HUD;
- distancia de desviación;
- retorno sugerido cuando exista lógica segura.

## 4. Checkpoint visual state

`locked -> nearby -> active -> reached`

Propiedades de Feature:
- id;
- type;
- status;
- required;
- stepNumber;
- rarity/importance si aplica.

MapLibre debe poder estilizar por `status` con expressions.

## 5. Discovery state

`hidden -> hinted -> nearby -> revealed -> collected`

Reglas:
- hidden no expone coordenada exacta si el producto quiere secreto.
- hinted puede mostrar área aproximada.
- nearby puede mostrar halo/radio.
- revealed muestra símbolo completo.
- collected conserva memoria visual.

## 6. Icon system

Usar MapLibre `Images` + symbol layer para iconografía de juego.

Familias:
- flora;
- fauna;
- patrimonio;
- olivar;
- tradición;
- paisaje;
- agua/fuente;
- mirador;
- reto;
- checkpoint.

Assets:
- SDF cuando interese recolor dinámico;
- WebP/PNG local para offline;
- no depender de URLs durante ruta.

## 7. Objective halo

Primera implementación:
- circle layer pulsante simulada por cambios controlados de style/opacity o overlay Reanimated.

Segunda:
- Skia overlay si se demuestra estable.

No redibujar MapLibre a 60Hz desde JS.

## 8. Player marker

Debe indicar:
- posición;
- heading si fiable;
- accuracy state.

No disfrazar mala precisión con una posición “bonita”.

Estados:
- good accuracy;
- degraded;
- GPS temporarily lost.

## 9. Turf / proximity pipeline

```text
Location sample
 -> quality filter
 -> pure geo calculation
 -> proximity state machine
 -> stable confirmation
 -> domain event
 -> GameEvent
 -> FX
```

No usar:
`location sample -> animation -> reward`

La recompensa no depende del renderer.

## 10. Suggested thresholds

No fijar números globales definitivos en UI.

Cada checkpoint/discovery debe poder tener:
- trigger radius;
- minimum accuracy;
- dwell/confirmation rule;
- route-specific overrides.

Los valores reales se deciden con field QA.

## 11. Fog / explored area

V2 opcional.

Posibles enfoques:
- polygon/mask de área no explorada;
- trail buffer acumulado;
- grid/tiles de exploración.

Debe ser:
- visual;
- barato;
- offline;
- no bloquear navegación.

No usar un enorme polígono recalculado por GPS sample.

## 12. Camera behavior

Modos:
- overview;
- follow;
- heading-follow;
- objective-focus;
- recovery/recenter.

No secuestrar cámara mientras el usuario inspecciona manualmente el mapa.

Tras interacción manual:
- suspender follow temporalmente;
- ofrecer recenter claro.

## 13. FX events on map

- checkpoint: pulse + symbol state change;
- discovery: halo + reveal;
- XP: HUD, no mapa;
- badge: modal/overlay;
- off-route: route/HUD warning;
- route complete: map recap, no fireworks permanentes sobre mapa.

## 14. Accessibility

- no depender solo del color;
- símbolos + texto;
- reduce motion;
- alto contraste razonable;
- no ocultar funciones detrás de animaciones;
- vibración nunca es el único feedback.

## 15. Acceptance tests

- Map funciona sin GameRuntime.
- Route line sigue visible con FX off.
- Checkpoint state cambia sin recrear el mapa completo.
- Discovery hidden no filtra info prohibida.
- Player marker representa precision degraded.
- Offline conserva iconos y style necesarios.
- 15 min de simulación GPS no produce crecimiento de memoria evidente.


## 16. MapLibre v11 implementation sources to reuse

The current `RouteMap.tsx` already uses the correct v11 direction:
- unified `Layer`;
- `paint` with MapLibre Style Spec kebab-case properties;
- `GeoJSONSource data`;
- `Camera initialViewState`.

Do not migrate back to old `CircleLayer`/`LineLayer`/`ShapeSource` tutorials.

### A. Pulsing active objective

Upstream source:
`maplibre/maplibre-react-native/examples/shared/src/components/PulseCircleLayer.tsx`

Pattern:
- `Animated.GeoJSONSource`;
- multiple `Animated.Layer type="circle"`;
- bounded loop;
- cleanup with `animationLoop.stop()`;
- animated radius/opacity.

Use for:
- next checkpoint halo;
- nearby discovery pulse;
- temporary map reveal emphasis.

Adapt:
- IDs must be unique per Map instance/target;
- colors/timing come from Mágina tokens/rarity;
- reduced-motion mode gets a static circle;
- only the active/nearby target pulses, not every marker.

If substantial upstream code is adapted, record it in THIRD_PARTY_NOTICES (MapLibre React Native, MIT).

### B. Route-progress overlay

Upstream source:
`examples/shared/src/examples/Animations/AnimateCircleAlongLine.tsx`

Pattern:
- official route remains fixed;
- progress line is a separate source/layer;
- current point can be emphasized independently.

Use for:
- completed route segment;
- user's current progress;
- route recap.

Do not slice giant route arrays on every GPS render if avoidable; the production implementation should derive/update at a controlled cadence.

### C. Animated route geometry

Upstream source:
`examples/shared/src/examples/Animations/AnimatedLength.tsx`

Pattern:
- `Animated.RouteCoordinatesArray`;
- `Animated.GeoJSON`;
- `Animated.GeoJSONSource`;
- `Animated.Layer`.

Possible use:
- short route reveal/preview animations;
- onboarding/detail transition.

Do not run a decorative full-route animation continuously during GPS recording.

### D. SDF game markers

Upstream source:
`examples/shared/src/examples/SymbolCircleLayer/SdfIcon.tsx`

Pattern:
- register local asset through `Images`;
- mark asset as `sdf: true`;
- `Layer type="symbol"`;
- style icon color from feature property.

Use for:
- checkpoint status;
- discovery category/status;
- recolorable rarity/state markers;
- offline icon packs.

Prefer SDF for simple monochrome marker shapes; use local WebP/PNG for richer illustrated badges where recoloring is not needed.

### E. v11 event/API rule

MapLibre v11 event payloads use `event.nativeEvent`, and old examples may use pre-v11 prop names.

Before copying any MapLibre snippet, compare against current v11 repository source or migration docs.
