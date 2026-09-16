# Mágina Aventura Admin Catalog Ingest V1 Design

## Objetivo

Conectar el catálogo canónico real de Sierra Mágina con el Super Admin existente sin duplicar una segunda plataforma ni forzar datos incompletos dentro del modelo publicable.

El primer hito importa los 17 senderos oficiales investigados y verificados en `feat/adventure-catalog-v1` / PR #28 como fichas administrativas reales, manteniendo claramente separado:

- lo que sabemos por fuente oficial;
- lo que sigue pendiente;
- lo que ha sido revisado por un administrador;
- lo que está listo para convertirse en contenido operativo/publicable;
- lo que está bloqueado por cierres o restricciones.

La base de trabajo es `feat/admin-v1`. La rama de integración es `feat/admin-catalog-ingest-v1`. No se modifica `main`, RC, móvil ni el PR #28 durante este trabajo.

## Estado de partida

### Catálogo canónico

El catálogo de Sierra Mágina ya dispone de:

- 17/17 identidades oficiales de senderos;
- 17/17 fichas técnicas oficiales localizadas;
- distancia, duración, tipo de recorrido y dificultad oficial cuando la fuente lo publica;
- fuentes individualizadas y fecha de comprobación;
- cierres temporales oficiales de Adelfal de Cuadros y Las Viñas modelados como restricciones independientes;
- evidencia familiar oficial para El Peralejo;
- contratos de procedencia, completitud, estado operativo y read model;
- importadores GPX/GeoJSON y validadores geográficos;
- CI completo en verde en el cierre del catálogo.

El catálogo todavía mantiene todos los senderos como `draft` porque la geometría oficial no se ha descargado y validado de forma reproducible para todos ellos.

### Admin existente

`feat/admin-v1` ya proporciona:

- `apps/admin`;
- Supabase Auth + roles/capabilities;
- Route Master V2;
- rutas y versiones de contenido;
- geometrías versionadas;
- fuentes de ruta;
- procedencia de tracks;
- validación editorial/track/campo/media/seguridad;
- puntos de acceso;
- checkpoints y descubrimientos;
- multimedia;
- incidencias de seguridad;
- auditoría;
- gamificación y recompensas;
- readiness y bloqueo de publicación V2.

Por tanto, Admin Catalog Ingest V1 no crea un Admin alternativo. Extiende Route Master V2 para recibir datos canónicos incompletos de forma segura.

## Problema que resuelve

El modelo operativo existente fue diseñado para rutas ya suficientemente completas. Algunos campos de `route_versions` son `NOT NULL` y utilizan valores por defecto como `0`. Eso es correcto para contenido operativo final, pero incorrecto para investigación canónica incompleta.

Ejemplo: si todavía desconocemos el desnivel positivo oficial, guardar `elevation_gain_m = 0` convertiría “desconocido” en una afirmación falsa.

También existe actualmente un único `municipality_id` en `routes`, mientras que una ruta real puede pertenecer a varios municipios. Veredón-Mojón Blanco, por ejemplo, se asocia oficialmente con Mancha Real, Pegalajar y Torres.

La ingesta debe preservar esas diferencias sin romper compatibilidad con la aplicación existente.

## Opciones consideradas

### A. Insertar directamente en `route_versions`

Se crearían las 17 rutas y se rellenarían valores obligatorios con `0`, cadenas vacías o defaults.

**Rechazada.** Es simple, pero degrada la calidad de datos y hace indistinguible “cero” de “desconocido”.

### B. Crear una base de datos independiente para catálogo

El catálogo tendría sus propias tablas y Admin sincronizaría entre dos bases/modelos.

**Rechazada.** Duplica identidad, seguridad, auditoría y operaciones; aumenta mucho el riesgo de divergencia.

### C. Capa de ingesta canónica enlazada a las rutas existentes

