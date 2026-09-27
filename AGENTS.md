# AGENTS.md — Mágina Aventura

Este repositorio se desarrolla por gates pequeños, verificables y reversibles.

## Lectura obligatoria antes de modificar Game/FX/Map

1. `docs/game/MASTER_IMPLEMENTATION_PLAN.md`
2. `docs/game/THIRD_PARTY_RESEARCH.md`
3. `docs/game/GAMIFIED_MAP_SPEC.md`
4. `docs/game/ASSET_PIPELINE.md`
5. `docs/game/QA_GATES.md`
6. `docs/game/CLAUDE_CODEX_HANDOFF.md`
7. `docs/game/MAP_DATA_ATTRIBUTION.md`
8. `docs/superpowers/specs/2026-09-15-magina-aventura-product-design.md`
9. `docs/superpowers/specs/2026-09-15-maplibre-gpx-offline-design.md`

## Reglas no negociables

- No trabajar directamente en `main`.
- No sustituir MapLibre por un mapa dibujado/IA.
- El mapa, GPS, ruta, checkpoints y proximidad usan geometría real.
- IA se usa para media editorial, fondos, badges, portraits, discoveries y arte; no para inventar coordenadas.
- Los FX son una capa degradable: si fallan, la ruta debe seguir funcionando.
- No introducir dos runtimes nativos nuevos en el mismo gate.
- Tras cada dependencia nativa: typecheck, tests, Expo prebuild Android y APK/cold-start físico antes de continuar.
- No copiar código de terceros sin registrar repositorio, licencia, archivo/patrón reutilizado y cambios propios.
- Preferir APIs oficiales y adaptadores propios sobre forks abandonados.
- Nunca acoplar dominio/recompensas a Reanimated, Skia, Lottie, Rive o MapLibre.
- Respetar `exactOptionalPropertyTypes` y el TypeScript estricto del repositorio.
- No declarar una fase terminada con CI roja.

## Arquitectura objetivo

`Adventure/GPS -> GameEvent -> AdventureGameEngine -> GameEffectCommand -> runtime adapters`

Runtimes previstos:
- Reanimated: movimiento de UI/HUD.
- Expo Haptics: feedback táctil.
- Expo Audio: cues de sonido.
- Lottie: celebraciones/insignias.
- Skia: partículas, halos y FX 2D.
- Rive Nitro: opcional para elementos interactivos complejos.
- MapLibre: mapa real.
- Turf: geometría/proximidad.

## Trabajo de agentes

Cada cambio debe indicar:
- qué gate ejecuta;
- archivos modificados;
- dependencia añadida;
- motivo;
- tests añadidos;
- resultado de CI;
- resultado de Android prebuild;
- si aplica, evidencia de arranque físico.

Si una librería rompe cold start, revertir esa integración. No parchear el arranque con sleeps o try/catch silenciosos.
