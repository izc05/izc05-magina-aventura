# Adventure Engine v2 — análisis de compatibilidad y plan de integración

**Estado:** análisis solamente; no se ha portado código de PR #35 ni se han hecho cambios estructurales.

**Rama creada:** `feat/adventure-engine-v2`

**Baseline exacta:** `origin/feat/integration-gps-visual-v1` en `60efff07c3f86b13348709ef8ba02a11a89476bc`.

**Restricciones:** `main` no se modifica. PR #35 no se modifica, cierra ni fusiona. No se incorporan datos ficticios de MA-001.

## Conclusión ejecutiva

PR #26 es la línea canónica para Android real: proveedor GNSS, permisos, background tracking, inbox SQLite, recuperación, motor de actividad, snapshots, cola offline, MapLibre y UI canónica. Esa cadena debe permanecer intacta y ser el propietario exclusivo del estado de actividad.

PR #7 aporta el motor puro de evidencia de proximidad para checkpoints y discoveries. Debe reutilizarse como consumidor posterior al filtro GPS de PR #26, no reemplazarse ni duplicarse. Sus desbloqueos son **provisionales**: no finalizan la actividad y no conceden recompensas.

PR #35 es un prototipo donante. Sus aportes útiles son la dirección visual, la composición de HUD, el concepto de inventario, la interfaz conceptual de descubrimientos y la escena/receta de Babylon 3D. Su GPS, almacenamiento web, sincronización simulada, datos de ruta, recompensas locales y módulos GPS duplicados deben excluirse.

## Matriz de compatibilidad

| Área | PR #26 | PR #7 | PR #35 | Decisión para v2 |
|---|---|---|---|---|
| GPS y background | Canónico: `LocationProvider -> inbox SQLite -> ActivityController -> activity-engine -> SQLite/UI`. | Consume `LocationSample` normalizado; no gestiona permisos. | Simulado con coordenada fija y temporizador web. | Conservar íntegramente PR #26. PR #7 se invoca sólo después de `normalizeLocationSample`. PR #35 se descarta para ejecución. |
| Recuperación | `recover`, muestras posteriores al snapshot, secuencias e inbox idempotente. | No tiene persistencia. | `localStorage` y estado web. | Mantener recovery SQLite de PR #26; persistir también el progreso de exploración por actividad. |
| Proximidad | Tiene geometría de ruta y progreso/off-route. | `evaluateExplorationSample`, evidencia consecutiva, reset por gap, unlock único y `explorationObservationKey`. | No hay geofencing real. | Integrar únicamente el módulo de exploración de PR #7; no crear otro radio, debounce o fórmula. |
| Checkpoints | `RouteMapCheckpoint` y `RouteMapPayload`. | Target genérico sin orden ni prerequisitos. | Checkpoints ficticios. | Mapear checkpoints canónicos explícitamente. Avanzar uno por uno desde estado de exploración; una llegada nunca finaliza la actividad. |
| Discoveries | `discoveryHints` públicos no contienen posición/radio. | Soporta targets discovery si existen coordenadas/radios seguras. | UI conceptual de POI. | Obtener coordenadas/radios de fuente editorial offline/versionada o servidor; no inferirlas desde `discoveryHints`. |
| Offline | Paquetes, PMTiles, store SQLite, cola de actividad y recuperación. | Contrato puro; puede aportar idempotencia de observaciones. | Simulación web. | Mantener offline de PR #26. Añadir persistencia SQLite de exploración, separada de la cola de track. |
| UI Android | UI canónica prepare -> actividad -> resumen y MapLibre. | Sin UI. | HUD web, mochila y cámara conceptual. | Extender la UI React Native canónica; no reemplazarla por fallback Manus. |
| Recompensas/inventario | Estados locales y backend de validación; cliente no debe conceder premios. | Observaciones provisionales. | XP e inventario locales. | Sólo resultado servidor `VERIFIED` puede producir XP, inventario, aceitunas o logros. |
| Babylon/3D/AR | No contiene Babylon. | No depende de renderer. | Babylon web con `HTMLCanvasElement`; cámara/AR sólo visual. | Mantener como experimento desacoplado, inicialmente no crítico para Android. No implementar ARCore ni cámara nativa ahora. |

## Partes nuevas que sí merecen integrarse

