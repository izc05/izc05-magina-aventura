# Third-party Research & Reuse Matrix

**Última revisión:** 2026-09-28  
**Base objetivo:** Expo SDK 57 / RN 0.86.2 / React 19.2.3 / New Architecture.

El objetivo no es copiar repositorios completos. Se reutilizan APIs oficiales, patrones y fragmentos permitidos por licencia con atribución cuando corresponda.

## Matriz principal

| Tecnología | Estado | Licencia | Decisión |
| --- | --- | --- | --- |
| MapLibre React Native | activo | MIT | YA USADO. Base cartográfica real. |
| Turf.js | activo | MIT | ADOPTAR modularmente para geometría. |
| React Native Reanimated | activo | MIT | ADOPTAR para movimiento/HUD. |
| React Native Skia | activo | MIT | ADOPTAR después de Reanimated. |
| Lottie React Native | activo | Apache-2.0 | ADOPTAR para assets animados empaquetados. |
| Rive Nitro React Native | activo/beta | MIT | SPIKE opcional, no dependencia crítica. |
| React Native Game Engine | menor actividad | MIT | SOLO patrón/reference, no dependencia central. |
| RN Game Engine Handbook | menor actividad | MIT | Fuente de patrones/demos, no copiar arquitectura antigua. |
| Matter.js | activo | MIT | Reservar para minijuegos 2D futuros. |
| Expo Haptics | Expo 57 | Expo package | ADOPTAR. |
| Expo Audio | Expo 57 | Expo package | ADOPTAR. |
| Expo Location + TaskManager | Expo 57 | Expo package | Infra GPS real; integrar en Activity Engine, no en FX. |

## Versiones verificadas para Expo 57

Usar siempre `expo install` para resolver versiones del SDK.

Referencias verificadas:
- Expo 57 -> React Native 0.86 / React 19.2.3.
- Reanimated recomendado por Expo 57: 4.5.1.
- Skia recomendado por Expo 57: 2.6.2.
- expo-haptics: ~57.0.3.
- expo-audio: ~57.0.5.
- expo-location: ~57.0.20.
- expo-task-manager: ~57.0.20.
- Lottie React Native actual requiere RN moderno y New Architecture.
- Rive Nitro declara RN >=0.78, Expo >=53 y contiene ejemplo Expo 57.

No fijar manualmente una versión más nueva que la recomendada por Expo sin un spike aislado.

## Repositorios para estudiar

### bberak/react-native-game-engine
Uso permitido por MIT.

Qué estudiar:
- separación de entities/systems;
- dispatch de eventos;
- loop desacoplado del renderer.

Qué NO copiar:
- dependencia central;
- assumptions antiguas de Expo/RN;
- render loop para GPS/mapa.

### bberak/react-native-game-engine-handbook
MIT.

Útil para:
- demos de input;
- física;
- separación de sistemas;
- escenas pequeñas.

Su stack de ejemplo usa Expo/RN más antiguos. Tratar como material conceptual.

### wcandillon/can-it-be-done-in-react-native
MIT.

Útil para:
- patrones de Reanimated;
- motion design;
- gestos;
- transiciones;
- ejemplos de alto rendimiento.

No copiar pantallas completas ni identidad. Extraer patrones técnicos.

### Shopify/react-native-skia
MIT.

Útil para:
- Canvas;
- Path;
- shaders;
- particles/examples;
- integración con Reanimated.

### software-mansion/react-native-reanimated
MIT.

Útil para:
- shared values;
- timing/spring;
- entering/exiting;
- worklets;
- gestures si se añaden.

### lottie-react-native/lottie-react-native
Apache-2.0.

Útil para:
- reproducción de JSON Lottie;
- control de progreso/playback;
- fallbacks.

### rive-app/rive-nitro-react-native
MIT; actualmente beta.

Ventajas:
- state machines/data binding;
- interacción compleja;
- runtime moderno con Nitro;
- repo incluye expo57-example.

Riesgos:
- beta;
- Nitro Modules;
- CMake/native build;
- tamaño;
- Windows long paths;
- más superficie de fallo.

Decisión: spike detrás de feature flag.

### maplibre/maplibre-react-native
MIT.

Ya instalado.

Aprovechar:
- Images para iconos;
- SymbolLayer;
- expressions;
- GeoJSON sources;
- layer ordering;
- camera.

### Turfjs/turf
MIT.

Usar módulos concretos para evitar bundle innecesario.

Casos:
- `booleanPointInPolygon`;
- `buffer`;
- distance;
- point/line distance;
- helpers GeoJSON.

## Librerías explícitamente NO necesarias ahora

- Unity/Godot: cambia completamente el producto/runtime.
- react-native-game-engine como dependencia de producción: demasiado acoplamiento a stack antiguo.
- Three.js: no necesario para V1.
- Babylon/React Three Fiber: coste muy alto para el objetivo actual.
- motor de física completo: no necesario para mapa/rutas.
- ARCore/ARKit: no antes de validar el core loop.

## Política de copia de código

Si un agente copia/adapta más que una idea trivial:

1. registrar source repo;
2. registrar archivo/origen;
3. registrar licencia;
4. conservar notices exigidos;
5. describir cambios;
6. añadir entrada en `docs/game/THIRD_PARTY_NOTICES.md`.

Si se usa solo la API pública de una dependencia instalada, basta con registrar la dependencia/licencia en el inventario.

## Investigación futura

Candidatos posteriores:
- cámara para photo challenges;
- pedómetro/sensores;
- mini-juegos de orientación;
- accessibility/reduced motion;
- performance telemetry;
- shaders muy ligeros para rare discoveries.
