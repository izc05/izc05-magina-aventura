# Route Master V2 Design

## Objetivo

Convertir el módulo de rutas del Super Admin de Mágina Aventura en una **Ficha Maestra de Ruta** capaz de gestionar, desde una sola ruta seleccionada, toda la información editorial, técnica, geográfica, de seguridad, multimedia, gamificación, fuentes y validación necesaria para publicar una aventura fiable.

La V2 debe sustituir el trabajo basado en UUID visibles por una experiencia orientada a nombres, estados y pestañas. El UUID sigue existiendo internamente, pero no es la unidad de interacción del administrador.

## Principios

1. `main` no se modifica durante el desarrollo; todo se implementa sobre `feat/admin-v1` hasta aprobación explícita.
2. Toda escritura sensible mantiene Supabase Auth + RLS + RPC + auditoría.
3. La información verificable se distingue de la pendiente. No se inventan tracks, altitudes, cierres ni fuentes.
4. La geometría y el contenido siguen versionados de forma independiente.
5. Una ruta puede existir como ficha editorial aunque todavía no tenga track oficial, pero no debe poder iniciar aventura ni publicarse como completa mientras los requisitos de validación V2 estén pendientes.
6. Las rutas heredadas V1 no se rompen: el control V2 se activa cuando existe su fila de validación.
7. Las fuentes y la procedencia del track son datos de primera clase, no texto libre perdido en notas.

## Navegación de la Ficha Maestra

En `Rutas`, cada fila tendrá `Abrir ficha`. La ficha se renderiza dentro del mismo módulo, sin introducir un router nuevo, con estas pestañas:

- `Ficha`
- `Track y acceso`
- `Mapa`
- `Checkpoints`
- `Descubrimientos`
- `Multimedia`
- `Seguridad`
- `Recompensas`
- `Fuentes y validación`
- `Historial`

La cabecera de la ficha mostrará nombre, código de ruta, municipio, estado editorial, estado del track, estado de campo y preparación para publicación.

## Modelo V2

### `routes`

Añadir:

- `route_code text unique null` — código estable, por ejemplo `MA-001`.

### `route_versions`

Añadir campos versionados:

- `route_kind text not null default 'circular'` con valores `circular`, `linear`, `out_and_back`.
- `elevation_loss_m integer not null default 0`.
- `elevation_min_m integer null`.
- `elevation_max_m integer null`.
- `access_notes text not null default ''`.
- `parking_notes text not null default ''`.
- `water_notes text not null default ''`.
- `shade_notes text not null default ''`.
- `coverage_notes text not null default ''`.
- `recommended_seasons text[] not null default '{}'`.
- `editorial_sections jsonb not null default '{}'` con claves soportadas `heritage`, `flora`, `fauna`, `olive`, `tradition`, `landscape`.

Los campos actuales siguen siendo canónicos para descripción, seguridad, distancia, desnivel positivo, duración, dificultad, XP, aceitunas y disponibilidad offline.

### `route_access_points`

Puntos geográficos no gamificados:

- `id uuid primary key`
- `route_id uuid references routes on delete cascade`
- `kind text` en `start`, `parking`, `access`, `water`, `viewpoint`
- `name text`
- `position geometry(Point,4326)`
- `notes text`
- `active boolean`

### `route_sources`

Fuentes editoriales:

- `id uuid primary key`
- `route_id uuid references routes on delete cascade`
- `label text`
- `url text`
- `source_type text` en `official`, `map`, `track`, `field`, `other`
- `official boolean`
- `checked_at timestamptz`
- `notes text`
- `created_by uuid references auth.users`

### `route_track_sources`

Procedencia de cada versión geométrica:

- `route_id uuid`
- `geometry_version integer`
- FK compuesta a `route_geometries(route_id,version)` con `on delete cascade`
- `source_id uuid null references route_sources on delete set null`
- `source_url text`
- `format text` en `gpx`, `kml`, `geojson`, `manual`
- `source_kind text` en `official`, `field`, `community`, `manual`
- `original_filename text`
- `source_hash text`
- `imported_at timestamptz`
- `validated_at timestamptz null`
- `validated_by uuid null references auth.users`
- `notes text`

### `route_validation_status`

