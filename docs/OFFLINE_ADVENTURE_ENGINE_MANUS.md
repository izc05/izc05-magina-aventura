# Offline Adventure Engine — integración Manus

## Estado y alcance

Esta rama integra el prototipo visual **Aventura Mágina Engine** en el monorepo móvil sin modificar `main` ni fusionar ninguna rama. La baseline elegida es `origin/main` en `8519d3b`, la versión canónica más reciente disponible en el momento de la integración. La rama de trabajo es `feat/offline-adventure-engine-manus`.

La experiencia conserva el HUD de expedición nocturna, la textura topográfica, el paisaje Babylon 3D, la ruta estilizada, los checkpoints, la cámara/AR fallback, la mochila y el estado offline local. El componente web es la primera superficie interactiva; la variante nativa reutiliza el mapa MapLibre existente y muestra de forma explícita que Babylon/AR todavía son una capacidad web.

**Toda coordenada, ruta, checkpoint, distancia GPS y recompensa usada por el prototipo de esta rama es TEST DATA.** El fixture se deriva de la ruta de desarrollo existente `sendero-de-cuadros-dev`; no representa una geometría verificada de MA-001 Cuadros/Bedmar.

## Estructura creada

| Ruta | Responsabilidad |
|------|-----------------|
| `apps/mobile/src/features/adventure-engine/AdventureEngineScreen.web.tsx` | HUD web del prototipo: mapa visual, misión, GPS simulado, XP, inventario, sincronización local y cámara/AR fallback. |
| `apps/mobile/src/features/adventure-engine/AdventureEngineScreen.native.tsx` | Fallback nativo que reutiliza `RouteMap`, el repositorio de rutas y el paquete offline; no inventa un segundo adaptador MapLibre. |
| `apps/mobile/src/features/adventure-engine/babylon-scene.ts` | Escena Babylon 3D aislada de React: terreno topográfico, cordillera procedural, iluminación, baliza y ciclo de vida. |
| `apps/mobile/src/features/adventure-engine/adventure-engine.css` | Dirección visual web: tipografía, paleta azul petróleo/ámbar, paneles de vidrio, mapa y responsive. |
| `apps/mobile/src/features/adventure-engine/test-data.ts` | Adaptador explícito de datos ficticios hacia `RouteMapPayload`; todos los ids de prueba comienzan con `test-`. |
| `apps/mobile/src/features/adventure-engine/progression.ts` | Umbrales data-driven de nivel y cálculo de progreso de XP. |
| `apps/mobile/src/features/adventure-engine/adventure-engine.test.ts` | Tests de marcado TEST DATA y progresión. |
| `apps/mobile/assets/` | Assets optimizados y versionables: textura topográfica, emblema de brújula y referencia visual. |
| `tools/optimize-adventure-assets.py` | Script reproducible de reducción de tamaño de los assets generados. |
| `docs/OFFLINE_ADVENTURE_ENGINE_MANUS.md` | Este documento. |

La ruta `apps/mobile/app/adventure/[slug].tsx` queda como punto de entrada del router y delega en la variante de plataforma `AdventureEngineScreen`.

## Qué se reutiliza

La integración reutiliza los contratos y subsistemas existentes en lugar de copiar su lógica:

- **MapLibre:** `apps/mobile/src/map/RouteMap.tsx` continúa siendo el único adaptador de mapa nativo. La variante nativa lo consume directamente.
- **GPX y geometría:** `@magina-aventura/route-import`, `@magina-aventura/geo` y `@magina-aventura/contracts` siguen siendo los contratos canónicos para geometría, bounds, posiciones GeoJSON y checkpoints.
- **Paquetes offline:** `evaluateOfflinePackage`, `downloadRoutePackage`, `RoutePackagePort` y `expoRoutePackagePort` continúan siendo la fuente de verdad para estado, integridad, descarga y almacenamiento de paquetes.
- **GPS/actividad:** se incorporan desde la rama existente `origin/feat/gps-activity-v1` los contratos `ActivitySession`/`ActivitySnapshot`, el filtro de calidad `normalizeLocationSample`, la máquina de estados y la proyección sobre ruta. El prototipo llama a `normalizeLocationSample` y `transitionActivityState`; no crea un segundo filtro GPS.
- **XP y gamificación:** `RewardPreview`, `RewardEarnedEvent`, `XPRewardCard` y `CollectionCard` existentes permanecen intactos. El nuevo módulo `progression.ts` solo aporta thresholds data-driven para la barra y el nivel del HUD; las recompensas reales siguen sujetas a validación del servidor.
- **Datos de desarrollo:** el fixture `developmentRoutes` existente se referencia y se marca con `developmentFixture: true`; no se publica como ruta verificada.

## Qué es nuevo

Lo nuevo es la capa de presentación del prototipo y su composición multiplataforma: la escena Babylon 3D web, el HUD de mapa topográfico, la consola de localización, el flujo de cámara/AR fallback, la mochila local, el adaptador de datos de test, la progresión visual data-driven y los assets reducidos. La simulación de GPS sirve para recorrer la interfaz sin permisos ni hardware; no pretende sustituir el engine de actividad de producción.

