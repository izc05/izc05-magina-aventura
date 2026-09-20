# Adventure Engine v2 — análisis de compatibilidad y plan de integración

**Estado:** Fases 1–3 y Fase 4A (hardening + Adventure Runtime) implementadas sobre la baseline; no se ha portado código ejecutable de PR #35.

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

## Contrato de aventura data-driven

El contrato implementado en `packages/contracts/src/adventure-definition.ts` cubre al menos:

```ts
type AdventureDefinition = {
  slug: string;
  version: number;
  routeId: string;
  geometryVersion: number;
  gpx: { uri: string; sha256: string };
  offlineMap: { manifestUri: string; styleTemplateUri: string; contentHash: string };
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

### Fase 1 — incorporar exploración de PR #7 (implementada)

Portar sólo `exploration/types`, `proximity`, `observation`, exports y tests de PR #7. Resolver sus imports contra el activity engine/geo ya presentes en PR #26. No portar cambios de GPS ni ramas completas.

Antes de conectar UI, endurecer:

- Validación de policy.
- Estado hidratado sin duplicados.
- Identidad `kind:id`.
- Secuencia monotónica y deduplicación de muestras.
- Tests de límites, replay y colisiones de IDs.

### Fase 2 — persistencia y recovery (implementada)

Añadir estado y observaciones de exploración a SQLite, con clave única por actividad/target/observación y `lastEvaluatedSequence`. El runtime debe persistir de forma coherente con la muestra procesada. Recovery debe reevaluar sólo muestras posteriores a la secuencia confirmada.

### Fase 3 — integración del controller (implementada)

Integrar el adaptador después de la normalización y persistencia de cada `LocationSample`. Usar el mismo camino para live, background inbox y recovery. Un unlock debe actualizar evidencia y UI; nunca llamar a `finish()`.

### Fase 4A — hardening + Adventure Runtime (implementada)

`AdventureDefinition` ahora valida UUIDs globales, coordenadas, radios, secuencia, versiones, identidades y claves duplicadas, prerrequisitos, dependencias propias y ciclos de cualquier longitud. `explorationConfigFromAdventureDefinition()` es la única entrada desde contenido editorial al `ActivityController`.

Al iniciar una actividad, se fija en `ActivitySession` la tupla `{ adventureSlug, adventureVersion, routeId, routeSlug, geometryVersion }`. El controller comprueba que `routeId` y `geometryVersion` de la definición coinciden con la ruta seleccionada y rechaza recovery cuando la definición proporcionada no coincide exactamente con esa tupla. Por tanto, una v4 descargada no puede sustituir silenciosamente a una actividad ya iniciada con v3.

El almacenamiento SQLite usa `activity_schema_migrations` y migraciones numeradas `001`, `002`, `003`, aplicadas en orden y dentro de transacciones exclusivas. La migración `003` añade el binding de aventura sin borrar las tablas o datos existentes. Las actividades históricas sin binding no se recuperan como si tuviesen una definición nueva: fallan de forma segura hasta que exista una migración editorial explícita.

La pantalla de preparación permite foreground-only cuando Android concede ubicación foreground pero deniega background. Se presenta como aviso de modo limitado, no como error, y el provider continúa usando el inbox SQLite durable mediante el watcher foreground. Con background concedido muestra: “Seguimiento continuo incluso con pantalla bloqueada.”

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

## Decisiones aprobadas aplicadas

- Si background es rechazado, se inicia foreground-only con advertencia; el watcher foreground entra en el mismo inbox durable.
- Checkpoints y discoveries usan UUID global y claves persistidas `checkpoint:<uuid>` / `discovery:<uuid>`.
- `sequence`, `required` y `prerequisiteTargetKeys` son campos explícitos de `AdventureDefinition`; no se infieren desde arrays.
- La policy se inyecta por aventura y se valida contra límites seguros del motor.
- `activityId` se genera como UUID local mediante Web Crypto.
- Las recompensas definitivas quedan fuera del cliente y requieren estado servidor `VERIFIED`.
- Babylon, HUD, inventario visual y AR nativa siguen fuera de estas fases.

## Implementación de Fases 1–3

La rama contiene el Exploration Engine puro portado y endurecido en `packages/activity-engine/src/exploration/`. La evaluación consume únicamente `LocationSample` normalizado del motor real de PR #26, valida policy y targets, procesa muestras en orden monotónico, rechaza replay, aplica prerequisitos explícitos y emite observaciones provisionales idempotentes por `activityId + targetKey`.

El estado se persiste junto a la actividad en SQLite mediante `apps/mobile/src/activity/migrations/002-exploration.ts`. Las tablas `activity_exploration_state` y `activity_exploration_observations` guardan `last_evaluated_sequence`, JSON de estado y una clave primaria `(activity_id, target_key)`. El store en memoria implementa el mismo contrato para tests; no se usa `localStorage`.

El controller aplica exploración después de normalizar cada muestra, tanto desde el inbox background como desde el watcher foreground-only y recovery. Un unlock no cambia `ActivityState` a `FINISHED`, no concede XP, inventario ni recompensa, y no se sincroniza como recompensa definitiva. `packages/contracts/src/adventure-definition.ts` valida el contrato versionado para que GPX, mapa offline, targets, misiones, assets, escenas y progresión provengan de contenido editorial/backend; no contiene datos de MA-001.

## Riesgos pendientes

- La definición real de MA-001, su GPX, mapa offline, radios y UUIDs aún no está conectada.
- La sincronización de observaciones y su validación servidor `VERIFIED` requieren el contrato de API correspondiente.
- El modo foreground-only depende del ciclo de vida de la aplicación; el usuario debe conservar la app activa para minimizar pérdida de tracking.
- El runner SQLite ya registra versiones; una migración editorial separada sería necesaria para recuperar actividades históricas creadas antes del binding de AdventureDefinition, pues no se inventa su versión.
- HUD Android, inventario visual, Babylon Android, cámara y ARCore se mantienen deliberadamente fuera de Fases 1–3.

No se ha modificado `main`, no se ha tocado ni cerrado PR #35 y no se ha inventado contenido de MA-001.
