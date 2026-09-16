# Route Master V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el módulo de rutas del Super Admin en una Ficha Maestra V2 que permita gestionar de forma unificada todos los datos editoriales, geográficos, de seguridad, multimedia, gamificación, fuentes y validación de cada sendero.

**Architecture:** La V2 mantiene la arquitectura actual estática del Admin y Supabase como control plane. El modelo se amplía con metadatos versionados en `route_versions` y nuevas tablas específicas para acceso, fuentes, procedencia del track y estado de validación. La interfaz se implementa como un módulo aislado `route-master-tools.mjs` sobre `#routes`, siguiendo el patrón de módulos ya usado por `route-content-tools.mjs`, `visual-tools.mjs` y `safety-tools.mjs`, sin introducir un router nuevo.

**Tech Stack:** HTML/CSS/ES modules sin framework para Admin, Supabase/PostgreSQL/PostGIS/RLS/RPC/pgTAP, TypeScript + `fast-xml-parser` en `packages/route-import`, Node test runner y Vitest, Netlify staging.

**Spec:** `docs/superpowers/specs/2026-09-16-route-master-v2-design.md`

## Global Constraints

- Trabajar únicamente sobre `feat/admin-v1`; no modificar ni fusionar `main` sin autorización explícita.
- TDD obligatorio: prueba roja antes de cada implementación funcional.
- Mantener Supabase Auth + RLS + RPC + auditoría para escrituras sensibles.
- No mostrar UUID como interacción normal cuando exista un nombre legible.
- No inventar tracks, altitudes, cierres, fuentes ni verificaciones.
- Las rutas V1 sin fila en `route_validation_status` conservan el comportamiento existente.
- Una ruta V2 no puede publicarse si `route_v2_readiness(...).ready=false`.
- Cada tarea termina con tests verdes y commit independiente.

---

### Task 1: Contrato de base de datos Route Master V2

**Files:**
- Create: `supabase/tests/database/admin_route_master_v2_test.sql`
- Create: `supabase/migrations/202609160023_route_master_v2.sql`

**Interfaces:**
- Produces: tablas `route_access_points`, `route_sources`, `route_track_sources`, `route_validation_status`; columnas V2 en `routes` y `route_versions`.
- Consumes: `routes`, `route_versions`, `route_geometries`, `auth.users`, PostGIS.

- [ ] **Step 1: Escribir la prueba roja del esquema**

Crear `admin_route_master_v2_test.sql` con pgTAP que compruebe al menos:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

select has_column('public','routes','route_code','routes.route_code exists');
select has_column('public','route_versions','route_kind','route_versions.route_kind exists');
select has_column('public','route_versions','elevation_loss_m','route_versions.elevation_loss_m exists');
select has_column('public','route_versions','editorial_sections','route_versions.editorial_sections exists');
select has_table('public','route_access_points','route_access_points exists');
select has_table('public','route_sources','route_sources exists');
select has_table('public','route_track_sources','route_track_sources exists');
select has_table('public','route_validation_status','route_validation_status exists');
select col_is_pk('public','route_validation_status','route_id','route_validation_status keyed by route');
select has_index('public','route_access_points','route_access_points_position_gix','access points have spatial index');
select has_index('public','route_sources','route_sources_route_idx','route sources indexed by route');
select has_index('public','route_track_sources','route_track_sources_route_idx','track sources indexed by route');

select * from finish();
rollback;
```

- [ ] **Step 2: Ejecutar la prueba y confirmar rojo**

Run through existing CI / local Supabase contract test command.
Expected: FAIL because V2 columns/tables do not exist.

- [ ] **Step 3: Crear migración `202609160023_route_master_v2.sql`**

Implementar exactamente el modelo de la spec, incluyendo:

```sql
alter table public.routes
  add column route_code text unique;

alter table public.route_versions
  add column route_kind text not null default 'circular'
    check (route_kind in ('circular','linear','out_and_back')),
  add column elevation_loss_m integer not null default 0 check (elevation_loss_m >= 0),
  add column elevation_min_m integer,
  add column elevation_max_m integer,
  add column access_notes text not null default '',
  add column parking_notes text not null default '',
  add column water_notes text not null default '',
  add column shade_notes text not null default '',
  add column coverage_notes text not null default '',
  add column recommended_seasons text[] not null default '{}',
  add column editorial_sections jsonb not null default '{}'::jsonb,
  add constraint route_versions_elevation_range_chk
    check (elevation_min_m is null or elevation_max_m is null or elevation_max_m >= elevation_min_m);
