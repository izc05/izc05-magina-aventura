# Mágina Aventura — Game Engine V2

## Propósito

Esta rama abre una línea nueva para reconstruir Mágina Aventura alrededor de un motor de aventura geolocalizada escalable.

La app no debe ser una única ruta programada a mano. Debe convertirse en una plataforma donde una ruta sea un paquete de datos y contenido que el motor sabe ejecutar.

Flujo objetivo:

```
Ruta
  -> checkpoint
  -> aproximación GPS
  -> descubrimiento
  -> historia / contenido
  -> reto / pregunta / interacción
  -> recompensa
  -> inventario / insignia / cupón
  -> siguiente checkpoint
```

La primera ruta funcional será Las Viñas y servirá como plantilla de referencia para las siguientes.

## Principio principal

No se empieza borrando lo existente ni copiando un proyecto externo entero.

Se construye un núcleo nuevo y limpio en esta rama, reutilizando únicamente módulos propios que superen una auditoría técnica y patrones/código open source cuya licencia permita expresamente su reutilización.

`main` queda protegido como referencia estable.

## Referencias open source a auditar

### LootDrop
Repositorio: https://github.com/LootDropX/Solana-Mobile

Interesa estudiar:
- mapa y entidades geolocalizadas;
- detección de proximidad;
- elementos reclamables/desbloqueables;
- inventario;
- ranking/progreso;
- arquitectura React Native/Expo/Supabase;
- PostGIS/geohash;
- GPS simulado para desarrollo.

Regla: no copiar código hasta verificar de forma concluyente su licencia actual.

### GPScavenger
Repositorio: https://github.com/StoutsHonor/GP-Scavenger

Interesa estudiar:
- progresión por marcadores GPS;
- checkpoints;
- acertijos/preguntas;
- desbloqueo secuencial;
- creación de recorridos;
- conceptos multijugador/lobby si fueran útiles más adelante.

Regla: auditar licencia y vigencia técnica antes de reutilizar código.

### Scavenger Hunt — stephenthedev
Repositorio: https://github.com/stephenthedev/scavenger-hunt

Interesa estudiar:
- estructura de juego de búsqueda geolocalizada;
- geolocalización en tiempo real;
- separación entre mapa, lógica de juego y contenido.

Regla: verificar el archivo LICENSE en el commit exacto que se use y conservar los avisos exigidos.

### ViroReact
Repositorio: https://github.com/ReactVision/viro

Uso previsto, no obligatorio en el primer vertical slice:
- capa AR en checkpoints especiales;
- objetos virtuales;
- descubrimientos mediante cámara;
- escenas narrativas puntuales.

La AR es una capa del motor, no un requisito para que una ruta funcione.

### Expo GeoPulse
Repositorio: https://github.com/ramon3198/expo-geopulse

Interesa estudiar:
- tracking GPS en segundo plano;
- geofencing;
- filtrado de movimiento;
- persistencia/offline;
- recuperación de sesiones.

Debe compararse con el runtime GPS actual antes de decidir si integrar, adaptar o descartar.

## Arquitectura objetivo

### 1. Game Engine
Responsable de:
- estado de aventura;
- checkpoint actual;
- reglas de desbloqueo;
- retos;
- recompensas;
- progreso;
- pausa/reanudación/finalización;
- recuperación tras cerrar pantalla o app.

No debe depender de una ruta concreta.

### 2. Location Engine
Responsable de:
- GPS real;
- GPS simulado de QA;
- distancia al objetivo;
- precisión;
- filtros de muestras malas;
- geofencing;
- tracking de recorrido;
- background/foreground;
- recuperación tras bloqueo/apagado de pantalla.

El reloj de sesión debe basarse en tiempo monotónico/real y no en número de muestras GPS.

### 3. Map Layer
Responsable de:
- geometría oficial de la ruta;
- posición del usuario;
- checkpoints;
- tramo recorrido;
- tramo restante;
- discoveries cercanos;
- estados visuales bloqueado/disponible/completado.