Una fila por ruta V2:

- `route_id uuid primary key references routes on delete cascade`
- `editorial_status text` en `pending`, `reviewing`, `verified`
- `track_status text` en `missing`, `imported`, `verified`
- `field_status text` en `not_checked`, `planned`, `verified`
- `media_status text` en `missing`, `partial`, `ready`
- `safety_status text` en `pending`, `reviewed`
- `verified_by uuid null references auth.users`
- `verified_at timestamptz null`
- `notes text`
- `updated_at timestamptz`

## Lectura agregada

Crear `public.admin_route_master_snapshot(target_route_id uuid) returns jsonb`.

Debe devolver:

```json
{
  "route": {},
  "content": {},
  "geometry": {},
  "validation": {},
  "access_points": [],
  "sources": [],
  "track_source": {},
  "checkpoints": [],
  "discoveries": [],
  "media": [],
  "safety": [],
  "readiness": {}
}
```

Solo usuarios con `routes.manage` pueden llamar al RPC.

## Preparación para publicación

Crear `private.route_v2_readiness(target_route_id uuid) returns jsonb` con las claves:

- `has_content`
- `has_geometry`
- `has_official_source`
- `track_verified`
- `editorial_verified`
- `safety_reviewed`
- `blocking_incidents`
- `ready`
- `reasons[]`

Compatibilidad V1: si una ruta no tiene fila en `route_validation_status`, se mantiene el comportamiento de publicación actual. Si existe fila V2, `admin_set_route_status(...,'published')` exige `ready=true`.

## Escritura

Mantener `admin_update_route_content` como mecanismo de nueva versión, ampliándolo con los nuevos campos V2.

Crear RPC específicos:

- `admin_upsert_route_access_point(...)`
- `admin_save_route_source(...)`
- `admin_register_route_track_source(...)`
- `admin_update_route_validation(...)`

Todos validan capacidad, actor `auth.uid()`, escriben auditoría y no aceptan un actor arbitrario desde el cliente.

## Importación de track

El paquete `packages/route-import` debe aceptar GPX y KML. El Admin:

1. parsea el archivo;
2. muestra previsualización y estadísticas básicas;
3. guarda una nueva geometría mediante el RPC versionado existente;
4. calcula SHA-256 del fichero en navegador;
5. registra procedencia en `route_track_sources`;
6. deja `track_status='imported'` hasta validación explícita.

Nunca se marca un track como oficial únicamente por nombre de fichero.

## Datos del chat / catálogo de rutas

La investigación previa de rutas se migra **después** de terminar el modelo V2.

Orden:

1. `Sendero Las Viñas` como ruta plantilla completa.
2. Verificar que todos sus campos caben en la V2 sin texto huérfano.
3. Preparar una matriz de importación para el resto del catálogo investigado.
4. Cada ruta entra inicialmente como `review` salvo que tenga track, fuente y validación suficientes.
5. Ninguna ruta pasa a `published` automáticamente durante la importación.

## UX

- No mostrar campos `Ruta UUID`, `Municipio UUID`, `Partner UUID` o `Usuario UUID` como interacción normal.
- Usar selectores por nombre con búsqueda cuando sea necesario.
- Mantener UUID únicamente en detalles técnicos secundarios/copiar ID.
- Estados con etiquetas en español: `Borrador`, `En revisión`, `Publicada`, `Archivada`; `Track pendiente/importado/verificado`; `Campo no revisado/planificado/verificado`.
- Acciones destructivas siguen el patrón de doble confirmación ya establecido para rutas.

## Pruebas mínimas

- pgTAP de tablas, FK, RLS, grants y RPC.
- pgTAP de readiness V1/V2 y bloqueo de publicación incompleta.
- Unit tests del parser KML.
- Unit tests de normalización de ficha y lookups.
- Admin module syntax.
- CI completa existente: typecheck, unit, Android prebuild, package boundaries, `supabase db reset`, pgTAP.
- Smoke real staging con Las Viñas.
- Revisión visual desktop y móvil del Admin.

## Fuera de V2

- No se rediseña la app móvil completa.
- No se fusiona PR #8 a `main` sin autorización explícita.
- No se publica masivamente el catálogo sin verificación editorial y geográfica.