```

Crear las cuatro tablas, sus FK, `on delete`, índices B-tree/GiST y checks de enumeraciones según la spec.

- [ ] **Step 4: Activar RLS y grants mínimos**

`anon` no recibe acceso administrativo a estas tablas. `authenticated` recibe `select` y solo las escrituras necesarias mediante RPC/policies de capacidad. Aplicar policies con `private.admin_has_capability('routes.manage',auth.uid())`.

- [ ] **Step 5: Ejecutar pgTAP**

Expected: `admin_route_master_v2_test.sql` PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/202609160023_route_master_v2.sql supabase/tests/database/admin_route_master_v2_test.sql
git commit -m "feat: add route master v2 schema"
```

---

### Task 2: Snapshot agregado y readiness V2

**Files:**
- Modify: `supabase/migrations/202609160023_route_master_v2.sql` only if still uncommitted; otherwise Create: `supabase/migrations/202609160024_route_master_snapshot.sql`
- Test: `supabase/tests/database/admin_route_master_snapshot_test.sql`

**Interfaces:**
- Produces: `private.route_v2_readiness(uuid)`, `public.admin_route_master_snapshot(uuid)`.
- Consumes: schema V2 from Task 1.

- [ ] **Step 1: Escribir prueba roja del readiness**

Crear ruta V2 de prueba con contenido pero sin geometría y comprobar:

```sql
select is(
  (private.route_v2_readiness('...route...'::uuid)->>'ready')::boolean,
  false,
  'route without verified geometry is not ready'
);
```

Añadir pruebas que verifiquen `reasons` para track no verificado, ausencia de fuente oficial e incidencia bloqueante.

- [ ] **Step 2: Ejecutar y confirmar rojo**

Expected: función inexistente.

- [ ] **Step 3: Implementar `private.route_v2_readiness`**

Debe devolver JSON con:

```json
{
  "has_content": true,
  "has_geometry": false,
  "has_official_source": true,
  "track_verified": false,
  "editorial_verified": true,
  "safety_reviewed": true,
  "blocking_incidents": 0,
  "ready": false,
  "reasons": ["Falta track verificado"]
}
```

- [ ] **Step 4: Implementar `public.admin_route_master_snapshot`**

El RPC debe validar `routes.manage` y construir un JSON único con route/content/geometry/validation/access/sources/track/checkpoints/discoveries/media/safety/readiness.

- [ ] **Step 5: Test de actor binding**

Simular JWT y comprobar que un `route_manager` autorizado puede leer el snapshot y un usuario sin rol no.

- [ ] **Step 6: Ejecutar tests y commit**

```bash
git add supabase/migrations/202609160024_route_master_snapshot.sql supabase/tests/database/admin_route_master_snapshot_test.sql
git commit -m "feat: add route master snapshot and readiness"
```

---

### Task 3: Escrituras V2 y auditoría

**Files:**
- Create: `supabase/migrations/202609160025_route_master_operations.sql`
- Test: `supabase/tests/database/admin_route_master_operations_test.sql`

**Interfaces:**
- Produces: `admin_upsert_route_access_point`, `admin_save_route_source`, `admin_register_route_track_source`, `admin_update_route_validation`.
- Consumes: `private.write_admin_audit`, actor-binding existing.

- [ ] **Step 1: Escribir tests rojos**

Comprobar que:

```sql
select has_function('public','admin_save_route_source',array['uuid','text','text','text','boolean','timestamptz','text'],'save source RPC exists');
select has_function('public','admin_update_route_validation',array['uuid','text','text','text','text','text','text'],'validation RPC exists');
```

Y probar que actor sin `routes.manage` obtiene `not authorized`.

- [ ] **Step 2: Implementar funciones privadas con `actor=auth.uid()` binding**

Nunca aceptar `actor` desde el RPC público.

- [ ] **Step 3: Escribir auditoría**

Acciones:

- `route.access.upsert`
- `route.source.save`
- `route.track.register`
- `route.validation.update`

- [ ] **Step 4: Ejecutar tests y commit**

```bash
git add supabase/migrations/202609160025_route_master_operations.sql supabase/tests/database/admin_route_master_operations_test.sql
git commit -m "feat: add route master operations"
```

---

### Task 4: Bloqueo de publicación incompleta V2

**Files:**
- Create: `supabase/migrations/202609160026_route_v2_publish_gate.sql`
- Test: `supabase/tests/database/admin_route_v2_publish_gate_test.sql`