Cada sendero crea una identidad real en `routes`, pero los datos de investigación viven inicialmente en tablas de catálogo con campos anulables y procedencia. Admin puede revisar y promocionar posteriormente esa información al contenido versionado operativo.

**Elegida.** Mantiene una sola identidad de ruta y una sola plataforma Admin, permite datos incompletos y preserva el gate de publicación existente.

## Principios

1. No inventar valores para completar columnas obligatorias.
2. `null` significa desconocido/no verificado; `0` significa cero real.
3. Importar no equivale a publicar.
4. Toda ruta importada comienza en `draft`.
5. El catálogo investigado conserva su identificador estable (`ma-junta-001`, etc.).
6. La fuente oficial es un dato de primera clase.
7. Los cierres/restricciones son independientes de la descripción de ruta.
8. Las rutas pueden pertenecer a múltiples municipios.
9. La geometría no se sustituye por tracks comunitarios para desbloquear publicación.
10. Las importaciones son idempotentes y repetibles.
11. Route Master V2 sigue siendo la interfaz administrativa central.
12. El modelo público/operativo existente no se rompe.

## Arquitectura

```text
Catálogo investigado / snapshot
        |
        v
Catalog Import Manifest
        |
        v
Supabase Admin Catalog Layer
  routes -----------------------------+
  route_catalog_profiles              |
  route_municipalities                 |
  route_sources                        |
  route_catalog_restrictions           |
  route_catalog_pois                   |
  route_catalog_track_leads            |
  catalog_import_runs                  |
        |                              |
        v                              |
Route Master V2 <----------------------+ 
        |
        | revisión / promoción explícita
        v
route_versions / route_geometries / route_access_points /
route_track_sources / route_safety_incidents / media / etc.
        |
        v
Readiness V2 -> publicación
```

## Identidad de ruta

### Extensión de `routes`

Añadir:

```sql
canonical_catalog_id text unique null
catalog_origin text null
```

Valores iniciales:

- `canonical_catalog_id`: `ma-junta-001` ... `ma-junta-017`.
- `catalog_origin`: `junta_sierra_magina`.

`routes.id` continúa siendo UUID interno. El nuevo identificador canónico permite sincronizar sin depender de UUID generados en cada entorno.

Los códigos visibles `route_code` serán estables y humanos:

```text
MA-001 ... MA-017
```

La importación usa `canonical_catalog_id` como clave idempotente, no el título.

## Perfil canónico importado

Crear `public.route_catalog_profiles` con una fila por ruta:

```text
route_id uuid PK/FK routes
canonical_catalog_id text unique
source_snapshot_version text
source_snapshot_commit text
verification_state text
route_kind text null
distance_km numeric null
duration_minutes_min integer null
duration_minutes_max integer null
official_difficulty text null
elevation_gain_m integer null
elevation_loss_m integer null
elevation_min_m integer null
elevation_max_m integer null
family_profile jsonb
accessibility_facts jsonb
stable_safety_facts jsonb
editorial_facts jsonb
source_checked_at timestamptz
imported_at timestamptz
updated_at timestamptz
```

Los campos técnicos que todavía no estén verificados permanecen `null`.

`family_profile`, `accessibility_facts`, `stable_safety_facts` y `editorial_facts` almacenan hechos estructurados con referencias de fuente; no son texto libre destinado directamente a publicación.

### Restricciones de calidad

- distancia >= 0 cuando no sea null;
- duración > 0 cuando no sea null;
- desniveles >= 0 cuando no sean null;
- elevación máxima >= mínima cuando ambas existan;
- `route_kind` en `circular`, `linear`, `out_and_back` o null;
- dificultad en `easy`, `moderate`, `hard`, `expert` o null;
- JSONB de hechos siempre arrays/objetos con esquema esperado.

## Municipios muchos-a-muchos

Crear `public.route_municipalities`:

```text
route_id uuid FK routes
municipality_id uuid FK municipalities
is_primary boolean
source_kind text
created_at timestamptz
PK(route_id, municipality_id)
```

