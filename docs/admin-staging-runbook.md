# Mágina Aventura · Admin staging runbook

Este documento cierra el paso entre el PR de código y un entorno real de staging. No contiene secretos.

## Objetivo

Validar el panel Super Admin de Mágina Aventura contra un proyecto Supabase limpio antes de fusionar `feat/admin-v1` en `main`.

## 1. Crear el proyecto de staging

Nombre recomendado: `magina-aventura-staging`.

Región recomendada para usuarios en España: una región europea cercana, preferentemente `eu-west-1` cuando esté disponible en la organización elegida.

No reutilizar un proyecto de producción ni mezclar datos de otros productos.

## 2. Aplicar el esquema

Aplicar todas las migraciones de `supabase/migrations` en orden sobre el proyecto limpio.

Después verificar:

- el reset/migración termina sin errores;
- existen las tablas administrativas y de rutas;
- RLS está activo en las tablas expuestas;
- las funciones RPC de administración existen;
- el bucket `media` permanece privado;
- `admin_audit_log` y `olive_transactions` no admiten escrituras directas desde `authenticated`;
- la cola de notificaciones solo puede ser reclamada/completada por `service_role`.

## 3. Ejecutar advisors

Ejecutar los advisors de seguridad y rendimiento tras aplicar las migraciones.

No avanzar al smoke test si aparece un hallazgo de seguridad crítico relacionado con RLS, funciones `SECURITY DEFINER`, Storage o grants.

## 4. Crear la primera cuenta administradora

Crear una cuenta de Supabase Auth para el propietario del entorno y obtener su UUID.

Ejecutar una sola vez con acceso de operador de base de datos:

```sql
insert into public.user_admin_roles(user_id, role_id)
values ('<AUTH_USER_UUID>'::uuid, 'super_admin');
```

Comprobar después que:

- puede iniciar sesión en Admin;
- aparece como `super_admin`;
- no se puede revocar el último `super_admin`.

## 5. Configuración pública del Admin

El navegador solo recibe:

```text
MAGINA_ADMIN_SUPABASE_URL=https://<project-ref>.supabase.co
MAGINA_ADMIN_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Generar `apps/admin/config.js` mediante:

```bash
pnpm build:admin-config
```

Nunca publicar `service_role`, `sb_secret_...` ni un JWT legacy con rol distinto de `anon`.

## 6. Desplegar el panel

Publicar el contenido de `apps/admin` en HTTPS.

Hostname recomendado:

```text
admin-staging.<dominio-de-magina-aventura>
```

Requisitos:

- HTTPS obligatorio para cámara QR;
- respetar `apps/admin/_headers`;
- `noindex,nofollow` activo;
- `config.js` con `Cache-Control: no-store`;
- opcionalmente añadir una segunda barrera de acceso del proveedor delante del login Supabase.

## 7. Smoke test funcional

Ejecutar en este orden y registrar resultado:

1. Login y logout del `super_admin`.
2. Crear una ruta en borrador.
3. Importar un GPX real.
4. Añadir checkpoint y descubrimiento desde el editor visual.
5. Subir una imagen y asociarla como hero/galería.
6. Pasar ruta `draft -> review -> published`.
7. Confirmar que la app/cliente público solo ve la ruta publicada y sus medios públicos permitidos.
8. Abrir una incidencia de seguridad y confirmar que aparece en la ruta publicada.
9. Cerrar temporalmente la ruta y confirmar que no se puede iniciar una nueva aventura.
10. Reabrir la ruta y confirmar que vuelve a estar disponible.
11. Crear usuario de prueba y aplicar `warned`, `suspended`, `active`.
12. Confirmar que un usuario suspendido no puede publicar en comunidad/chat.
13. Crear nivel, insignia, reto, temporada y colección.
14. Registrar un ajuste administrativo de aceitunas y comprobar auditoría.
15. Crear partner/almazara y premio con stock limitado.
16. Reservar premio, generar QR y canjearlo una sola vez.
17. Confirmar que un segundo intento con el mismo QR falla.
18. Probar cancelación/caducidad de reserva y devolución de stock/aceitunas.
19. Crear y publicar una notificación segmentada.
20. Revisar auditoría de las acciones anteriores.

## 8. Criterios de salida

El staging se considera apto para merge cuando:

- CI de `feat/admin-v1` está verde;
- migraciones aplican desde una base vacía;
- advisors sin hallazgos críticos pendientes;
- los 20 pasos de smoke test pasan;
- no se ha expuesto ninguna clave secreta;
- no hay hilos de review pendientes en PR #8;
- el propietario aprueba expresamente el merge.

## 9. Después del staging

Solo tras la aprobación:

1. fusionar PR #8 en `main`;
2. desplegar el Admin estable;
3. mantener staging para nuevas migraciones y pruebas;
4. crear producción separada cuando el producto lo requiera;
5. no reutilizar staging como producción.