**Interfaces:**
- Modifies behavior of: `private.admin_set_route_status`.
- Consumes: `private.route_v2_readiness`.

- [ ] **Step 1: Crear caso rojo**

Ruta V1 sin validation row debe mantener transición existente. Ruta V2 con `track_status='missing'` debe fallar al publicar.

```sql
select throws_ok(
  $$ select private.admin_set_route_status('...v2...'::uuid,'published','...actor...'::uuid) $$,
  'route v2 is not ready for publication',
  'V2 incomplete route cannot publish'
);
```

- [ ] **Step 2: Implementar compatibilidad V1/V2**

Dentro del branch `new_status='published'`:

```sql
if exists(select 1 from public.route_validation_status where route_id=target_route_id) then
  if coalesce((private.route_v2_readiness(target_route_id)->>'ready')::boolean,false) = false then
    raise exception 'route v2 is not ready for publication';
  end if;
end if;
```

- [ ] **Step 3: Ejecutar tests y commit**

```bash
git add supabase/migrations/202609160026_route_v2_publish_gate.sql supabase/tests/database/admin_route_v2_publish_gate_test.sql
git commit -m "feat: enforce route v2 publication readiness"
```

---

### Task 5: Parser KML y contrato común de importación

**Files:**
- Create: `packages/route-import/src/kml.ts`
- Create: `packages/route-import/src/kml.test.ts`
- Modify: `packages/route-import/src/index.ts`

**Interfaces:**
- Produces: `parseKml(xml, routeId, geometryVersion): ImportedRouteGeometry`.
- Reuses: `ImportedRouteGeometry` shape from current GPX importer.

- [ ] **Step 1: Escribir prueba KML roja**

Usar un KML mínimo:

```ts
const kml = `<?xml version="1.0"?><kml><Document><Placemark><LineString><coordinates>-3.41,37.82,700 -3.40,37.83,720</coordinates></LineString></Placemark></Document></kml>`;
const result = parseKml(kml, 'route-1', 2);
expect(result.line.geometry.coordinates).toEqual([[-3.41,37.82],[-3.40,37.83]]);
expect(result.elevationsM).toEqual([700,720]);
```

- [ ] **Step 2: Ejecutar Vitest y confirmar rojo**

- [ ] **Step 3: Implementar parser con `fast-xml-parser`**

Aceptar `LineString/coordinates`, separar por whitespace y luego por comas, validar mínimo dos posiciones y reutilizar `validateRouteLineFeature` + `calculateRouteBounds`.

- [ ] **Step 4: Exportar en `index.ts`**

```ts
export * from './gpx';
export * from './kml';
```

- [ ] **Step 5: Ejecutar tests y commit**

```bash
git add packages/route-import/src/kml.ts packages/route-import/src/kml.test.ts packages/route-import/src/index.ts
git commit -m "feat: support KML route imports"
```

---

### Task 6: Ficha Maestra UI y selección por nombre

**Files:**
- Create: `apps/admin/route-master-tools.mjs`
- Create: `apps/admin/src/core/route-master.mjs`
- Create: `apps/admin/tests/route-master.test.mjs`
- Modify: `apps/admin/index.html`
- Modify: `apps/admin/styles.css`

**Interfaces:**
- Consumes: `admin_route_master_snapshot`.
- Produces: selector de ruta + pestañas V2 + helpers `routeMasterTabs()`, `routeReadinessLabel()`.

- [ ] **Step 1: Test rojo de helpers**

```js
assert.deepEqual(routeMasterTabs().map(x => x.id), [
  'overview','track','map','checkpoints','discoveries','media','safety','rewards','sources','history'
]);
assert.equal(routeReadinessLabel({ready:false}), 'Pendiente');
```

- [ ] **Step 2: Implementar helpers puros**

`route-master.mjs` no toca DOM y transforma snapshot a view model.

- [ ] **Step 3: Implementar `route-master-tools.mjs`**

Al entrar en `#routes`:

1. cargar `routes?id,title,route_code,status,municipality_id` + municipios;
2. renderizar `<select>` por nombre/código;
3. al seleccionar, llamar `rpc('admin_route_master_snapshot',{target_route_id:id})`;
4. renderizar cabecera y tabs;
5. ocultar UUID salvo bloque técnico desplegable.

- [ ] **Step 4: Añadir script a `index.html`**

```html
<script type="module" src="./route-master-tools.mjs"></script>
```

