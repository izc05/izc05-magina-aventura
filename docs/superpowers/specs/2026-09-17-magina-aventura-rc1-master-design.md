# Mágina Aventura — Master Spec RC1

Fecha: 2026-09-17
Estado: diseño aprobado para RC1
Rama de especificación: `docs/rc1-master-spec`

## 1. Propósito

Mágina Aventura RC1 es la primera candidata cerrada de una aplicación móvil de senderismo y exploración centrada en Sierra Mágina. Su núcleo es una aventura real, offline-first, con GPS, cartografía, descubrimientos, progreso y validación servidor.

La definición operativa de RC1 es deliberadamente concreta: una persona instala el APK candidato, descarga la aventura canónica de Cuadros/Bedmar, recorre la ruta durante horas incluso sin cobertura y con la pantalla bloqueada, registra checkpoints y descubrimientos, puede tomar una fotografía, termina offline, recupera Internet y obtiene exactamente una actividad validada con su progreso correcto; todo debe poder administrarse y diagnosticarse sin editar manualmente la base de datos.

La prioridad de RC1 es, por este orden: fiabilidad GPS/offline, seguridad, integridad de datos, experiencia de aventura, contenido, progresión, comunidad y extras.

## 2. Decisiones de alcance congeladas

### 2.1 Piloto canónico

La aventura canónica de RC1 es Cuadros/Bedmar. El Peralejo/Cambil puede seguir existiendo como fixture técnico o pre-beta, pero no sustituye al piloto canónico ni puede aparecer como la ruta oficial de validación final.

Sólo una ruta con datos y geometría suficientemente verificados puede alcanzar `ADVENTURE_READY`.

### 2.2 Mi Olivo y economía comercial

RC1 sí incluye generación de XP, logros, aceitunas validadas, ledger idempotente e integración por outbox.

Quedan fuera del gate RC1 y se reservan para RC1.1/V2: Mi Olivo visual, árbol 2.5D, wallet comercial completa, catálogo de premios, almazaras/partners, stock, reservas, canje físico y QR.

### 2.3 Comunidad

RC1 incluye una comunidad mínima útil por ruta: lectura de fotografías/reseñas/avisos, incidencias, contenido moderado y publicación sencilla donde esté habilitada.

Quedan fuera de RC1: red social completa, seguidores, grupos, mensajería privada, chat avanzado y funciones sociales complejas.

### 2.4 Meteorología

RC1 integra meteorología mediante una abstracción interna de proveedor. AEMET puede actuar como fuente, pero la app móvil no depende directamente de su API. La UI muestra información meteorológica relevante, avisos disponibles y fecha/hora de actualización. Offline usa el último snapshot disponible con indicación clara de antigüedad. El clima nunca bloquea el motor GPS.

### 2.5 Navegación

RC1 ofrece posición real, trazado oficial, orientación, progreso, próximo checkpoint, distancia restante, recenter/orient y detección de off-route tolerante a ruido GPS.

Quedan fuera de RC1: turn-by-turn completo, voz y recálculo dinámico de ruta.

### 2.6 Descubrimientos y cámara

RC1 incluye descubrimientos reales mediante proximidad/contexto en seis familias canónicas: Flora, Fauna, Patrimonio, Olivar, Tradiciones y Paisaje.

Un descubrimiento offline es provisional hasta validación servidor. La fotografía es opcional por defecto, se guarda privada y puede publicarse posteriormente mediante acción explícita. No se incluye reconocimiento IA de especies ni AR en RC1.

### 2.7 Progresión

RC1 incluye XP, niveles, estadísticas verificadas, insignias, colecciones, retos simples y tres rankings: Senderista, Explorador y Mágina. La autoridad es servidor y sólo las actividades verificadas consolidan progresión. El tiempo y el ritmo son estadísticas personales; no se premia directamente ir más rápido.

### 2.8 Cuenta y privacidad

Las rutas se pueden explorar sin login. Iniciar aventura, conservar historial, sincronizar progreso y recibir recompensas requieren cuenta.

Tracks y fotografías son privados por defecto. La publicación es opt-in. No existe seguimiento público en tiempo real por defecto.

### 2.9 Notificaciones

RC1 incluye notificaciones útiles de seguridad, cambios relevantes de ruta, validación de actividad y recordatorios vinculados a aventura. Las alertas críticas durante una ruta —off-route, GPS prolongadamente perdido, batería— deben funcionar localmente y no depender de push.

