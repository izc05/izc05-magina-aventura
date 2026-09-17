# Mágina Aventura — RC1 Canon · Sección 9 — Datos, backend, almacenamiento y sincronización

Status: **APPROVED / LOCKED CANON**  
Date: 2026-09-17  
Owner rule: **No modificar salvo decisión explícita del propietario del producto. Todo cambio futuro debe quedar versionado y justificado; nunca sobrescrito silenciosamente.**

## 1. Arquitectura elegida

RC1 adopta una arquitectura híbrida deliberada:

`Supabase/PostgreSQL/PostGIS + Supabase Storage + Cloudflare R2 + SQLite local + colas idempotentes de sincronización`.

No se adopta ni un modelo "todo Supabase" ni un modelo totalmente autogestionado para RC1.

## 2. Supabase como autoridad global

Supabase es la autoridad global para:

- identidad y autenticación;
- perfiles y permisos;
- rutas, versiones y geometrías;
- descubrimientos, colecciones y contenido canónico;
- comunidad y moderación;
- incidencias y cierres;
- progreso verificado;
- recompensas y ledger;
- auditoría;
- RLS/RPC y reglas de autorización.

PostGIS resuelve operaciones geográficas servidor y mantiene la geometría canónica.

## 3. Separación entre estado y archivos pesados

PostgreSQL conserva estado, relaciones, versiones, metadatos y referencias. No se usa como almacén principal de archivos binarios grandes.

### 3.1 R2

Cloudflare R2 se reserva inicialmente para artefactos grandes, inmutables, cacheables y versionados, especialmente:

- PMTiles;
- mapas derivados;
- paquetes grandes de cartografía;
- otros assets públicos pesados cuando exista justificación.

Los object keys deben ser versionados por ruta/geometría/mapa. Una versión publicada no se sobrescribe; una actualización genera un nuevo objeto.

### 3.2 Supabase Storage

RC1 conserva Supabase Storage para multimedia privada/editorial/comunitaria:

- rutas;
- descubrimientos;
- comunidad;
- seguridad;
- contenido editorial.

Los originales permanecen privados por defecto y se accede mediante políticas/autorización. Los metadatos viven en base de datos. Archivar es preferible a borrar físicamente por defecto cuando existan referencias.

Mover multimedia masiva a R2 no es requisito de RC1 y se considera una optimización posterior.

## 4. SQLite como autoridad local durante una aventura

SQLite operativo no es caché desechable.

Durante una aventura sin conectividad, el dispositivo conserva localmente como mínimo:

- sesión de actividad;
- muestras GPS;
- snapshots;
- estado de pausa/finalización;
- lotes de sincronización;
- evidencia de descubrimientos pendiente;
- estado del paquete offline.

Regla: **los datos operativos de una aventura no pueden perderse por tratarse como caché temporal**.

Mientras la aventura está desconectada, SQLite es la autoridad local de la actividad hasta su reconciliación con el servidor.

## 5. Paquete de aventura offline

Cada paquete offline se identifica por un manifiesto versionado que puede incluir:

- routeId;
- routeVersion;
- geometryVersion;
- mapVersion;
- contentVersion;
- generatedAt;
- PMTiles;
- track/geometría;
- perfil de elevación;
- POI;
- descubrimientos públicos/hints;
- checkpoints;
- snapshot de seguridad/restricciones;
- snapshot meteorológico;
- multimedia esencial.

Una actualización debe poder determinar qué piezas están obsoletas sin asumir que todo el paquete debe descargarse de nuevo.

## 6. Sincronización idempotente

Patrón obligatorio:

`local -> crear batch/evento -> idempotencyKey -> enviar -> servidor procesa -> accepted/duplicate/rejected -> ACK -> marcar sincronizado`.

Nunca se borra una operación local relevante por el mero hecho de haber intentado enviarla.

Si la red falla, se reintenta con la misma identidad idempotente.

Idempotencia se aplica a toda operación reintentable con efectos importantes, incluyendo:

- actividades;
- descubrimientos;
- progreso;
- recompensas;
- reservas/canjes;
- otras operaciones transaccionales cuando proceda.

Un reintento no puede duplicar XP, insignias, retos, saldo, stock ni cualquier otro efecto protegido.

## 7. Flujo de actividad verificada

Flujo canónico:

`GPS -> SQLite -> actividad completada localmente -> sync batch -> Supabase -> validación -> actividad verificada -> motor de progresión -> XP/nivel/badges/retos/ranking -> reward validation -> recompensa/aceitunas si corresponde`.

La finalización local no depende de Internet.

El teléfono puede mostrar que la aventura está completada, pero no presenta como definitiva una recompensa protegida hasta que el servidor la valida.

## 8. Descubrimientos y evidencia

El cliente puede detectar un candidato y guardar evidencia local. El servidor determina el desbloqueo protegido y las recompensas asociadas.

Flujo:

`proximidad/interacción -> candidato local -> evidencia persistida -> sincronización -> validación servidor -> approved/rejected/pending -> progresión`.

La UX puede reconocer que se ha encontrado/capturado algo, diferenciando claramente el estado provisional del resultado verificado.

## 9. Datos geográficos sensibles

Separar siempre cuando sea necesario:

- geometría exacta privada para validación/administración;
- geometría pública generalizada para presentación.

No publicar automáticamente coordenadas exactas de:

- flora/fauna sensible;
- cuevas;
- patrimonio vulnerable;
- secretos;
- ubicaciones privadas de usuarios;
- inicios/finales de tracks cuando su exposición sea innecesaria.

## 10. Payloads públicos coherentes

La app no debe necesitar recomponer una aventura publicada mediante docenas de consultas inconexas. Se favorecen payloads/read models versionados y coherentes que agrupen el contenido público necesario para una aventura publicada.

La publicación debe garantizar coherencia entre contenido, geometría, assets offline y estado de seguridad.

## 11. Proveedores externos mediante adaptadores

Servicios externos se encapsulan detrás de contratos de dominio, por ejemplo:

- WeatherProvider;
- MapAssetProvider;
- MediaProvider;
- NotificationProvider.

AEMET no se consume directamente desde la pantalla móvil. El backend/worker normaliza y cachea snapshots meteorológicos para permitir control de errores, cuotas y fallback futuro.

## 12. Push y tareas privilegiadas

El navegador Admin nunca recibe credenciales privadas ni tokens de dispositivos de forma indiscriminada.

Admin crea la intención/configuración. Un proceso privilegiado consume colas y realiza entregas.

`service_role`/credenciales secretas no llegan a móvil ni a Admin web.

## 13. RLS y autorización

La autorización real reside en RLS/RPC/grants y capacidades explícitas.

Ocultar botones no es seguridad.

Usuarios ordinarios nunca pueden modificar directamente campos como:

- rol administrativo;
- estado de moderación;
- verificación de actividad;
- ledger/saldo de aceitunas;
- auditoría;
- resultados protegidos del motor de progresión.

## 14. Privacidad de tracks

El track GPS crudo es privado por defecto.

Compartir una actividad no equivale a publicar todos los puntos exactos.

Cuando se ofrezca track público se puede generar una proyección/sanitización que oculte o generalice:

- inicio;
- final;
- zonas sensibles;
- precisión innecesaria.

## 15. Auditoría y observabilidad son distintas

Auditoría registra decisiones/acciones sensibles de negocio: quién hizo qué, cuándo y por qué.

Observabilidad registra salud técnica: errores, tiempos, fallos de workers, crashes, latencia, etc.

No se usa la auditoría como vertedero de logs técnicos.

## 16. Retención

Antes de producción se definirán políticas diferenciadas para:

- actividades verificadas;
- tracks crudos;
- logs técnicos;
- weather cache;
- notificaciones;
- multimedia;
- auditoría;
- transacciones/recompensas.

La retención debe corresponder al valor, sensibilidad y obligación operacional del dato.

## 17. Backups y restauración

RC1 exige una estrategia verificable de:

- backup de base de datos;
- protección/versionado de object storage donde aplique;
- configuración versionada;
- migraciones en Git;
- prueba real de restauración periódica.

Principio: **un backup no se considera fiable hasta que se ha probado su restauración**.

## 18. Entornos

Mínimo:

- local;
- staging;
- production.

Migraciones destructivas, experimentos de economía, pruebas de recompensas, borrados masivos o cambios sensibles no se ensayan directamente en producción.

Flujo deseado:

`branch -> CI -> staging -> smoke/field validation -> production`.

## 19. Infraestructura local

Raspberry/mini PC puede apoyar:

- desarrollo;
- staging auxiliar;
- generación de mapas;
- procesos pesados;
- backups;
- pruebas.

Pero RC1 público no depende exclusivamente de alimentación, fibra, router o túnel de una infraestructura doméstica.

## 20. Reglas canónicas bloqueadas

1. **La nube es autoridad global; el móvil es autoridad local durante una aventura offline hasta reconciliación.**
2. **SQLite operativo no es caché desechable.**
3. **PostgreSQL conserva estado/relaciones; object storage conserva archivos pesados.**
4. **Todos los procesos reintentables con efectos de progreso o valor deben ser idempotentes.**
5. **Los datos GPS exactos son privados por defecto.**
6. **El cliente no concede unilateralmente resultados protegidos.**
7. **RLS/RPC/grants son autoridad; la UI no sustituye controles servidor.**
8. **Las versiones publicadas de geometría/assets no se sobrescriben silenciosamente.**
9. **La infraestructura doméstica puede apoyar, pero no ser el único punto de disponibilidad del RC público.**
10. **Cualquier cambio a este canon requiere decisión explícita del propietario y debe quedar versionado.**
