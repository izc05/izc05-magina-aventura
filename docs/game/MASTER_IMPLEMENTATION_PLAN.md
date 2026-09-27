# Adventure Game Kit — Master Implementation Plan

**Estado:** implementación incremental  
**Rama inicial:** `feat/adventure-game-kit-v1`  
**Base:** Expo 57 / React Native 0.86.2 / React 19.2.3 / New Architecture  
**Objetivo:** convertir el modo aventura en una experiencia de videojuego ligera, manteniendo un mapa, GPS y rutas reales.

---

## 1. Principio de producto

La app debe sentirse como:

`senderismo real + exploración + juego + naturaleza + deporte + bienestar`

La regla visual/técnica es:

> **Real por debajo; mágico por encima.**

No existe un “mapa IA” que sustituya la cartografía. Existe un mapa real estilizado y una capa de juego.

---

## 2. Arquitectura objetivo

```text
GPS / Activity Engine / Route Engine
              |
              v
        Domain game events
              |
              v
      AdventureGameEngine
              |
              v
      GameEffectCommand[]
              |
     +--------+---------+----------+----------+
     |        |         |          |          |
 Reanimated Haptics   Audio      Lottie      Skia
     |                                        |
     +------------------+---------------------+
                        |
                     Game HUD
                        |
                 MapLibre Game Layer
                        |
                      Turf
```

Rive Nitro queda detrás de un adaptador opcional para experiencias que necesiten state machines reales.

---

## 3. Lo que ya existe en el repositorio

En `main` ya existen:

- `apps/mobile/src/map/RouteMap.tsx`: MapLibre, route line, checkpoints, POIs y posición simulada.
- `apps/mobile/app/adventure/[slug].tsx`: pantalla de aventura activa con HUD.
- `apps/mobile/app/adventure/[slug]/summary.tsx`: resumen y recompensas.
- `apps/mobile/src/components/progression/XPRewardCard.tsx`.
- `packages/geo`: helpers puros geográficos.
- `packages/contracts`: contratos compartidos.
- `packages/offline-sync`: infraestructura offline.
- `packages/route-import`: importación GPX.

En la rama Game Kit ya existen:

- `apps/mobile/src/game/game-events.ts`.
- `apps/mobile/src/game/game-effects.ts`.
- `apps/mobile/src/game/game-engine.ts`.
- pruebas del núcleo.

No duplicar estos conceptos.

---

## 4. Game Event Contract

Eventos V1:

- `checkpoint.reached`
- `discovery.unlocked`
- `xp.earned`
- `badge.unlocked`
- `level.up`
- `route.completed`

Eventos V2 previstos:

- `route.started`
- `route.paused`
- `route.resumed`
- `route.off_track`
- `route.back_on_track`
- `objective.nearby`
- `objective.entered_radius`
- `collection.progressed`
- `challenge.progressed`
- `challenge.completed`
- `streak.updated`
- `photo.accepted`

No añadir un evento solo para disparar una animación. El evento representa un hecho del dominio; los FX deciden cómo visualizarlo.

---

## 5. GameEffectCommand Contract

Comandos:

- `haptic`
- `sound`
- `animation`
- `map.pulse`
- `hud.toast`

Extensiones planificadas:

- `particles.emit`
- `map.highlight`
- `map.reveal`
- `hud.objective`
- `screen.overlay`
- `camera.emphasis`

El motor no importa librerías nativas.

---

## 6. Gates de implementación

## 6A. Gate 0B — Internal code salvage (mandatory before native FX)

Before Game Kit adds native visual runtimes, execute `docs/game/INTERNAL_REUSE_AUDIT.md`.

Historical branches already contain tested GPS/activity, proximity, geo, XP, levels, badges, challenges, rankings and collections. Do not duplicate those systems.

The intended domain stack becomes:

`Activity Engine (salvaged) -> Progression/Collections (salvaged) -> GameEvent -> GameEffectCommand -> FX runtime`

External Turf is supplemental; it does not replace existing proximity/location-quality logic by default.


### Gate 1 — Pure Game Core

**Objetivo:** event bus/translator puro y testeable.

Tareas:
- tipos discriminados;
- traducción determinista evento -> comandos;
- subscribe/unsubscribe;
- deduplicación futura documentada;
- pruebas unitarias.

Salida:
- typecheck verde;
- tests verdes;
- prebuild sin cambios nativos.

### Gate 2 — Haptic + Audio Runtime

Dependencias:
- `expo-haptics` mediante `pnpm expo install`;
- `expo-audio` mediante `pnpm expo install`.

Archivos nuevos sugeridos:
- `src/game/runtime/haptics-adapter.ts`
- `src/game/runtime/audio-adapter.ts`
- `src/game/runtime/GameRuntimeProvider.tsx`
- `src/game/assets/sound-manifest.ts`

Reglas:
- precargar únicamente sonidos cortos;
- no bloquear UI esperando audio;
- un fallo de audio no falla un evento;
- respetar mute/reduced-feedback.