- [ ] **Step 5: CSS responsive**

Añadir `.route-master`, `.route-master-tabs`, `.route-master-header`, `.route-status-chip`, `.readiness-grid` y variante móvil.

- [ ] **Step 6: Ejecutar Admin tests + module check y commit**

```bash
git add apps/admin/route-master-tools.mjs apps/admin/src/core/route-master.mjs apps/admin/tests/route-master.test.mjs apps/admin/index.html apps/admin/styles.css
git commit -m "feat: add route master v2 shell"
```

---

### Task 7: Pestaña Ficha y edición versionada V2

**Files:**
- Modify: `supabase/migrations/202609160025_route_master_operations.sql` or Create: `202609160027_route_content_v2.sql`
- Modify: `apps/admin/route-master-tools.mjs`
- Test: `supabase/tests/database/admin_route_content_v2_test.sql`
- Test: `apps/admin/tests/route-master.test.mjs`

**Interfaces:**
- Extends: `public.admin_update_route_content` with V2 fields while preserving existing behavior.

- [ ] **Step 1: Escribir test rojo de versión V2**

Actualizar una ruta y comprobar que se crea versión N+1 con `route_kind`, desnivel negativo, cotas, acceso, agua, sombra, cobertura, temporadas y `editorial_sections`.

- [ ] **Step 2: Implementar RPC V2**

Mantener la regla actual: si la ruta estaba publicada, una edición la devuelve a `review`.

- [ ] **Step 3: Crear formulario Ficha**

Campos legibles en español y secciones editoriales separadas. El submit llama un único RPC versionado.

- [ ] **Step 4: Mostrar comparación de versión**

Cabecera: `Versión actual N`; después de guardar: `Nueva versión N+1 creada`.

- [ ] **Step 5: Tests y commit**

```bash
git add supabase/migrations/202609160027_route_content_v2.sql supabase/tests/database/admin_route_content_v2_test.sql apps/admin/route-master-tools.mjs apps/admin/tests/route-master.test.mjs
git commit -m "feat: edit route master content v2"
```

---

### Task 8: Track, procedencia y puntos de acceso

**Files:**
- Create: `apps/admin/route-track-tools.mjs`
- Create: `apps/admin/src/core/route-file-import.mjs`
- Create: `apps/admin/tests/route-file-import.test.mjs`
- Modify: `apps/admin/index.html`
- Modify: `apps/admin/styles.css`

**Interfaces:**
- Consumes: existing geometry RPC, Task 3 track-source RPC, GPX/KML parsers.
- Produces: import preview and provenance capture.

- [ ] **Step 1: Test rojo de selección de parser**

```js
assert.equal(importFormat('ruta.gpx'),'gpx');
assert.equal(importFormat('ruta.kml'),'kml');
assert.throws(() => importFormat('ruta.pdf'));
```

- [ ] **Step 2: Implementar import helper**

Detectar formato por extensión/MIME, calcular SHA-256 con `crypto.subtle.digest`, devolver metadatos de fichero.

- [ ] **Step 3: UI Track**

Mostrar:

- estado `Falta / Importado / Verificado`;
- archivo GPX/KML;
- fuente `Oficial / Campo / Comunidad / Manual`;
- URL de origen;
- nombre original;
- hash;
- validado por/fecha;
- preview del trazado.

- [ ] **Step 4: Guardar geometría + procedencia de forma secuencial**

Primero guardar la geometría versionada; solo después registrar `route_track_sources`. Si falla el registro de procedencia, mostrar error explícito y no marcar `track_status` como verificado.

- [ ] **Step 5: CRUD de access points**

Formulario para `Inicio`, `Aparcamiento`, `Acceso`, `Agua`, `Mirador`, usando mapa/coordenadas y nombre visible.

- [ ] **Step 6: Tests y commit**

```bash
git add apps/admin/route-track-tools.mjs apps/admin/src/core/route-file-import.mjs apps/admin/tests/route-file-import.test.mjs apps/admin/index.html apps/admin/styles.css
git commit -m "feat: manage route tracks and access points"
```

---

### Task 9: Integrar Mapa, Checkpoints y Descubrimientos en contexto de ruta

**Files:**
- Modify: `apps/admin/visual-tools.mjs`
- Modify: `apps/admin/route-master-tools.mjs`
- Modify: `apps/admin/src/core/route-editor.mjs`
- Modify: `apps/admin/tests/route-editor.test.mjs`