Reglas:

- una ruta puede tener uno o más municipios;
- como máximo una relación tiene `is_primary=true`;
- `routes.municipality_id` se conserva por compatibilidad con código existente;
- durante la ingesta se rellena con el municipio primario técnico/compatibilidad;
- Admin y nuevas lecturas muestran siempre `route_municipalities`, no interpretan `routes.municipality_id` como lista completa.

Para Veredón-Mojón Blanco se almacenan Mancha Real, Pegalajar y Torres. Pegalajar puede mantenerse como municipio primario de compatibilidad sin afirmar que sea el único municipio oficial.

## Fuentes

Se reutiliza `public.route_sources`.

Añadir:

```text
external_source_id text null
verification_state text null
```

Crear restricción única:

```text
unique(route_id, external_source_id)
```

Esto permite importar repetidamente una fuente como `junta-las-vinas` sin duplicarla.

Cada fuente conserva:

- publisher/label;
- URL;
- tipo;
- `official=true` cuando corresponda;
- `checked_at`;
- identificador externo;
- notas de procedencia;
- estado de verificación.

La lista de fuentes del catálogo se traduce directamente a `route_sources`.

## Restricciones y cierres importados

No se insertan automáticamente los cierres investigados como incidencias manuales de operador, porque `route_safety_incidents` tiene semántica operativa y autor administrativo.

Crear `public.route_catalog_restrictions`:

```text
id uuid PK
route_id uuid FK routes
external_restriction_id text
restriction_type text
severity text
status text
starts_at timestamptz null
ends_at timestamptz null
published_at timestamptz null
checked_at timestamptz
reason text
source_external_ids text[]
verification_state text
imported_at timestamptz
unique(route_id, external_restriction_id)
```

El readiness V2 debe considerar una restricción canónica activa `blocking` igual que una incidencia operativa bloqueante.

Admin mostrará estas restricciones como **“Importada de fuente oficial”** y permitirá posteriormente crear/relacionar una incidencia operativa si se necesita seguimiento manual.

Primeras restricciones:

- Adelfal de Cuadros — cierre temporal activo.
- Las Viñas — cierre temporal activo.

## POI y puntos de interés pendientes

Crear `public.route_catalog_pois` para almacenar investigación antes de exigir geometría:

```text
id uuid PK
route_id uuid FK routes
external_poi_id text
name text
category text
longitude numeric null
latitude numeric null
water_metadata jsonb null
verification_state text
source_external_ids text[]
notes text
imported_at timestamptz
unique(route_id, external_poi_id)
```

Razón: `route_access_points.position` es obligatorio. El catálogo puede conocer la existencia de un POI antes de tener coordenadas suficientemente verificadas.

Cuando un POI tenga coordenadas y revisión suficiente, Admin puede promocionarlo a `route_access_points`, `checkpoints` o `discoveries` según su función.

No se insertan coordenadas aproximadas para satisfacer PostGIS.

## Pistas de geometría / track

`route_track_sources` exige una geometría existente. Para poder guardar que una fuente oficial ofrece KML/GML/GPX antes de haber descargado/validado el archivo, crear `public.route_catalog_track_leads`:

```text
id uuid PK
route_id uuid FK routes
external_source_id text null
source_url text
format text
source_kind text
status text
notes text
checked_at timestamptz
fetched_at timestamptz null
validated_at timestamptz null
unique(route_id, source_url)
```

Estados:

```text
discovered -> fetched -> validated
           -> unavailable
```

Cuando el track se descarga y valida:

1. el importador normaliza GPX/KML/GeoJSON;
2. se crea nueva `route_geometries`;
3. se crea `route_track_sources`;
4. el lead pasa a `validated`;
5. `route_validation_status.track_status` puede pasar a `imported` o `verified` según revisión.

La presencia de un enlace KML/GML no marca el track como verificado por sí sola.

## Registro de importaciones

Crear `public.catalog_import_runs`:

```text
id uuid PK
catalog_name text
snapshot_version text
source_commit text
manifest_sha256 text
started_at timestamptz
completed_at timestamptz null
status text
route_count integer
source_count integer
restriction_count integer
poi_count integer
notes text
```

Estados:

```text
running | completed | failed
```

Cada carga deja trazabilidad de qué snapshot fue importado.

## Manifest canónico

La integración utiliza un artefacto versionado:

```text
data/catalog/sierra-magina-official-v1.json
```

Contendrá:

```json
{
  "catalog": "sierra-magina-official",
  "snapshot_version": "2026-09-16-v1",
  "source_branch": "feat/adventure-catalog-v1",
  "source_commit": "d252a9d4da3dec4e0e96556e47b4083c12a23f78",
  "routes": [],
  "sources": [],
  "restrictions": [],
  "pois": [],
  "track_leads": []
}
```

El manifest es una fotografía de intercambio, no una segunda fuente editorial. El catálogo canónico sigue siendo la fuente de verdad de investigación.

Cuando el catálogo compartido termine integrado en la línea principal del repositorio, el manifest podrá generarse automáticamente desde su read model. V1 no introduce una dependencia de runtime entre las dos ramas largas actuales.

## Ingesta inicial 17/17

La primera carga crea o actualiza 17 `routes`:

1. Adelfal de Cuadros
2. Caño del Aguadero
3. Castillo de Albanchez
4. Castillo de Mata Bejid
5. El Peralejo
6. Fuenmayor
7. Gibralberca
8. Hoyalinos
9. La Cueva de la Graja
10. Las Viñas
11. Pinar de Cánava
12. Puerto de la Mata
13. Sierra de la Cruz
14. Subida al Hoyo de la Laguna
15. Subida a Pico Mágina y Miramundos
16. Umbría de los Corzos
17. Veredón-Mojón Blanco

Todos entran como:

```text
routes.status = draft
editorial_status = pending
track_status = missing
field_status = not_checked
media_status = missing
safety_status = pending
```

No se crea una `route_version` falsa para una ruta que carece de datos obligatorios operativos.

Las fichas oficiales sí quedan visibles desde el panel mediante `route_catalog_profiles`.

## Datos técnicos iniciales

El manifest incluye para los 17 senderos los datos oficiales ya verificados:

- tipo de recorrido;
- distancia;
- duración;
- dificultad oficial;
- municipio/s;
- fuentes y comprobación.

Los cinco factores internos de dificultad permanecen vacíos salvo que exista una fuente o una evaluación editorial explícita posterior.

El perfil familiar de El Peralejo conserva como evidencia oficial que la fuente lo describe como recorrido corto, de poco desnivel y adecuado para ir con niños. Esto se presenta como hecho de fuente, no como una puntuación inventada de Mágina Aventura.

## Promoción de catálogo a contenido operativo

La importación y la publicación son procesos diferentes.

Crear RPC/acción administrativa conceptual:

```text
admin_promote_catalog_profile(route_id, fields...)
```

Su función es ayudar al operador a crear una nueva `route_version` usando solo los campos que ya cumplen los requisitos operativos.

Reglas:

- no inventa campos faltantes;
- el Admin muestra qué dato procede del catálogo y cuál ha sido editado;
- promoción crea una nueva versión, nunca muta silenciosamente una versión publicada;
- las recompensas XP/aceitunas son decisión de producto y no se importan desde la ficha oficial;
- `offline_available` no se activa hasta que existan geometría/mapa adecuados;
- el readiness V2 sigue siendo la autoridad para publicar.

## Route Master: cambios de lectura

Extender `public.admin_route_master_snapshot(route_id)` para devolver:

```json
{
  "route": {},
  "content": {},
  "catalog_profile": {},
  "municipalities": [],
  "geometry": {},
  "validation": {},
  "access_points": [],
  "catalog_pois": [],
  "sources": [],
  "catalog_restrictions": [],
  "track_leads": [],
  "track_source": {},
  "checkpoints": [],
  "discoveries": [],
  "media": [],
  "safety": [],
  "readiness": {},
  "import_state": {}
}
```