### 2.10 Super Admin

RC1 dispone de un Super Admin operativo para rutas, versiones, GPX, checkpoints, descubrimientos, multimedia, seguridad, actividades marcadas, usuarios básicos, comunidad/moderación, progresión, configuración, auditoría y readiness.

El Admin no puede saltarse los gates de publicación por simple cambio de estado.

## 3. Arquitectura consolidada

El producto se mantiene como un único monorepo.

Estructura objetivo:

```text
apps/
  mobile/
  admin/

packages/
  contracts/
  domain/
  geo/
  activity-engine/
  offline-sync/
  route-import/

supabase/
  migrations/
  functions/
  tests/
  seed/

docs/
  architecture/
  field-tests/
  superpowers/
```

Responsabilidades:

- `apps/mobile`: experiencia Android, almacenamiento local, mapas, captura de GPS, cámara, UX offline y sincronización.
- `apps/admin`: control plane editorial y operativo.
- `packages/contracts`: contratos y tipos compartidos versionables.
- `packages/domain`: progresión, validación, rewards, rankings, readiness y reglas puras.
- `packages/geo`: geometría, métricas y cálculos GIS.
- `packages/activity-engine`: estados de aventura, tratamiento GPS, off-route, checkpoints y descubrimientos.
- `packages/offline-sync`: persistencia y sincronización idempotente.
- `packages/route-import`: GPX/KML/GeoJSON, procedencia e ingestión.
- Supabase: Auth, PostgreSQL/PostGIS, Storage, RLS, funciones/RPC, auditoría y persistencia compartida.

La autoridad queda separada:

- Mobile registra evidencia y mantiene la aventura operativa offline.
- Activity Engine gobierna estados locales de GPS y aventura.
- Server valida y consolida la verdad compartida.
- Domain calcula progresión y rewards de forma determinista.
- Admin gestiona contenido, seguridad y publicación.

## 4. Flujo principal de una aventura

```text
Admin
  -> publica una route_version
  -> se genera/activa offline_package
Mobile
  -> descarga y verifica paquete
  -> inicia actividad
Activity Engine
  -> registra track/eventos/checkpoints/descubrimientos
Local storage
  -> persiste incrementalmente
Offline Sync
  -> envía lotes idempotentes
Server
  -> valida actividad
  -> VERIFIED | FLAGGED | REJECTED
Domain
  -> sólo si VERIFIED: XP + niveles + estadísticas + badges + retos + rankings
Reward Ledger
  -> sólo si VERIFIED: aceitunas idempotentes
Integration Outbox
  -> contrato preparado para futuros consumidores como Mi Olivo
```

Mi Olivo no forma parte del circuito operativo de RC1.

## 5. Publicación y versionado de rutas

El flujo editorial conceptual de una ruta es:

`BORRADOR -> REVISIÓN -> CONTENIDO_VERIFICADO -> FIELD_TEST_PENDING -> ADVENTURE_READY -> PUBLICADA`

`RESTRICTED` y `CLOSED` son estados operacionales separados que no destruyen el historial editorial.

La publicación automática queda prohibida. El Admin es la autoridad editorial y el servidor aplica gates.

Una versión publicada no se edita destructivamente. Un cambio material genera una nueva `route_version`.

Una actividad conserva siempre el `route_version_id` y el paquete offline que utilizó.

## 6. Datos canónicos

### 6.1 Rutas

```text
routes
  -> route_versions
      -> route_geometry
      -> checkpoints
      -> discoveries
      -> route_media
      -> route_safety
      -> weather_snapshot reference
      -> offline_package
```

`routes` conserva identidad estable. `route_versions` conserva una publicación concreta.

### 6.2 Actividades

Campos mínimos de referencia:

```text
activity_id
user_id
route_id
route_version_id
offline_package_version
started_at
finished_at
lifecycle_state
sync_state
validation_state
```

Subentidades:

```text
activities
  -> activity_track_points
  -> activity_events
  -> activity_checkpoints
  -> activity_discoveries
  -> activity_media
  -> validation_result
```

El track GPS original es evidencia y no se sobrescribe para hacerlo coincidir con la ruta.

### 6.3 Estados

Los ejes de estado son conceptualmente independientes:

- lifecycle: `DRAFT -> ACTIVE <-> PAUSED -> FINISHED`;
- sync: `LOCAL_ONLY -> SYNC_PENDING -> UPLOADING -> SERVER_RECEIVED`;
- validation: `PENDING -> VALIDATING -> VERIFIED | FLAGGED | REJECTED`;
- reward: `NOT_ELIGIBLE | PENDING -> REWARDED`, donde `REWARDED` sólo puede alcanzarse desde una actividad `VERIFIED`.

La implementación puede representar estos ejes en columnas distintas; no se reduce a un booleano ambiguo `completed`.

### 6.4 Checkpoints y descubrimientos

Los checkpoints y descubrimientos tienen UUID estable y se asocian a la versión de ruta cuando posición o reglas dependen de ella.

La evidencia de descubrimiento guarda actividad, discovery, instante, posición, precisión y estado local/servidor. Un descubrimiento offline permanece provisional hasta validación.

### 6.5 Media

La fotografía privada y la publicación comunitaria son conceptos separados. Una media puede estar vinculada a actividad, descubrimiento o checkpoint sin ser pública.

La publicación en Comunidad crea una relación explícita. Eliminar una publicación no borra automáticamente la evidencia privada de la aventura.

### 6.6 Perfil y progreso

Se separan:

- `profiles`
- `user_progress`
- `user_stats`
- `user_achievements`
- `user_collections`
- `challenge_progress`
- `leaderboard_scores`

Las estadísticas consolidadas se derivan de actividades verificadas y no son cifras editables libremente.

### 6.7 Ledger y outbox

Las aceitunas usan un ledger append-only con `source_key` única. Reintentos de la misma actividad no generan concesiones repetidas.

El outbox emite eventos idempotentes y versionados, por ejemplo `magina-aventura.olive-grant.v1`.

### 6.8 Seguridad de ruta

`route_status` y `route_safety_notices` son distintos de la descripción editorial. Los estados operativos son `OPEN`, `CAUTION`, `RESTRICTED`, `CLOSED` y `UNKNOWN`.

Cada aviso incluye procedencia, vigencia, fecha de revisión y motivo.

### 6.9 Weather snapshots

La meteorología se almacena como snapshots con proveedor, `observed_at`, `fetched_at`, `valid_until`, payload y resumen normalizado. La app puede mostrar un snapshot caducado sólo si deja claro que no está actualizado.

### 6.10 Offline packages

Cada paquete offline tiene identidad y versión propias, referencia la `route_version`, mantiene manifest y hashes y contiene como mínimo geometría, checkpoints, descubrimientos necesarios, safety snapshot, weather snapshot, mapas y metadatos esenciales.

## 7. Offline y sincronización

Una aventura descargada debe poder iniciarse, recorrerse, pausarse, reanudarse y terminarse sin Internet.

El paquete se instala de forma atómica: descarga temporal, verificación y activación. Un paquete parcial o corrupto nunca aparece como `READY`. Cuando sea viable se conserva el último paquete válido hasta que el nuevo quede verificado.

La actividad se persiste incrementalmente. El sistema no espera al final para guardar el track.

Estados de sync conceptuales:

`LOCAL_ONLY -> SYNC_PENDING -> UPLOADING -> SERVER_RECEIVED`

Después, la validación sigue su propio eje: `PENDING -> VALIDATING -> VERIFIED | FLAGGED | REJECTED`.

Cada evento/lote posee identidad idempotente. El móvil no elimina un elemento de la cola hasta recibir ACK inequívoco del servidor.

Si la conexión cae entre envío y respuesta, el mismo elemento puede reenviarse sin duplicar datos ni recompensas.

La falta de red no bloquea una aventura si el paquete está `READY` y los requisitos locales esenciales se cumplen.

Un cambio de versión de ruta no reescribe una actividad ya iniciada. Una actividad vinculada a v7 termina contra v7 aunque posteriormente exista v8.

No se implementa sincronización activa multidispositivo compleja en RC1. El cliente impide una actividad activa concurrente por instalación; conflictos entre dispositivos se resuelven conservadoramente en servidor sin bloquear el funcionamiento offline.

No se elimina automáticamente una ruta activa, actividad no verificada, track pendiente ni fotografías pendientes de sincronización.

## 8. API y autoridad

Regla central: el móvil registra evidencia; el servidor decide verdad compartida. El Admin edita contenido; el servidor decide si ese contenido cumple condiciones de publicación.

El móvil puede crear evidencia de actividad: `activity_id`, route version, timestamps, track, eventos, checkpoints, descubrimientos y referencias de media.

