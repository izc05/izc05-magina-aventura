# Mágina Aventura Admin

Panel web operativo para gestionar Mágina Aventura sin tocar código de la app móvil. Vive en `apps/admin`, usa el mismo Supabase que `apps/mobile` y se despliega como sitio estático protegido por Supabase Auth, RLS, RPC y auditoría.

No se distribuyen claves secretas al navegador. El cliente solo usa la URL pública de Supabase y una publishable key.

## Alcance implementado

- Dashboard operativo y métricas.
- Rutas: alta, edición versionada, estados `draft -> review -> published -> archived`, GPX y PostGIS.
- Editor visual del trazado con checkpoints y descubrimientos.
- Paquetes PMTiles/offline por versión de geometría.
- Multimedia: subida privada, metadatos, etiquetas, archivo y asociación a rutas; la app puede leer únicamente recursos activos asociados a rutas publicadas mediante RLS.
- Usuarios: listado seguro, ficha administrativa, roles y estado `active / warned / suspended`.
- Comunidad: resumen, moderación, reportes y chat público por canales.
- Gamificación: niveles, insignias, retos, temporadas y colecciones.
- Aceitunas: ledger append-only y correcciones administrativas justificadas.
- Almazaras/partners, premios, stock, reservas y canjes.
- QR de un solo uso con lectura por cámara o imagen cuando el navegador soporta `BarcodeDetector`.
- Notificaciones globales o segmentadas por ruta, municipio o rol, con cola de entrega por dispositivo.
- Seguridad e incidencias de ruta, incluido cierre temporal que bloquea nuevas aventuras sin archivar la ruta.
- Configuración operativa/feature flags.
- Administradores y RBAC con whitelist explícita de capacidades.
- Auditoría de acciones sensibles.

## Arquitectura

El Admin no incorpora un framework web adicional para no romper el lockfile congelado del monorepo. Está compuesto por módulos ES nativos y usa las APIs HTTP de Supabase directamente.

```text
apps/admin/
  index.html
  app.mjs
  enhancements.mjs
  people-community.mjs
  visual-tools.mjs
  settings-tools.mjs
  chat-tools.mjs
  dashboard-user-tools.mjs
  gamification-tools.mjs
  route-content-tools.mjs
  media-tools.mjs
  notification-tools.mjs
  map-asset-tools.mjs
  reward-tools.mjs
  audit-tools.mjs
  safety-tools.mjs
  src/core/
  tests/
  scripts/
```

Las reglas de seguridad reales viven en Supabase. Ocultar un botón nunca sustituye a RLS/RPC.

## Configuración de despliegue

El archivo `config.js` del repositorio se mantiene vacío:

```js
window.MAGINA_ADMIN_CONFIG = window.MAGINA_ADMIN_CONFIG || {
  supabaseUrl: '',
  publishableKey: ''
};
```

En CI/despliegue configura únicamente:

```text
MAGINA_ADMIN_SUPABASE_URL=https://<project-ref>.supabase.co
MAGINA_ADMIN_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Y ejecuta:

```bash
pnpm build:admin-config
```

El script `apps/admin/scripts/write-config.mjs` rechaza URLs no HTTPS, claves `sb_secret_...` y JWT legacy cuyo rol no sea `anon`. Así evita que una clave `service_role` antigua pueda terminar accidentalmente en la configuración del navegador.

Nunca uses aquí `service_role`, `sb_secret_...` ni otra clave privada.

## Hosting estático

Publica el contenido de `apps/admin` en un hosting estático. La configuración `_headers` incluye CSP, `X-Frame-Options`, `nosniff`, política de cámara y `no-store` para `config.js`.

La cámara QR requiere HTTPS en producción. Un subdominio recomendado es:

```text
admin.<dominio-de-magina-aventura>
```

El Admin lleva `noindex,nofollow`; además conviene proteger el subdominio con las reglas de acceso del proveedor si se desea una segunda barrera.

## Primer Super Admin

La aplicación nunca puede elevarse a sí misma. Tras crear la primera cuenta en Supabase Auth, un operador de base de datos ejecuta una única vez:

```sql
insert into public.user_admin_roles(user_id, role_id)
values ('<AUTH_USER_UUID>'::uuid, 'super_admin');
```

A partir de ahí, la gestión de roles se hace desde Admin. El backend impide revocar el último `super_admin`.

## Roles

- `super_admin`: control completo.
- `admin`: operación general salvo gestión de administradores críticos. Sus capacidades están enumeradas explícitamente para que una función sensible añadida en el futuro no quede concedida automáticamente.
- `route_manager`: rutas, mapa, descubrimientos y multimedia.
- `moderator`: usuarios, comunidad, moderación y auditoría.
- `partner`: premios y canjes limitados a su almazara/partner.

Los permisos se guardan en tablas de autorización; nunca se confía en `user_metadata` editable por el usuario.

## Rutas y versiones

`routes`, `route_versions` y `route_geometries` siguen siendo las entidades canónicas. El Admin no crea modelos paralelos.

Al editar contenido o geometría se crea una nueva versión. Si una ruta publicada cambia, vuelve a `review` para impedir cambios silenciosos en producción. La publicación valida que exista contenido y geometría vigentes.

El editor visual permite colocar checkpoints y descubrimientos pulsando sobre el trazado y modificar su estado. El GPX se transforma a `LINESTRING` SRID 4326 antes de guardarse.

## Seguridad de ruta y cierres temporales

Una incidencia puede informar al usuario o marcar `blocks_adventure=true`. En ese segundo caso la ruta sigue publicada y conserva todo su contenido, pero `route_adventure_gate(route_id)` devuelve `can_start=false` mientras la incidencia bloqueante esté abierta y dentro de su ventana temporal.

El panel dispone de una consola específica para cerrar temporalmente y reabrir rutas. Resolver la incidencia o alcanzar `ends_at` elimina el bloqueo sin archivar la ruta.

Los visitantes anónimos/autenticados solo pueden leer incidencias activas de rutas publicadas; el historial interno y las incidencias de borradores siguen protegidos por RLS.

## Multimedia

Los originales viven en el bucket privado `media`. `media_assets` guarda título, alt text, tipo MIME, tamaño, etiquetas y estado de archivo. `route_media` permite reutilizar el mismo recurso como hero, galería, seguridad o descubrimiento.

El bucket continúa siendo privado. RLS permite descargar únicamente activos no archivados vinculados a rutas publicadas; el resto solo está disponible para administración autorizada.

El panel archiva en lugar de borrar físicamente por defecto para no romper rutas que todavía referencien el archivo.

## Comunidad y chat

El panel gestiona contenido público y reportes. El chat incorporado es público por canales globales, de ruta o municipio; soporta ocultar/restaurar/eliminar mensajes y resolver reportes.

No existe un lector administrativo general de conversaciones privadas. La privacidad de mensajes privados se mantiene fuera del panel.

## Aceitunas y premios

Las aceitunas son un ledger de transacciones. Una corrección administrativa añade un movimiento con actor y motivo; nunca sobrescribe un saldo sin trazabilidad. Los clientes autenticados no tienen permisos Data API para insertar, actualizar o borrar movimientos directamente.

El flujo de premio es:

```text
available -> reserved -> redeemed
                  |-> expired
                  |-> cancelled
```

La reserva descuenta aceitunas y stock de forma transaccional. Cancelación/caducidad los devuelve. El QR contiene un token opaco; la base de datos almacena su hash y el token solo puede canjearse una vez.

## Notificaciones

`admin_notifications` gestiona borrador/publicación y audiencia:

- `all`
- `route`
- `municipality`
- `role`

`push_device_subscriptions`, `notification_topic_subscriptions` y `notification_deliveries` preparan el fan-out por dispositivo. Los tokens de push no se muestran en Admin.

Las funciones de consumo de la cola están concedidas únicamente a `service_role`, de modo que un navegador autenticado no puede extraer tokens ni hacerse pasar por el despachador de notificaciones.

## Seguridad

- RLS en cada tabla administrativa expuesta.
- Grants explícitos por tabla/función.
- Ninguna autorización depende de `raw_user_meta_data`.
- `SECURITY DEFINER` solo en operaciones estrechas y con `search_path=''`.
- Funciones privilegiadas comprueban capacidad y/o actor.
- Service-role nunca llega al navegador.
- Tokens QR almacenados como hash.
- Audit log y ledger de aceitunas son append-only desde el punto de vista del cliente autenticado.
- El escritor interno de auditoría no es ejecutable directamente por `anon`/`authenticated`.
- Auditoría cubre geometrías, asociaciones de media y catálogos de gamificación.
- Sesiones Admin se guardan en `sessionStorage` y renuevan automáticamente el access token mediante el refresh token.
- CSP y headers defensivos para hosting estático.

## Verificación

El comando raíz:

```bash
pnpm test
```

incluye:

- tests existentes de los paquetes y la app móvil;
- validación de sintaxis de todos los `.mjs` de Admin;
- tests Node del núcleo Admin;
- comprobación de que todos los módulos operativos estén enlazados desde `index.html`;
- tests del guard de configuración pública;
- en GitHub Actions, prebuild Android;
- `supabase db reset` desde cero;
- pgTAP para contratos, RLS, privilegios, auditoría, multimedia pública, cierres de ruta y RPC administrativos.

La rama de trabajo es `feat/admin-v1` y el PR correspondiente permanece separado de `main` hasta revisión/merge explícito.
