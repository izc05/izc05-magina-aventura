# Mágina Aventura Admin

Panel de control web para la operación de Mágina Aventura. No comparte secretos con el cliente y todas las operaciones sensibles dependen de las políticas RLS y funciones RPC de Supabase.

## Configuración

Copia los valores públicos del proyecto en `config.js` durante el despliegue:

```js
window.MAGINA_ADMIN_CONFIG = {
  supabaseUrl: 'https://<project-ref>.supabase.co',
  publishableKey: 'sb_publishable_...'
};
```

No pongas nunca una secret key/service-role en este archivo.

El directorio puede servirse como sitio estático. Para desarrollo local, cualquier servidor HTTP que sirva `apps/admin` es suficiente.

## Primer Super Admin

La aplicación no puede concederse privilegios a sí misma. Después de crear la primera cuenta en Supabase Auth, un operador de base de datos debe ejecutar una única vez:

```sql
insert into public.user_admin_roles(user_id, role_id)
values ('<AUTH_USER_UUID>'::uuid, 'super_admin');
```

A partir de ese momento el Super Admin puede conceder roles desde el propio panel. Mantener el bootstrap fuera de la aplicación evita que una cuenta recién creada pueda elevar sus propios permisos.

## Roles

- `super_admin`: control completo.
- `admin`: operación general excepto concesión de Super Admin/roles críticos.
- `route_manager`: rutas, mapa, descubrimientos y multimedia.
- `moderator`: usuarios, comunidad, moderación y auditoría.
- `partner`: premios y canjes de su almazara/partner.

## Seguridad

- RLS está habilitado en todas las tablas administrativas expuestas.
- Las operaciones privilegiadas usan funciones de base de datos que validan `auth.uid()`.
- Los roles no dependen de `user_metadata`.
- Los movimientos de aceitunas son transacciones de ledger, no sobrescrituras de saldo.
- Los QR usan tokens opacos cuyo hash se almacena en base de datos y son de un solo uso.
- Las acciones sensibles generan entradas de auditoría.