El móvil no puede escribir directamente `VERIFIED`, `REJECTED`, XP final, aceitunas finales, logros concedidos, ranking consolidado ni resultado de validación.

Las lecturas simples protegibles por RLS pueden usar acceso Supabase/PostgREST. Operaciones sensibles usan RPC, función o servicio servidor según convenga. No se añaden capas de API innecesarias cuando PostgreSQL + RLS resuelve el caso con seguridad.

Las operaciones críticas del Admin —publicación, cierre/restricción, cambio de rol, resolución sensible y compensaciones— pasan por operaciones controladas y auditadas.

Los contratos importantes se versionan, por ejemplo:

- `activity-ingest.v1`
- `offline-package.v1`
- `weather-snapshot.v1`
- `magina-aventura.olive-grant.v1`

## 9. Validación de actividades y antifraude

RC1 no presupone GPS perfecto. La validación tolera ruido, pérdidas temporales, saltos y precisión degradada.

Capas de comprobación:

- integridad estructural;
- coherencia temporal;
- calidad GPS;
- continuidad espacial;
- cobertura de ruta;
- start/end evidence;
- checkpoints esenciales;
- descubrimientos;
- duplicados/replays;
- consistencia con route version y políticas.

La política de validación es configurable y versionada. No se incrustan números arbitrarios irreversibles en el código.

Clasificación interna de evidencia: `GOOD`, `DEGRADED`, `SUSPICIOUS`, `INVALID`.

Razones estructuradas posibles incluyen `GPS_ACCURACY_DEGRADED`, `LONG_GPS_GAP`, `ROUTE_COVERAGE_LOW`, `IMPOSSIBLE_LOCATION_JUMP`, `DUPLICATE_ACTIVITY`, `CHECKPOINT_EVIDENCE_MISSING`, `ROUTE_VERSION_MISMATCH`.

`VERIFIED`: evidencia suficiente.

`FLAGGED`: existen dudas que requieren revisión; no se consolidan rewards definitivos.

`REJECTED`: corrupción, incompatibilidad fuerte, duplicación confirmada o incumplimiento esencial.

Una pérdida de GPS aislada no implica `REJECTED` automáticamente.

La fotografía es evidencia complementaria, no prueba autónoma de ubicación.

La actividad ya comprometida debe devolver un resultado tipo `already-committed` y no generar un segundo reward.

## 10. Progresión y rewards

Sólo actividades verificadas consolidan:

- XP;
- nivel;
- estadísticas;
- badges;
- progreso/completado de retos;
- rankings;
- aceitunas.

El servidor debe tratar la consolidación crítica como operación coherente e idempotente. Siempre que sea razonable se usa transacción PostgreSQL o procedimientos equivalentes para evitar estados parciales.

No se premia directamente la velocidad. Los rankings se alimentan de actividad verificada y reglas configurables.

## 11. Seguridad y emergencia

Aventura Mágina no se presenta como sistema de rescate ni sustituye a servicios de emergencia.

Durante aventura activa existe acceso rápido a:

- estado de ruta;
- coordenadas actuales;
- posición en mapa;
- altitud si está disponible;
- hora de inicio y tiempo transcurrido;
- información de batería cuando pueda obtenerse de forma fiable;
- acceso a llamada de emergencia;
- copiar/compartir ubicación cuando exista conectividad.

El modo `Necesito ayuda` prioriza legibilidad y elimina gamificación visual.

Las alertas locales incluyen off-route sostenido, GPS prolongadamente perdido y batería baja cuando proceda. El sistema filtra oscilaciones normales para evitar alarmas repetidas.

En RC1 no se incluyen: LiveTrack familiar, detección de caídas, SOS automático ni centro de control.

## 12. Privacidad y seguridad de cuentas

Todo dato de ubicación exacta nace privado.

Compartir una actividad genera una representación pública derivada del track; el track original privado no se publica directamente. La política de redacción de inicio/final es configurable y se calibrará con casos reales.

RLS respeta mínimo privilegio. Moderadores y administradores sólo acceden a ubicación precisa cuando su función lo requiere. El acceso sensible es auditable.

Las versiones públicas de fotografías eliminan metadatos GPS/EXIF innecesarios.

Para ubicaciones sensibles puede existir `canonical_geometry` distinta de `public_geometry`.

Supabase Auth es la identidad principal. El APK y el navegador Admin no contienen `service_role` ni otros secretos privilegiados.