Primeros cues:
- checkpoint;
- discovery;
- xp;
- badge;
- level-up;
- route-complete.

### Gate 3 — Reanimated FX Runtime

Instalar con Expo:
`pnpm expo install react-native-reanimated react-native-worklets`

Componentes:
- `XPBurst`
- `CheckpointReveal`
- `GameToast`
- `ObjectivePulse`
- `ProgressGain`

No introducir Skia aún.

Presupuesto:
- 60fps objetivo en dispositivo medio;
- ninguna animación > 1200 ms salvo celebración;
- respetar reduce motion.

### Gate 4 — Lottie Runtime

Uso limitado:
- insignia desbloqueada;
- discovery especial;
- final de ruta.

Crear:
- `LottieEffectRenderer`
- manifest de assets;
- fallback estático.

No descargar Lottie remotos en V1. Empaquetar assets aprobados para offline.

### Gate 5 — Skia FX

Uso:
- partículas;
- halo del objetivo;
- trail/glow decorativo;
- confeti/hojas/polvo;
- mask/reveal.

No dibujar el mapa en Skia.

Debe poder desactivarse por:
- reduce motion;
- low power/performance mode;
- fallback de runtime.

### Gate 6 — Rive Nitro Spike

Rive no es requisito de V1.

Objetivo del spike:
- un único asset de brújula/insignia interactiva;
- carga lazy;
- error boundary;
- verificar Expo 57 Android;
- medir tamaño/build/startup.

Si no aporta claramente más que Reanimated/Lottie, descartarlo.

### Gate 7 — Turf Game Geometry

Preferir imports modulares:
- distance;
- buffer;
- booleanPointInPolygon;
- pointToLineDistance según necesidad.

Crear capa pura en `packages/geo`, nunca dentro del componente UI.

Casos:
- checkpoint radius;
- discovery radius;
- off-route threshold;
- área explorada;
- objetivo cercano.

No dar premio por un único sample GPS ruidoso. El dominio debe exigir criterios de precisión/estabilidad.

### Gate 8 — MapLibre Game Layer

Mantener `RouteMap` como frontera.

Añadir:
- symbols personalizados;
- estado checkpoint: locked/next/reached;
- estado discovery: hidden/nearby/revealed;
- active objective halo;
- route completed styling;
- route glow/casing;
- hiker heading;
- opcional explored fog.

El mapa sigue usable con todos los Game FX desactivados.

### Gate 9 — Integración Active Adventure

Conectar hechos reales/simulados del Adventure Engine con `adventureGameEngine.emit()`.

No emitir desde componentes visuales si el hecho ya pertenece al dominio.

Ejemplo:
`proximity detector -> discovery.unlocked -> GameEngine -> FX`

### Gate 10 — Summary + Profile

Resumen:
- XP animado;
- discoveries;
- badge;
- progreso de nivel;
- métricas reales.

Perfil:
- logros;
- colecciones;
- retos;
- progreso.

### Gate 11 — AI Visual Content Pipeline

Ver `ASSET_PIPELINE.md`.

### Gate 12 — Physical Performance Gate

Android físico obligatorio:
- cold start;
- reopen;
- iniciar ruta;
- background/foreground;
- 15+ min mapa;
- FX repetidos;
- completar ruta;
- low battery/reduced motion si disponible.

---

## 7. Orden de integración obligatorio

```text
Core
 -> Haptics/Audio
 -> Reanimated
 -> Lottie
 -> Turf geometry
 -> MapLibre Game Layer
 -> Skia
 -> Rive optional spike
 -> full route integration
```

Rive y Skia no deben entrar antes de que una aventura completa funcione con Reanimated.

---

## 8. Presupuestos de rendimiento

Objetivos iniciales, a validar en Android real:

- cold start: no empeorar perceptiblemente por Game Kit;
- FX runtime: carga lazy donde sea posible;
- mapa: sin rerender completo por cada GPS sample;
- partículas: número acotado;
- sonido: cues cortos;
- assets grandes: no cargar todos al entrar en Home;
- Rive: máximo un canvas complejo simultáneo en spike;
- evitar imágenes IA enormes sin WebP/AVIF/resize apropiado.

---

## 9. Fallbacks

Cada renderer debe soportar:

```text
rich FX -> reduced FX -> static UI
```

Ejemplos:
- Skia no disponible -> Reanimated pulse.
- Lottie falla -> badge PNG/WebP + scale animation.
- Audio falla -> solo haptic.
- Haptic no disponible -> visual.
- Rive falla -> Lottie/Reanimated.
- red no disponible -> assets locales.

---

## 10. Definition of Done global

Un gate está terminado solo si:

- implementación acotada;
- tests relevantes;
- `pnpm typecheck` verde;
- `pnpm test` verde;
- Expo Android prebuild verde;
- CI verde;
- si añade runtime nativo: APK Android abre y reabre;
- documentación actualizada;
- sin cambios a `main`;
- PR sigue Draft hasta superar su gate.