**Interfaces:**
- Consumes: selected route id from Route Master.
- Produces: editor visual sin campo `Ruta UUID`.

- [ ] **Step 1: Test rojo de contexto seleccionado**

Añadir helper:

```js
assert.equal(routeContextLabel({route_code:'MA-001',title:'Sendero Las Viñas'}),'MA-001 · Sendero Las Viñas');
```

- [ ] **Step 2: Eliminar formulario manual `Ruta UUID` del flujo V2**

Cuando existe ruta seleccionada, `visual-tools` debe cargar directamente `admin_route_editor_snapshot(selectedRouteId)`.

- [ ] **Step 3: Mantener fallback V1**

Si no existe contexto V2, el editor antiguo puede seguir aceptando carga manual temporalmente para no romper operaciones.

- [ ] **Step 4: Insertar checkpoints/discoveries desde la ficha**

Cada creación hereda el route id seleccionado sin mostrarlo.

- [ ] **Step 5: Tests + commit**

```bash
git add apps/admin/visual-tools.mjs apps/admin/route-master-tools.mjs apps/admin/src/core/route-editor.mjs apps/admin/tests/route-editor.test.mjs
git commit -m "feat: scope map tools to selected route"
```

---

### Task 10: Multimedia, Seguridad, Fuentes y Recompensas dentro de la ficha

**Files:**
- Modify: `apps/admin/media-tools.mjs`
- Modify: `apps/admin/safety-tools.mjs`
- Modify: `apps/admin/reward-tools.mjs`
- Modify: `apps/admin/route-master-tools.mjs`
- Create: `apps/admin/route-source-tools.mjs`
- Modify: `apps/admin/index.html`

**Interfaces:**
- Consumes: selected route context.

- [ ] **Step 1: Multimedia**

Mostrar únicamente assets asociados a la ruta seleccionada y permitir asignar `hero`, `gallery`, `safety`, `discovery` sin escribir route id.

- [ ] **Step 2: Seguridad**

Crear/ver/resolver incidencias de la ruta seleccionada. Mostrar claramente si `blocks_adventure=true`.

- [ ] **Step 3: Recompensas**

Mostrar XP/aceitunas de finalización desde la versión actual, y resumen de descubrimientos/recompensas vinculadas.

- [ ] **Step 4: Fuentes**

Formulario con etiqueta, URL, tipo, oficial sí/no, fecha de comprobación y notas. Listar fuentes con enlace clickable y fecha.

- [ ] **Step 5: Validación**

Controles separados para Editorial, Track, Campo, Multimedia y Seguridad. Solo `routes.manage`; conservar auditoría.

- [ ] **Step 6: Tests de módulo y commit**

```bash
git add apps/admin/media-tools.mjs apps/admin/safety-tools.mjs apps/admin/reward-tools.mjs apps/admin/route-master-tools.mjs apps/admin/route-source-tools.mjs apps/admin/index.html
git commit -m "feat: integrate route operations into master ficha"
```

---

### Task 11: Sustituir UUID visibles en el Admin por lookups legibles

**Files:**
- Create: `apps/admin/src/core/lookups.mjs`
- Create: `apps/admin/tests/lookups.test.mjs`
- Modify: `apps/admin/app.mjs`
- Modify as needed: `apps/admin/chat-tools.mjs`, `apps/admin/safety-tools.mjs`, `apps/admin/reward-tools.mjs`, `apps/admin/notification-tools.mjs`

**Interfaces:**
- Produces: `routeOptions`, `municipalityOptions`, `partnerOptions`, `userOptions`.

- [ ] **Step 1: Test rojo de normalización**

```js
assert.deepEqual(routeOptions([{id:'1',route_code:'MA-001',title:'Las Viñas'}]),[
  {value:'1',label:'MA-001 · Las Viñas'}
]);
```

- [ ] **Step 2: Implementar lookups**

Ordenar por nombre/código, filtrar inactivos cuando proceda y conservar `value=id` internamente.

- [ ] **Step 3: Reemplazar inputs UUID**

Prioridad:

1. Ruta
2. Municipio
3. Almazara/partner
4. Usuario admin
5. Audiencia de notificación

- [ ] **Step 4: Mantener “Copiar ID” solo en detalle técnico**

No borrar UUID de la base; solo dejar de pedirlo al operador.

- [ ] **Step 5: Tests y commit**

```bash
git add apps/admin/src/core/lookups.mjs apps/admin/tests/lookups.test.mjs apps/admin/*.mjs
git commit -m "feat: replace admin UUID inputs with named lookups"
```