## Route Master: UX

En la ficha maestra añadir una banda de **Datos de catálogo**:

- `17/17 ficha oficial` no es una etiqueta global visible en cada ruta; cada ruta muestra su propio estado.
- `Fuente oficial verificada`.
- `Track pendiente / descubierto / importado / verificado`.
- `Datos técnicos completos/parciales`.
- `Municipios` como chips múltiples.
- `Cierre oficial activo` cuando corresponda.
- `Perfil familiar con evidencia` cuando exista.
- `Última comprobación`.
- `Snapshot importado`.

Colores/estados deben seguir la semántica actual del Admin y no sustituir el texto.

Pestaña `Fuentes y validación` muestra:

1. fuentes importadas;
2. estado de cada fuente;
3. datos que dependen de ella;
4. pistas de track;
5. fecha de comprobación;
6. diferencias entre catálogo y versión operativa.

## Diferencias catálogo ↔ contenido operativo

Crear una comparación pura para mostrar:

```text
Sin cambio
Catálogo más reciente
Admin modificado
Dato pendiente
Conflicto / revisar
```

Ejemplos:

- catálogo: distancia 8.72 km; versión operativa: 8.72 km -> `Sin cambio`;
- catálogo: desnivel null; versión operativa: 426 m de track validado -> `Admin modificado`, no error;
- catálogo cambia una dificultad oficial -> `Catálogo más reciente` hasta revisión;
- dos fuentes oficiales actuales discrepan -> `Conflicto / revisar`, sin elección automática.

## Idempotencia

Reimportar el mismo manifest:

- no duplica rutas;
- no duplica municipios;
- no duplica fuentes;
- no duplica restricciones;
- no duplica POI;
- no pisa versiones operativas;
- actualiza el perfil canónico cuando cambia el snapshot;
- registra una nueva ejecución de importación.

La clave de sincronización es siempre el identificador externo/canónico, nunca el nombre visible.

## Seguridad

- RLS activado en todas las nuevas tablas expuestas.
- Lectura de la capa canónica limitada a usuarios con `routes.manage`/capacidades equivalentes, salvo futuras vistas públicas explícitas.
- Ingesta administrativa a través de RPC estrecho o migración/seed controlado; no se acepta service-role en navegador.
- Todas las promociones y ediciones del operador se auditan.
- Una reimportación automática nunca publica una ruta.
- Los cierres oficiales importados pueden bloquear readiness sin necesidad de que un operador los reescriba.

## Migraciones previstas

Números posteriores a las migraciones actuales de `feat/admin-v1`:

```text
202609160030_catalog_ingest_schema.sql
202609160031_catalog_ingest_security.sql
202609160032_catalog_ingest_rpc.sql
202609160033_catalog_route_master_snapshot.sql
202609160034_catalog_readiness.sql
202609160035_sierra_magina_official_seed.sql
```

Los números definitivos se ajustan si `feat/admin-v1` recibe migraciones nuevas antes de implementar.

## Carga baseline

La carga inicial será determinista e idempotente mediante SQL generado desde el manifest.

No depende de un usuario Auth existente para crear la investigación canónica. Las acciones de promoción posteriores sí requieren actor autenticado y capability `routes.manage`.

Los `route_sources` importados tendrán `created_by = null` cuando procedan de seed/migración; las creaciones manuales posteriores conservan el usuario creador.

## Readiness V2

El readiness actual se mantiene y se amplía:

- `has_catalog_profile`
- `catalog_sources_verified`
- `catalog_blocking_restrictions`

`ready=true` continúa requiriendo, como mínimo:

- contenido operativo;
- geometría;
- fuente oficial;
- track verificado;
- validación editorial;
- seguridad revisada;
- cero incidencias/restricciones bloqueantes activas.