1. **Dirección visual del HUD:** jerarquía de paneles, paleta azul petróleo/ámbar, indicadores de misión, distancia, evidencia, modo offline y estado de exploración. Debe reconstruirse en componentes React Native usando tokens canónicos.
2. **Inventario visual:** panel de mochila, estados de objeto encontrado/bloqueado y presentación de colección. Debe conectarse a contratos y persistencia reales, no a `string[]` en `localStorage`.
3. **Interfaz de descubrimiento:** patrón de POI, pista, aproximación, evidencia y desbloqueo. El motor real será PR #7; la UI sólo presentará su estado.
4. **Escena Babylon 3D:** `babylon-scene.ts` puede servir como referencia de composición: terreno, crestas, iluminación, baliza, cámara y ciclo de dispose. No se considera todavía renderer Android productivo.
5. **Assets:** brújula y textura topográfica como candidatos, después de revisar licencia, tamaño, memoria y rendimiento. El visual target puede permanecer como referencia de diseño, no como fondo de cámara real.
6. **Progresión data-driven:** la idea de thresholds configurables es reutilizable, pero los valores y reglas económicas deben pertenecer a configuración de producto validada.
7. **Arquitectura de aventura por datos:** la pantalla no debe codificar rutas, checkpoints, misiones o recompensas; debe consumir una definición versionada.

## Partes que no se deben copiar

- `AdventureEngineScreen.web.tsx` como implementación de GPS, geofencing, sincronización o finalización.
- `localStorage`, el booleano `synced` y cualquier texto que sugiera una sincronización real.
- `test-data.ts`, coordenadas, bounds, radios, checkpoints, POI, nombres, XP, inventario o cifras del donante en producción.
- Los módulos GPS/activity, contratos, filtro, máquina de estados y proyección que PR #35 añadió duplicando la línea existente.
- `RouteMap` o el mapa activo de PR #26; no se crea un segundo adaptador cartográfico.
- El motor de proximidad: PR #7 es la única fuente.
- `CameraPanel` como cámara/AR real; no solicita permisos ni accede a hardware.
- `babylon-scene.ts` directamente en Android; depende de canvas HTML y no demuestra compatibilidad Expo/Android.
- Cualquier concesión local de XP, inventario, aceitunas, logros o recompensas por una llegada provisional.

## Arquitectura objetivo

```text
GNSS / background task PR #26
        |
        v
SQLite inbox -> ActivityController / recovery
        |
        +--> normalizeLocationSample (PR #26)
        |       |
        |       +--> Activity Engine: métricas, track, off-route, snapshots
        |       |
        |       +--> Exploration Engine PR #7:
        |               checkpoints + discoveries + evidencia provisional
        |
        +--> SQLite activity store + exploration state/observations
        |
        +--> UI React Native canónica
        |       +--> MapLibre / ActiveAdventureMap
        |       +--> HUD de misión y progreso
        |       +--> inventario visual
        |       +--> discoveries/checkpoints
        |       +--> Babylon experimental desacoplado
        |
        +--> sync autenticado e idempotente
                |
                v
        validación servidor -> VERIFIED -> recompensas/inventario definitivos
```

El task de background sigue limitado a persistir entregas nativas en el inbox. El motor y la exploración se ejecutan al drenar el inbox desde el runtime, igual que en live/recovery, para que los tres caminos tengan comportamiento determinista.

## Contrato de aventura data-driven propuesto

La forma exacta se implementará después de revisar los contratos de PR #26 y PR #7 en conjunto, pero debe cubrir al menos:

```ts
type AdventureDefinition = {
  slug: string;
  contentVersion: number;
  routeId: string;
  geometryVersion: number;
  gpxAssetId: string;
  offlineMapAssetId: string | null;
  checkpoints: AdventureCheckpoint[];
  missions: AdventureMission[];
  discoveries: AdventureDiscovery[];
  assets: AdventureAsset[];
  scenes3d: AdventureScene3d[];
  progression: AdventureProgression;
  rewards: AdventureRewardConfig;
};
```

Reglas obligatorias:

- `routeId` y `geometryVersion` quedan fijados en `ActivitySession` al comenzar.
- Las posiciones son `[longitude, latitude]`; el mapeo a target debe ser explícito.
- Los discoveries sólo pueden ser targets espaciales si la definición versionada incluye posición y radio desde una fuente autorizada.
- La identidad persistida de exploración debe ser inequívoca: `kind:id` o IDs globalmente únicos.
- La policy de proximidad debe ser inyectada y validada: precisión máxima, muestras consecutivas y gap máximo, todos finitos y positivos.
- `AdventureCheckpoint` debe incluir su orden/prerrequisito sólo si producto lo define explícitamente; PR #7 no lo infiere.
- Una observación de llegada es evidencia local provisional. No cambia `ActivityState` a `FINISHED`.
- Sólo una acción explícita de finalizar produce `FINISHED`; únicamente el servidor puede elevar el resultado a `VERIFIED` y emitir recompensas.
- Los datos TEST deben vivir en un módulo separado y quedar bloqueados para builds/contenido publicable.

## Plan exacto por fases

### Fase 0 — baseline y límites

