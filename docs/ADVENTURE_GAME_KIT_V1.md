# Aventura Mágina — Adventure Game Kit v1

## Objetivo

Crear una capa de videojuego reutilizable sobre la app existente sin sustituir el motor de rutas, GPS ni MapLibre.

La arquitectura sigue una regla: **datos y navegación reales por debajo; experiencia de juego por encima**.

## Qué se reutiliza de fuera

No se copia código de terceros de forma indiscriminada. Se prefieren dependencias oficiales y patrones abiertos, manteniendo trazabilidad de licencia y evitando acoplar la app a un motor abandonado.

| Pieza | Fuente | Licencia | Uso previsto |
| --- | --- | --- | --- |
| Event/system game-engine pattern | bberak/react-native-game-engine | MIT | Referencia arquitectónica. No se adopta como dependencia central. |
| Animación UI | software-mansion/react-native-reanimated | MIT | HUD, XP, transiciones, pulsos y microinteracciones. |
| Gráficos/partículas | Shopify/react-native-skia | MIT | Partículas, halos, trazos y FX sobre mapa. |
| Animaciones exportadas | lottie-react-native/lottie-react-native | Apache-2.0 | Celebraciones, insignias y reveals. |
| Animación interactiva | rive-app/rive-react-native | MIT | Elementos con state machines cuando aporte valor. |
| Mapa real | maplibre/maplibre-react-native | MIT | Base cartográfica y capas de navegación. Ya está integrado. |
| Geometría geoespacial | Turfjs/turf | MIT | Distancia, buffers, geofencing y proximidad cuando supere al helper local. |
| Física 2D opcional | liabru/matter-js | MIT | Solo para futuros minijuegos; no forma parte del arranque de la app. |
| Feedback nativo | Expo Haptics + Expo Audio | Expo SDK | Vibración y sonido. |

## Compatibilidad de la base actual

- Expo SDK 57.
- React Native 0.86.2.
- React 19.2.3.
- New Architecture activada.
- MapLibre ya instalado.

Esto permite usar la familia moderna de Reanimated y la versión actual de Skia/Lottie, pero las dependencias nativas se incorporarán de una en una y con build Android después de cada incorporación.

## Motor unificado

El directorio `apps/mobile/src/game` contiene el núcleo desacoplado de cualquier runtime visual.

Eventos iniciales:

- `checkpoint.reached`
- `discovery.unlocked`
- `xp.earned`
- `badge.unlocked`
- `level.up`
- `route.completed`

Cada evento se traduce a comandos de efecto:

- `haptic`
- `sound`
- `animation`
- `map.pulse`
- `hud.toast`

Los runtimes visuales consumirán estos comandos. Así el Adventure Engine no necesita saber si una animación está hecha con Reanimated, Skia, Lottie o Rive.

## Integración por fases

### Gate 1 — núcleo puro
Motor de eventos, presets y pruebas unitarias sin dependencias nativas nuevas.

### Gate 2 — feedback seguro
Añadir Expo Haptics y Expo Audio. Validar cold start, reopening y APK física.

### Gate 3 — movimiento UI
Añadir Reanimated compatible con Expo 57 / RN 0.86. Implementar XP burst, checkpoint reveal y HUD.

### Gate 4 — assets animados
Añadir Lottie para insignias y celebraciones. Los assets deben quedar inventariados con origen/licencia.

### Gate 5 — partículas
Añadir Skia de forma lazy/deferred. No debe bloquear el arranque. Implementar halos, partículas y trail FX.

### Gate 6 — Rive opcional
Solo para elementos interactivos que realmente necesiten state machines; no usar Rive como requisito para abrir una ruta.

### Gate 7 — mapa gamificado
Mantener MapLibre como mapa real y añadir encima:
- ruta con casing/glow;
- checkpoint activo;
- POI/discovery por rareza;
- niebla/área no explorada si es viable;
- pulsos y feedback de proximidad;
- objetivo actual y recompensas.

## Regla de seguridad técnica

Ninguna librería gráfica nueva debe:
1. ejecutarse obligatoriamente antes del Home/Onboarding;
2. sustituir el GPS o MapLibre;
3. impedir que una ruta funcione sin FX;
4. mezclarse con el dominio de rutas.

Los FX son una capa degradable: si un runtime visual falla, la aventura debe seguir funcionando.