Tener una ficha oficial 17/17 no equivale a estar listo para publicar.

## Compatibilidad

- No se elimina `routes.municipality_id`.
- No se cambia la API pública móvil en V1.
- No se cambia el significado de `route_versions`.
- No se altera una ruta publicada al reimportar catálogo.
- Rutas antiguas sin `canonical_catalog_id` siguen funcionando.
- Route Master puede abrir rutas importadas aunque no tengan `route_versions` ni geometría.

## Pruebas

### Base de datos

pgTAP debe comprobar:

- nuevas tablas, columnas y FK;
- unicidad de `canonical_catalog_id`;
- idempotencia del seed 17/17;
- múltiple municipio por ruta;
- una sola relación primaria;
- campos técnicos anulables en catálogo;
- RLS/grants;
- fuentes externas idempotentes;
- restricciones bloqueantes en readiness;
- reimportación que no pisa `route_versions`;
- 17 rutas importadas exactamente;
- 17 perfiles canónicos exactamente;
- fuentes oficiales asociadas;
- Veredón-Mojón Blanco con tres municipios;
- Adelfal de Cuadros y Las Viñas con cierre oficial activo;
- El Peralejo con hecho familiar con procedencia.

### Admin

Node tests deben cubrir:

- normalización del manifest;
- comparación catálogo ↔ contenido;
- chips multi-municipio;
- estados de importación;
- ausencia de falsos ceros;
- Route Master sin `route_version`;
- promoción de datos completos;
- rechazo de promoción incompleta.

### CI

Se conserva la matriz completa existente:

```text
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
Expo Android prebuild
package boundaries
Supabase local start/reset
pgTAP database tests
```

## Fases de implementación

### Fase 1 — Schema de ingesta

Tablas, columnas, RLS, constraints e idempotencia.

### Fase 2 — Manifest 17/17

Snapshot versionado derivado del catálogo del PR #28.

### Fase 3 — Seed/import

Crear las 17 identidades, perfiles, municipios, fuentes y restricciones.

### Fase 4 — Route Master

Mostrar catálogo, diferencias, restricciones, municipios y track leads.

### Fase 5 — Promoción

Flujo explícito para convertir datos revisados en contenido operativo versionado.

### Fase 6 — Geometría y POI

A medida que se descarguen/validen tracks y coordenadas, completar geometrías, accesos, POI, checkpoints y descubrimientos sin cambiar el modelo de ingesta.

## Criterios de éxito V1

1. Admin contiene exactamente las 17 rutas oficiales investigadas.
2. Cada ruta conserva `canonical_catalog_id` estable.
3. Las 17 muestran sus datos técnicos oficiales disponibles.
4. Ningún campo desconocido se convierte en `0` o texto inventado.
5. Todas las fuentes tienen trazabilidad.
6. Veredón-Mojón Blanco muestra sus tres municipios.
7. Adelfal de Cuadros y Las Viñas aparecen bloqueadas por restricción oficial activa.
8. El Peralejo conserva su evidencia familiar oficial.
9. Ninguna ruta se publica automáticamente.
10. Route Master abre y administra rutas sin track o sin versión operativa completa.
11. Reimportar el mismo snapshot no crea duplicados ni pisa trabajo editorial.
12. El readiness impide publicar mientras falten geometría, track validado, revisión editorial/seguridad o exista cierre bloqueante.
13. Toda la CI queda verde.

## Fuera de alcance V1

- descargar automáticamente todos los tracks desde REDIAM;
- completar coordenadas de todos los POI;
- publicar las 17 rutas;
- cambiar la app móvil para consumir inmediatamente la nueva capa;
- sincronización en tiempo real con portales externos;
- crawler automático de cambios de la Junta;
- IA que modifique datos canónicos sin revisión;
- sustituir Route Master V2 por otro Admin.

Esos bloques se apoyarán en esta base una vez la ingesta 17/17 esté estable y verificada.