## Cómo ejecutar

Desde la raíz:

```bash
COREPACK_ENABLE_PROJECT_SPEC=0 pnpm install --frozen-lockfile=false
COREPACK_ENABLE_PROJECT_SPEC=0 pnpm typecheck
COREPACK_ENABLE_PROJECT_SPEC=0 pnpm test
COREPACK_ENABLE_PROJECT_SPEC=0 pnpm --filter @magina-aventura/mobile web
```

Abrir la ruta de aventura de desarrollo `sendero-de-cuadros-dev` en el navegador Expo web. En el HUD, `Activar GPS` inicia el flujo simulado, reduce la distancia al checkpoint y pasa la actividad de `DRAFT` a `ACTIVE`. `Registrar llegada` completa el checkpoint ficticio, suma XP provisional y añade un objeto a la mochila. La cámara muestra un fallback básico con POI superpuestos y la etiqueta `ARCore no disponible`.

La variante nativa se ejecuta con el flujo Expo habitual. Su mapa sigue siendo MapLibre y su estado offline sigue pasando por el paquete de ruta existente; Babylon 3D no se activa en iOS/Android en esta rama.

## Sustituir GPS simulado por GNSS real

1. Añadir un adaptador de plataforma basado en el módulo de localización seleccionado para Expo, con permisos foreground/background y una política clara de denegación.
2. Convertir cada lectura nativa a `RawLocationSample` con `sequence`, timestamp ISO, latitud, longitud, precisión, altitud, velocidad y rumbo.
3. Pasar cada muestra por `normalizeLocationSample` antes de alimentar el estado de actividad. Las muestras con mala precisión, tiempo no monotónico o velocidad imposible deben conservarse como rechazadas para auditoría local, no descartarse silenciosamente.
4. Proyectar la posición válida sobre la geometría usando `nearestPointOnRoute`, actualizar `ActivitySnapshot` y evaluar los radios de `RouteMapCheckpoint`.
5. Emitir eventos locales provisionales y encolar `ActivitySyncBatch` mediante el mecanismo offline-sync existente. El servidor debe ser la autoridad para recompensas verificadas, ranking y aceitunas.
6. Sustituir el botón de demo por estados reales de permiso, precisión y disponibilidad; mantener un modo de desarrollo aislado para pruebas deterministas.

## Conectar MA-001 Cuadros/Bedmar

MA-001 debe entrar como contenido verificado/versionado, no como una modificación de `test-data.ts`:

1. Obtener y revisar la fuente GPX oficial o validada en el flujo de importación existente.
2. Ejecutar `parseGpx` para producir la línea GeoJSON, start point, bounds y elevaciones; corregir el `routeId`, `geometryVersion` y versionado de contenido.
3. Publicar la geometría y checkpoints mediante el flujo de PostGIS/RLS existente. Los checkpoints deben incluir posiciones y radios verificados.
4. Crear el `OfflineMapAsset` y su manifiesto PMTiles con URL HTTPS, byte size, checksum, bounds y style template versionado.
5. Hacer que el repositorio de payload devuelva `RouteMapPayload` de MA-001 y que la pantalla deje de seleccionar el fixture de desarrollo.
6. Validar la ruta en campo y conservar `test-data.ts` únicamente para demos automatizadas, nunca como fallback silencioso de producción.

## Añadir futuras aventuras

Una nueva aventura debe ser un registro de contenido, no una copia del HUD. Añadir una ruta versionada a los contratos/repositorio, sus geometrías GPX, manifiesto offline, checkpoints, discovery hints, recompensas y documentación editorial. El HUD debe leer esos datos mediante un adaptador de ruta, mientras que `AdventureEngineScreen` conserva la composición visual común. Las misiones y recompensas deberían evolucionar hacia configuraciones data-driven y eventos de dominio, manteniendo el principio de que el cliente puede mostrar progreso provisional pero no convertirlo en recompensa verificada sin validación.

## Limitaciones actuales

- La ruta, checkpoints, GPS, elevación, POI y recompensas del prototipo son `TEST DATA`.
- El navegador usa una simulación de GPS; no hay permiso GNSS real ni background location.
- La persistencia web usa almacenamiento local del navegador; todavía no hay sincronización real con `offline-sync` desde el HUD web.
- Babylon 3D y la cámara/AR fallback están implementados para Web; la variante nativa conserva MapLibre y deja AR como capacidad futura.
- No se incluyen modelos GLB ni ARCore nativo. La escena 3D utiliza geometría procedural y una textura topográfica optimizada.
- El prototipo no crea ni modifica migraciones, RLS, APIs, recompensas verificadas ni contenido oficial de MA-001.
- La UI aún contiene copy de demo y debe recibir localización, accesibilidad y validación de producto antes de producción.