Crear la rama desde `origin/feat/integration-gps-visual-v1@60efff07…`. Mantener PR #35 intacto como donante y no comparar la implementación v2 contra `main` para decidir compatibilidad. Documentar la frontera Android/Web.

### Fase 1 — incorporar exploración de PR #7

Portar sólo `exploration/types`, `proximity`, `observation`, exports y tests de PR #7. Resolver sus imports contra el activity engine/geo ya presentes en PR #26. No portar cambios de GPS ni ramas completas.

Antes de conectar UI, endurecer:

- Validación de policy.
- Estado hidratado sin duplicados.
- Identidad `kind:id`.
- Secuencia monotónica y deduplicación de muestras.
- Tests de límites, replay y colisiones de IDs.

### Fase 2 — persistencia y recovery

Añadir estado y observaciones de exploración a SQLite, con clave única por actividad/target/observación y `lastEvaluatedSequence`. El runtime debe persistir de forma coherente con la muestra procesada. Recovery debe reevaluar sólo muestras posteriores a la secuencia confirmada.

### Fase 3 — integración del controller

Integrar el adaptador después de la normalización y persistencia de cada `LocationSample`. Usar el mismo camino para live, background inbox y recovery. Un unlock debe actualizar evidencia y UI; nunca llamar a `finish()`.

### Fase 4 — HUD Android canónico

Extender `presentActiveAdventure`, `useActiveAdventure` y la pantalla Android existente con:

- Checkpoint actual y lista pendiente/desbloqueada.
- Evidencia consecutiva.
- Estado de precisión/GPS no fiable.
- Distancia al objetivo desde el motor de proximidad.
- Discovery encontrado y estado provisional.
- Mochila visual conectada a un modelo real, sin otorgar inventario definitivo localmente.

No reemplazar `ActiveAdventureMap` ni la navegación Android existente.

### Fase 5 — definición de aventuras

Crear contratos y repositorio para que la pantalla reciba `AdventureDefinition`. No conectar MA-001 hasta disponer de GPX, geometría, mapa offline, checkpoints y contenido verificados. Ningún fixture del donante debe ser fallback silencioso.

### Fase 6 — sincronización y validación

Separar batches de track y observaciones con UUID e idempotency keys estables. Implementar uploader/retry autenticado cuando exista el contrato de API. El servidor valida muestras, `routeId`, `geometryVersion` y observaciones antes de `VERIFIED`.

### Fase 7 — Babylon experimental

Mantener el módulo 3D fuera del camino crítico de tracking. Definir un adaptador de sólo lectura desde `ActivitySnapshot`/estado de aventura, feature flag y fallback MapLibre. Antes de Android 3D, evaluar renderer compatible, GPU, batería, memoria y dispositivos. ARCore y cámara nativa quedan fuera de esta primera integración.

## Validación necesaria

- Typecheck, tests unitarios, fronteras de paquetes puros y tests de PR #26.
- Tests de proximidad de PR #7: radio, precisión, evidencia consecutiva, gap, muestra rechazada, unlock único, replay y orden checkpoint-by-checkpoint.
- Tests de controller/SQLite: live, inbox, crash/relaunch, recovery y pausa.
- Test explícito: llegar a checkpoint o discovery **no** finaliza la actividad ni produce una recompensa.
- Tests de ausencia de datos TEST en contenido publicable.
- Tests de sync: UUID, autenticación, idempotencia, retry y validación antes de `VERIFIED`.
- Tests Android reales: permisos, bloqueo, terminación, reapertura, OEM, batería, conectividad y PMTiles/estilo offline.
- Spike separado de Babylon: compatibilidad, memoria, GPU, batería y fallback.

## Preguntas abiertas antes de implementar

1. ¿Se aprueba un modo foreground-only si se niega background, o el arranque exige siempre background?
2. ¿Cuál será la fuente editorial/versionada de posiciones y radios de discoveries?
3. ¿Los IDs de checkpoint/discovery son globalmente únicos o se adopta formalmente `kind:id`?
4. ¿Qué significa `required`, cuál es el orden y qué prerequisitos tendrá una aventura?
5. ¿Quién versiona y aprueba la policy de precisión/radio/muestras/gap?
6. ¿Qué endpoint y worker validarán batches, y cómo se resuelve el `activityId` actual frente a la exigencia UUID del backend?
7. ¿Qué reglas convierten `VERIFIED` en XP, inventario, aceitunas y logros?
8. ¿Se quiere mantener Babylon sólo como experimento web durante v2 o iniciar un spike de renderer Android separado?

## Estado actual de esta rama

Sólo se ha creado la rama desde la baseline solicitada y se ha añadido este documento de análisis. No se han portado archivos de PR #35, no se ha modificado `main`, no se ha tocado PR #35 y no se ha inventado contenido de MA-001.