Debe seguir funcionando con degradación razonable sin cobertura si la ruta fue descargada.

### 4. Content Engine
Cada checkpoint podrá contener:
- título;
- texto;
- historia;
- audio;
- imagen;
- vídeo;
- personaje;
- dato natural/cultural;
- pregunta;
- pista;
- objeto virtual;
- recompensa.

El contenido debe cargarse desde datos, no quedar hardcodeado en pantallas.

### 5. Challenge Engine
Tipos iniciales:
- llegar a coordenada;
- permanecer dentro de radio;
- responder pregunta;
- opción múltiple;
- encontrar elemento;
- ordenar;
- escanear QR;
- captura/foto opcional;
- interacción AR futura.

### 6. Rewards
Tipos:
- XP;
- insignia;
- collectible;
- discovery;
- logro;
- cupón/promoción.

Los cupones comerciales se diseñarán de forma separada de la lógica nuclear del juego para poder activarlos o desactivarlos por ruta.

### 7. Inventario y progreso
Debe guardar:
- rutas iniciadas/completadas;
- checkpoints completados;
- discoveries;
- insignias;
- collectibles;
- recompensas;
- estadísticas;
- actividad reciente.

### 8. Supabase
Backend previsto:
- Auth;
- Postgres;
- PostGIS;
- Storage;
- Edge Functions cuando sea necesario;
- progreso del usuario;
- catálogo de rutas;
- checkpoints;
- contenido;
- rewards;
- promociones.

El motor debe ser offline-first: durante la ruta la pérdida temporal de Internet no puede impedir avanzar en checkpoints ya descargados.

## Modelo de datos conceptual

```
routes
route_versions
route_segments
checkpoints
checkpoint_content
checkpoint_challenges
discoveries
rewards
badges
collectibles
business_promotions
user_route_progress
user_checkpoint_progress
user_inventory
route_asset_packs
```

Cada ruta debe tener versión para evitar que una modificación editorial rompa una aventura ya iniciada.

## Ruta 001 — Las Viñas

Será la ruta patrón.

Debe reunir:
- geometría oficial verificada;
- inicio/fin;
- dificultad;
- distancia;
- desnivel si está disponible;
- checkpoints;
- discoveries;
- narrativa;
- imágenes;
- fuentes documentales;
- retos;
- recompensas;
- assets descargables;
- datos para modo QA/simulación.

Todo lo creado para Las Viñas debe servir después para crear una Ruta 002 sin tocar el código del motor.

## Definición del MVP V2

Se considera que el nuevo motor funciona cuando en Android podemos:

1. abrir Las Viñas;
2. descargar/cargar su paquete;
3. ver mapa, ruta, usuario y checkpoints;
4. iniciar aventura;
5. usar GPS real o modo QA simulado;
6. acercarse al checkpoint 1;
7. desbloquearlo dentro de un radio configurable;
8. mostrar contenido;
9. completar un reto;
10. recibir recompensa;
11. activar el siguiente checkpoint;
12. pausar;
13. apagar/encender pantalla y recuperar correctamente;
14. finalizar;
15. conservar progreso offline;
16. sincronizar posteriormente con Supabase.

## Reglas de seguridad técnica

- No fusionar esta rama en `main` automáticamente.
- No copiar código sin licencia compatible verificada.
- Registrar procedencia de cualquier fragmento reutilizado.
- Mantener los avisos de copyright/licencia exigidos.
- No introducir SDKs cerrados cuando exista una alternativa razonable sin documentar la decisión.
- No reescribir módulos estables solo por reescribirlos.
- Cada integración debe tener test o evidencia reproducible.
- GPS real y GPS simulado deben compartir las mismas reglas de negocio.

## Resultado deseado

Mágina Aventura debe dejar de ser una colección de pantallas y convertirse en un motor de aventuras geolocalizadas capaz de recibir nuevas rutas, historias, imágenes, checkpoints, retos, objetos y promociones sin volver a programar la aplicación.