La arquitectura queda preparada para MFA en cuentas administrativas.

Los rankings públicos usan display name/avatar y estadísticas permitidas; nunca email, coordenadas o track privado.

La eliminación de contenido privado debe ser compatible con la conservación mínima de integridad necesaria para evitar replays fraudulentos, usando referencias seudonimizadas o hashes cuando corresponda.

La telemetría RC1 se limita principalmente a estabilidad, GPS, sincronización y rendimiento.

## 13. Rendimiento y batería Android

RC1 se diseña para rutas de varias horas.

La captura GPS, persistencia y renderizado se adaptan al estado: activo, parado, pausado, background o pantalla bloqueada.

Bloquear la pantalla no puede detener la actividad por diseño. Android puede imponer restricciones; por eso existe persistencia incremental y recuperación tras cierre inesperado.

No se fija un porcentaje máximo teórico de batería antes de medir en campo. El gate RC1 registra consumo real, memoria, temperatura y continuidad de track durante pruebas suficientemente largas.

Las animaciones pesadas no forman parte del modo de aventura activa.

La app muestra problemas de permisos/restricciones de batería cuando puedan comprometer el tracking.

Una candidata válida es el APK release exacto producido por CI, no una build local conectada al ordenador.

## 14. Observabilidad y diagnóstico

Cada aventura mantiene un log técnico estructurado separado de las métricas deportivas.

Eventos diagnósticos incluyen inicio, cambios de permiso, foreground/background, GPS perdido/recuperado, precisión degradada, pausa/reanudación, conectividad, escrituras locales, intentos de sync, errores y recuperación.

Cada build registra versión y commit/SHA candidato.

Un paquete de soporte puede incluir actividad, versión app, dispositivo/Android, estados GPS, eventos relevantes, sync y errores, sin incluir tokens, claves ni secretos.

Los logs no son la fuente de verdad del track.

El Admin ofrece una vista de salud de actividades: verificadas, pendientes, fallidas, marcadas, errores de sincronización y anomalías GPS.

## 15. Entornos y despliegue

Existen al menos tres contextos: local/dev, staging y producción.

No comparten base de datos operativa.

Las migraciones son la única fuente de estructura de base de datos. Un entorno vacío debe poder reconstruirse mediante migraciones y seeds apropiados.

Las builds se diferencian explícitamente:

`DEV APK -> STAGING BETA -> RC CANDIDATE -> PRODUCTION`

La candidata RC se valida contra staging. Tras superar gates, una build de producción debe usar la misma base de código y configuración controlada. No se admite “arreglar algo rápido” después de la prueba física y conservar la misma evidencia de readiness.

Las migraciones se despliegan antes que una app que dependa de ellas y se intenta mantener compatibilidad con la versión inmediatamente anterior cuando sea viable.

Los seeds de desarrollo son ficticios y marcados. Producción sólo recibe contenido aprobado.

## 16. Experiencia móvil RC1

Navegación inferior congelada:

`Rutas · Retos · Colecciones · Ranking · Perfil`

La aventura activa es un modo especial por encima de esa navegación.

Recorrido principal:

1. Splash oficial.
2. Onboarding de primera instalación.
3. Inicio/Rutas con búsqueda y filtros.
4. Ficha de ruta con mapa, perfil, datos, seguridad, weather y estado offline.
5. Descarga offline con tamaño y verificación.
6. Preparar aventura con cuenta, paquete, ubicación, GPS, background, batería, estado y safety.
7. Aventura activa con mapa, posición, track, progreso, próximo checkpoint, HUD y controles grandes.
8. Checkpoints y discoveries mediante sheet/tarjeta ligera.
9. Cámara con guardar/repetir; contenido privado por defecto.
10. Seguridad / Necesito ayuda.
11. Pausa y recuperación de aventura en curso.
12. Finalizar con confirmación.
13. Resumen incluso offline, mostrando `Pendiente de sincronización` o `Validando` cuando corresponda.
14. Al llegar `VERIFIED`, mostrar progresión final.
15. Historial con estado de cada actividad.
16. Perfil con nivel, estadísticas verificadas, logros y privacidad.

Los estados offline, GPS degradado, sync pendiente y contenido provisional son visibles y honestos.

## 17. Super Admin RC1

Pantallas/áreas principales:

- Login administrativo.
- Dashboard operativo.
- `RC1 Control Center`.
- Rutas.
- Route Master.
- Track/Mapa.
- Checkpoints.
- Descubrimientos.
- Multimedia.
- Seguridad.
- Offline.
- Versiones.
- Publicación.
- Actividades.
- Usuarios básicos.
- Comunidad/moderación.
- Progresión.
- Rankings.
- Notificaciones.
- Configuración/feature flags.
- Auditoría.
- Estado técnico del sistema.

El Route Master usa una ficha maestra con secciones estables: `General · Track/Mapa · Checkpoints · Descubrimientos · Multimedia · Seguridad · Offline · Versiones · Publicación`.

La publicación muestra requisitos y bloqueos concretos, no un simple toggle.

Las actividades `FLAGGED` permiten inspeccionar track, ruta oficial, gaps GPS, off-route, checkpoints, discoveries, versión APK y timeline. La decisión manual queda auditada; el track original no se modifica.

Las funciones de Mi Olivo/QR/partners que existan en ramas actuales no pertenecen al gate RC1 y deben quedar ocultas/protegidas mediante permisos o feature flags.

Regla operativa: si para gestionar normalmente RC1 es necesario editar manualmente Supabase, falta capacidad en el Admin.

## 18. Catálogo y procedencia

El catálogo puede contener muchas rutas candidatas, pero sólo una ruta verificada puede convertirse en aventura completa.

Estados conceptuales del catálogo: `CATALOG_CANDIDATE -> VERIFIED_CONTENT -> ADVENTURE_READY`.

Cada dato importante conserva procedencia, captura, revisión, confianza, autoría/licencia cuando proceda y responsable/proceso de validación.

Los valores derivados del track —distancia, desnivel, altitud y cobertura— se calculan desde geometría siempre que sea posible y no se editan manualmente sin justificación.

Una fuente de agua no comprobada recientemente no se presenta como disponibilidad garantizada.

## 19. Estrategia de integración

`main` permanece estable mientras se construye RC1.

Se utilizará una rama única de ensamblaje: `integration/rc1`.

No se fusionan automáticamente todos los PRs abiertos. Se integra por capacidades completas y verificadas.

Secuencia conceptual:

`base estable -> móvil pre-beta actual -> auth/perfiles -> catálogo -> Admin/Route Master -> mapas/GPX/offline -> GPS -> checkpoints/discoveries -> progresión -> validación/rewards -> weather/seguridad -> comunidad mínima -> observabilidad -> staging -> Android candidate`

Los PRs antiguos absorbidos por ramas posteriores se conservan como genealogía/evidencia, pero no se vuelven a aplicar individualmente.

La cadena de progresión/rewards se trata como una única cadena funcional apilada, no como merges independientes sin contexto.

El Admin requiere consolidar su rama base con branding, discoveries y catálogo ingest.

El pipeline ARM64 release debe mantenerse en la candidata final.

Mi Olivo permanece fuera de `integration/rc1`.

## 20. Readiness y CI/CD

Estados de readiness: `READY`, `BLOCKED`, `MANUAL`, `NOT_APPLICABLE`.

La evidencia está ligada al gate y al SHA exacto candidato. Un gate manual no puede satisfacerse mediante CI.

Pipeline objetivo por candidato:

`SHA -> install -> typecheck -> tests -> Supabase reset -> RLS/pgTAP -> Expo prebuild -> Gradle release ARM64 -> ABI/size check -> SHA-256 -> artifact`

El APK producido por ese pipeline es el único candidato válido para la prueba física correspondiente.

`RC1 Control Center` debe mostrar, como mínimo: SHA candidato, entorno, Cuadros/route version, offline package, GPS, sync, Supabase, APK, prueba física y bugs P0/P1.

## 21. Gates de aceptación RC1

### Automáticos

- dependencias instalables desde cero;
- typecheck;
- tests unitarios/integración;
- replay GPS;
- migraciones desde cero;
- RLS/pgTAP;
- contratos de dominio;
- Expo prebuild;
- Gradle release ARM64;
- comprobación de ABI/tamaño;
- hash SHA-256 del APK;
- smoke test staging.

### Producto

- onboarding/login;
- catálogo;
- ficha Cuadros;
- descarga offline;
- preparación;
- inicio;
- tracking real;
- pausa/reanudación;
- mapa/progreso;
- checkpoints;
- discoveries;
- cámara;
- finalización;
- resumen;
- sync;
- validación servidor;
- XP/badges/olives;
- historial/perfil.

