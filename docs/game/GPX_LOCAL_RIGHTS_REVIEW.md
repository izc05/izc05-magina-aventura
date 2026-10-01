# Revisión local de procedencia GPX

Este gate amplía la vista previa técnica existente; **no importa ni publica rutas**. El GPX seleccionado se lee temporalmente para mostrar únicamente un nombre genérico, la versión declarada y conteos anónimos. No se muestran nombres, descripciones ni otros metadatos libres del XML, y no se conserva la geometría ni una URI del archivo.

## Borrador privado por cuenta

Cuando una persona autenticada inicia una revisión, la app guarda un borrador en una base SQLite privada de la instalación, separada de las tablas de actividad y de cualquier outbox o cola de sincronización. El `owner_id` local aísla borradores entre cuentas; visitantes sin sesión no pueden cargar ni guardar un borrador persistente. Al cerrar y reabrir la pantalla, la persona de la misma cuenta puede recuperar sus metadatos. El GPX no se almacena ni se vincula automáticamente al borrador: hay que volver a seleccionarlo localmente para ver el preview.

Se persisten solo los metadatos necesarios de origen/derechos/atribución: fuente o URL, titular/autor, tipo de licencia o permiso, declaración del permiso, alcances comercial/derivados/distribución, atribución requerida y los estados `CANDIDATE` / `UNVERIFIED`. La referencia local opcional al documento es temporal y no se persiste; tampoco se guardan bytes del GPX, archivo de autorización, ruta/nombre local, geometría, coordenadas, checkpoints o métricas. No se visita la URL, ni se abre, copia, sube, exporta o sincroniza el documento. El usuario conserva el documento privado en su dispositivo.

## Bloqueos

La ficha de revisión no se convierte en entidad de ruta operativa. Los campos incompletos, un permiso rechazado o cualquier uso requerido no permitido bloquean la revisión de derechos. Aunque se completen todos los campos y se declare permiso para cada alcance, el estado sigue siendo `CANDIDATE` / `UNVERIFIED`; publicación, GPS y creación de checkpoints siguen deshabilitados. Hace falta revisión oficial y verificación en terreno, ajenas a esta pantalla. No existe botón local para marcar la geometría como verificada.

## Verificación automatizada

- Pruebas puras: autorización ausente, permiso parcial, rechazo y bloqueo persistente tras completar campos.
- Pruebas SQLite: cierre/reapertura, estado no verificado, referencia documental excluida y aislamiento entre cuentas.
- Pruebas móviles: campos separados, privacidad, modo visitante y capacidades bloqueadas.