---

### Task 12: Migrar Las Viñas y después el catálogo investigado

**Files:**
- Create: `docs/routes/route-catalog-import-v2.md`
- Create: `data/routes/MA-001-sendero-las-vinas.json`
- Create later one JSON per verified route under `data/routes/`
- Optional Create: `scripts/validate-route-catalog.mjs`
- Test: `apps/admin/tests/route-catalog.test.mjs` or script test

**Interfaces:**
- Produces: catálogo reproducible de datos editoriales verificados para importar a staging/producción.

- [ ] **Step 1: Definir formato JSON canónico**

Ejemplo:

```json
{
  "route_code": "MA-001",
  "title": "Sendero Las Viñas",
  "municipality": "Bedmar y Garcíez",
  "status": "review",
  "content": {
    "distance_km": 8.7,
    "duration_minutes": 180,
    "difficulty": "moderate"
  },
  "sources": [],
  "access_points": [],
  "checkpoints": [],
  "discoveries": [],
  "validation": {
    "editorial_status": "reviewing",
    "track_status": "missing",
    "field_status": "not_checked",
    "media_status": "partial",
    "safety_status": "pending"
  }
}
```

- [ ] **Step 2: Crear validador de catálogo**

Debe rechazar:

- fuente sin URL;
- `track_status=verified` sin `route_track_sources.validated_at` equivalente;
- ruta `published` con validation incompleta;
- coordenadas fuera de rango;
- dificultad fuera de enum.

- [ ] **Step 3: Completar MA-001**

Volcar toda la información ya verificada de Las Viñas. Los campos que no estén confirmados quedan vacíos/pendientes, nunca inventados.

- [ ] **Step 4: Smoke en staging**

Abrir `Rutas → MA-001 · Sendero Las Viñas` y recorrer las 10 pestañas. Confirmar que no queda información importante del dataset fuera del modelo V2.

- [ ] **Step 5: Importar el resto del catálogo investigado**

Una ruta cada vez. Estado inicial `review`. No publicación masiva.

- [ ] **Step 6: QA visual y responsive**

Desktop 1440+, tablet ~900, móvil 390. Corregir tablas, tabs, formularios y estados desbordados.

- [ ] **Step 7: CI final + Security Advisor + smoke**

Requeridos antes de proponer merge:

- CI completa verde.
- `supabase db reset` verde.
- pgTAP verde.
- Security Advisor sin nuevos hallazgos por V2.
- Netlify staging READY.
- login Super Admin real.
- Las Viñas visible y editable.
- V2 incomplete route no publicable.
- `main` sin cambios.

- [ ] **Step 8: Commit de datos/documentación**

```bash
git add docs/routes data/routes scripts/validate-route-catalog.mjs apps/admin/tests/route-catalog.test.mjs
git commit -m "data: add verified route catalog v2"
```

---

## Checkpoints de ejecución

### Checkpoint A — Modelo listo

Después de Tasks 1–4:
- esquema V2 reproducible;
- snapshot/readiness;
- operaciones auditadas;
- publicación segura.

### Checkpoint B — Ficha Maestra usable

Después de Tasks 5–9:
- KML/GPX;
- ficha con tabs;
- edición versionada;
- track/acceso;
- mapa/checkpoints/descubrimientos sin UUID.

### Checkpoint C — Operación completa

Después de Tasks 10–11:
- multimedia;
- seguridad;
- fuentes/validación;
- recompensas;
- lookups legibles en todo el Admin.

### Checkpoint D — Datos reales

Después de Task 12:
- Las Viñas como plantilla completa;
- matriz de rutas investigadas migrada progresivamente;
- staging probado antes de cualquier publicación o merge.

## Orden de prioridad

1. Tasks 1–4: base de datos y seguridad.
2. Tasks 5–7: importación + Ficha principal.
3. Tasks 8–10: operación completa por ruta.
4. Task 11: limpieza UX global de UUID.
5. Task 12: migración de datos reales y QA final.

## Definition of Done V2

La V2 se considera terminada cuando un Super Admin puede seleccionar `MA-001 · Sendero Las Viñas`, gestionar toda su ficha sin copiar ningún UUID, importar y verificar su track, gestionar checkpoints/descubrimientos/fotos/incidencias/fuentes/recompensas, ver por qué está o no preparada para publicación, consultar su historial auditado y publicar únicamente cuando el backend confirme `readiness.ready=true`.