### Offline y recuperación

- iniciar/continuar/terminar sin datos;
- registrar track y eventos;
- discoveries/checkpoints offline;
- foto pendiente;
- sync tras recuperar red;
- pantalla bloqueada;
- background;
- cambio entre apps;
- pérdida/recuperación GPS;
- cierre forzado y recuperación.

### Seguridad

- off-route físico y regreso;
- coordenadas de emergencia;
- safety disponible offline;
- timestamp de última actualización.

### Admin

- versionar/publicar ruta;
- bloquear publicación incompleta;
- restringir/cerrar;
- revisar actividad marcada;
- trazabilidad de versiones.

### Campo

La prueba final se realiza físicamente en Cuadros/Bedmar con el APK release exacto generado por CI. No se permiten correcciones manuales en la base de datos durante el recorrido de aceptación.

### Severidad

P0/P1 bloquean RC1: pérdida de actividad, corrupción, fallo grave GPS/offline, seguridad, acceso indebido, rewards duplicados o imposibilidad de completar el flujo canónico.

Defectos visuales menores pueden pasar a RC1.1 sólo si no afectan comprensión, seguridad ni flujo principal.

## 22. Protocolo físico mínimo

El gate manual debe cubrir en una misma candidata o en un conjunto controlado de pruebas ligadas al mismo SHA:

- instalar APK release;
- descargar Cuadros;
- iniciar;
- caminar durante tiempo suficiente para evaluar estabilidad;
- bloquear pantalla al menos varios minutos;
- cambiar de aplicación;
- operar sin datos/modo avión;
- perder GPS temporalmente y recuperarlo;
- pausar y reanudar;
- cerrar forzadamente y recuperar;
- alcanzar checkpoint;
- activar descubrimiento;
- tomar foto;
- provocar off-route razonable y volver;
- terminar offline;
- relanzar si procede;
- recuperar red;
- sincronizar una sola vez;
- validar servidor;
- recibir progresión y reward una sola vez;
- comprobar historial/perfil;
- registrar consumo, memoria, temperatura y anomalías.

## 23. Fuera de alcance RC1

No bloquean RC1:

- Mi Olivo visual y economía comercial completa;
- catálogo físico de recompensas;
- almazaras/partners;
- reservas/canje QR;
- navegación por voz;
- recálculo turn-by-turn;
- LiveTrack familiar;
- detección automática de caída;
- SOS automático;
- grupos/seguidores;
- chat avanzado y mensajería privada;
- red social completa;
- temporadas/eventos sofisticados;
- AR;
- reconocimiento IA de flora/fauna;
- smartwatch/Wear OS;
- iOS como requisito de esta candidata;
- publicación masiva en stores;
- web promocional como gate del motor senderista.

## 24. Huecos de implementación ya identificados

Antes de declarar RC1 terminada deben existir o consolidarse:

- Weather adapter y snapshots.
- Experiencia `Necesito ayuda`.
- Observabilidad/diagnóstico.
- Cámara integrada al flujo real.
- Notificaciones esenciales.
- Entornos staging/prod reproducibles.
- Persistencia servidor de validación + progresión + ledger/outbox.
- Admin consolidado.
- Catálogo canónico conectado a Mobile.
- Cuadros real y verificado.
- `integration/rc1` y merge train controlado.

Estos puntos son trabajo pendiente conocido, no decisiones abiertas de producto.

## 25. Criterios de inmutabilidad de diseño

Las decisiones de esta especificación constituyen el baseline de RC1. No se modifican por conveniencia de una rama concreta ni para acelerar un merge.

Una modificación de alcance, autoridad de datos, privacidad, piloto canónico, flujo offline, validación, rewards, navegación principal o gates requiere una decisión explícita posterior y una actualización versionada de esta especificación.

## 26. Definition of Done

RC1 está terminada sólo cuando el recorrido canónico completo funciona con una candidata exacta y trazable:

`instalar APK -> onboarding -> cuenta -> buscar Cuadros -> ficha -> descargar -> preparar -> iniciar -> caminar -> bloquear pantalla -> perder cobertura -> checkpoint -> discovery -> foto -> off-route -> regresar -> terminar offline -> recuperar Internet -> sincronizar -> validar -> progresión -> historial/perfil`

No se permite intervención manual en Supabase para hacer pasar esa prueba.

Superar RC1 significa closed beta seriamente utilizable; no implica todavía lanzamiento público masivo.
