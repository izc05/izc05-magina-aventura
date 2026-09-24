# Mágina Aventura RC1 — Staging Runbook & Smoke Test Sequence

Este documento define la secuencia exacta de pruebas de humo (*smoke sequence*) requeridas para validar un entorno de **Staging** antes del empaquetado de producción y publicación física.

## Entorno Staging
- **Identificador de entorno**: `staging`
- **Autoridad Supabase**: Proyecto de Staging aislado (URL `https://<staging-project>.supabase.co`).
- **Seguridad de credenciales**: El cliente móvil únicamente recibe variables públicas (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_APP_ENV=staging`). Las claves con privilegios (`service_role`, `AEMET_API_KEY`) permanecen exclusivamente en el servidor/Edge Functions.

---

## Secuencia Exacta de Smoke Testing en Staging

### 1. Autenticación Móvil (Auth Signup/Login)
- [ ] Registro e inicio de sesión desde la app móvil contra Supabase Auth en Staging.
- [ ] Verificación de generación de JWT autenticado y perfil inicial de usuario.

### 2. Lectura de Catálogo Canónico (Catalog Read)
- [ ] Lectura del catálogo publicado mediante RPC / Vistas de Supabase.
- [ ] Verificación de que las métricas incompletas o no validadas no se fuerzan a cero.

### 3. Lectura de Ruta Publicada (Published Route Read)
- [ ] Selección y carga del detalle de una ruta en estado `published`.
- [ ] Verificación del trazado geométrico en MapLibre.

### 4. Lectura de Cuadros (Cuadros Read when ready)
- [ ] Lectura específica de la ruta *Sendero de Cuadros* (Bedmar y Garcíez).
- [ ] Verificación de disponibilidad de metadatos oficiales y puntos de interés.

### 5. Descarga de Manifiesto Offline (Offline Manifest Fetch)
- [ ] Petición del manifiesto `OfflineAdventureManifestV1`.
- [ ] Verificación de hash de contenido y empaquetado atómico en almacenamiento local.

### 6. Subida de Actividad (Activity Upload)
- [ ] Grabación de un recorrido de prueba en primer y segundo plano con GPS.
- [ ] Envío de lotes de muestras (`activity_track_batches`) con clave de idempotencia.

### 7. Validaciones del Servidor (Server Validation)
- [ ] Invocación de la función Edge `validate-activity`.
- [ ] Verificación del estado de decisión (`VERIFIED`, `FLAGGED` o `REJECTED`) guardado en `activity_validation_decisions`.

### 8. Lectura de Progresión y Recompensas (Progression Read)
- [ ] Lectura de estadísticas verificadas (`verified_activity_stats`) y libro mayor (`user_ledger`).
- [ ] Confirmación de que las actividades pendientes no inflan el ranking oficial.

### 9. Inicio de Sesión Administrador (Admin Login)
- [ ] Acceso a la consola de administración (`apps/admin`) con rol superadministrador en Staging.

### 10. Lectura y Gestión en Route Master (Route Master Read)
- [ ] Carga del trazado, contenidos V2 y descubrimientos en el panel Route Master.

### 11. Lectura del Control Center RC1 (RC1 Control Center Read)
- [ ] Inspección del cuadro de mando RC1 Control Center en Admin (`apps/admin/src/core/rc1-control-center.mjs`).
- [ ] Verificación de los estados de los gates (`READY`, `BLOCKED`, `MANUAL`) asociados al `candidate_sha` exacto.

### 12. Lectura Pública de Comunidad (Community Public Read)
- [ ] Verificación de la lectura de publicaciones públicas autorizadas en la comunidad.
- [ ] Confirmación de la desasociación y protección de la evidencia privada de la actividad.

---

## Criterio de Aprobación
Todos los pasos de la secuencia deben completarse satisfactoriamente sin excepciones no gestionadas ni exposición de claves privadas en los logs del cliente.
