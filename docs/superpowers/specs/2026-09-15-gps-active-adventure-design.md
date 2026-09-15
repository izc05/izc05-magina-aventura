# Motor GPS + Aventura Activa V1 — Diseño

**Fecha:** 2026-09-15  
**Repositorio:** `izc05/izc05-magina-aventura`  
**Rama de diseño/implementación:** `feat/gps-activity-v1`  
**Base:** `feat/foundation-v1`

## 1. Objetivo

Construir el motor de actividad de Mágina Aventura para que una ruta pueda registrarse de forma fiable con GPS real, incluso con pantalla bloqueada, cobertura deficiente o cierres de la app, manteniendo el producto offline-first.

El criterio de éxito de V1 es poder realizar una actividad completa con:

- inicio, pausa, reanudación y finalización;
- track GPS persistente;
- distancia y tiempos coherentes;
- progreso sobre la geometría oficial de la ruta;
- detección robusta de salida de trazado;
- recuperación de sesión tras cierre/reapertura;
- tracking en segundo plano en Android;
- funcionamiento sin Internet durante la actividad;
- sincronización posterior por lotes.

## 2. Alcance

### Incluye

- `expo-location` + `expo-task-manager`;
- permisos foreground/background solicitados al iniciar una aventura, no al instalar la app;
- servicio de ubicación en primer plano durante una actividad activa en Android;
- motor de actividad puro e independiente de Expo/Supabase;
- filtrado y normalización de muestras GPS;
- estado `DRAFT -> ACTIVE -> PAUSED -> FINISHED -> VALIDATING -> VERIFIED | REJECTED`;
- track incremental local;
- snapshots periódicos de actividad;
- recuperación tras cierre de app;
- cálculo de distancia, tiempos, velocidad/ritmo, altitud, desnivel inicial, progreso y off-route;
- render del track realizado sobre MapLibre;
- cola de sincronización offline para envío posterior por lotes;
- tests sintéticos, replay de tracks y prueba física Android.

### No incluye

- desbloqueo de checkpoints o descubrimientos (Plan 05);
- antifraude definitivo y verificación servidor (Plan 07);
- rankings, XP o recompensas (Plan 06/07);
- contenido ficticio para aparentar una ruta real;
- dependencia de red para poder registrar una actividad.

El motor debe dejar interfaces preparadas para que Plan 05 pueda consumir posición/proximidad sin acoplarse a Expo Location.

## 3. Principios de arquitectura

### 3.1 GPS adaptativo equilibrado

Se usará un perfil de senderismo equilibrado, no un muestreo fijo agresivo a 1 Hz.

- `ACTIVE`: precisión alta y actualizaciones adaptativas por movimiento/distancia.
- `PAUSED`: frecuencia reducida y sin acumular distancia/tiempo en movimiento.
- background: se mantiene el tracking mientras el sistema operativo lo permita.
- pérdida temporal de señal: la sesión no termina; se muestra estado de señal degradada.

El objetivo es equilibrar precisión, batería y estabilidad.

### 3.2 Separación de infraestructura y dominio

```text
Expo Location / Task Manager
          ↓
Location Provider
          ↓
Activity Engine (puro)
          ↓
TrackStore + ActivitySnapshot
          ↓
UI / MapLibre / Sync Queue
```

`Activity Engine` no importa Expo, React Native, Supabase ni MapLibre. Recibe muestras normalizadas y devuelve estado derivado.

### 3.3 Offline-first

La actividad se completa localmente. La red no es requisito durante el recorrido.

Los puntos no se envían uno a uno a Supabase. Se almacenan localmente y se sincronizan posteriormente en lotes idempotentes.

## 4. Modelo de datos local

### 4.1 LocationSample

Campos mínimos:

- `sequence`;
- `timestamp`;
- `latitude`;
- `longitude`;
- `accuracyMeters`;
- `altitudeMeters | null`;
- `speedMps | null`;
- `headingDegrees | null`;
- `validForMetrics`;
- `rejectionReason | null`.

Las muestras con mala calidad pueden conservarse para diagnóstico pero no necesariamente participar en métricas.

### 4.2 ActivitySession

- `activityId`;
- `routeId`;
- `routeSlug`;
- `geometryVersion`;
- `state`;
- `startedAt`;
- `pausedAt | null`;
- `finishedAt | null`;
- `lastProcessedSequence`;
- `syncState`.

Una actividad queda fijada a una `geometryVersion` concreta. Si la ruta cambia después, la actividad histórica sigue evaluándose contra la versión con la que comenzó.

### 4.3 ActivitySnapshot

- estado de la sesión;
- distancia válida acumulada;
- tiempo total;
- tiempo en movimiento;
- velocidad/ritmo derivados;
- desnivel positivo/negativo acumulado;
- progreso de ruta;
- distancia actual al trazado;
- estado off-route;
- última posición válida;
- último punto procesado;
- versión del algoritmo/snapshot.

## 5. Persistencia y recuperación

Se usa un modelo híbrido:

1. puntos GPS almacenados incrementalmente;
2. snapshot compacto en cambios de estado y cada intervalo razonable;
3. al reabrir la app se carga el último snapshot;
4. solo se reprocesan los puntos posteriores a `lastProcessedSequence`.

La persistencia debe ser atómica a nivel de lote para evitar snapshots que apunten a puntos no guardados.

Si Android mata el proceso, la sesión debe poder rehidratarse sin perder los puntos ya persistidos.

Un reinicio completo del teléfono puede interrumpir el tracking hasta reabrir la app, pero la sesión sigue siendo recuperable.

## 6. Filtrado GPS

Cada muestra pasa por un filtro de calidad antes de afectar métricas.

Se rechazan o marcan como no válidas para métricas cuando exista, por ejemplo:

- precisión claramente insuficiente;
- timestamp no monotónico;
- salto espacial incompatible con el tiempo transcurrido;
- velocidad físicamente inverosímil para senderismo;
- coordenadas inválidas.

No se elimina silenciosamente la muestra: se conserva el motivo de rechazo para diagnóstico y futura validación servidor.

Los umbrales concretos serán configurables y cubiertos por tests; no se incrustan como números dispersos por la UI.

## 7. Métricas de actividad

### 7.1 Distancia

Se suma la distancia entre muestras válidas consecutivas. No se cuentan saltos rechazados ni desplazamiento durante `PAUSED`.

### 7.2 Tiempo

Se muestran al menos:

- tiempo total desde inicio hasta finalización;
- tiempo en movimiento, excluyendo pausas explícitas y con posibilidad de refinar detección automática más adelante.

V1 prioriza pausa explícita; la autodetección avanzada de parada no es requisito de cierre.

### 7.3 Velocidad y ritmo

Se derivan de distancia válida y ventanas temporales suavizadas para evitar valores erráticos por una sola muestra.

### 7.4 Altitud y desnivel

V1 acepta altitud GPS como señal inicial con suavizado y umbral mínimo de cambio para reducir ruido.

La arquitectura deja abierta una mejora posterior con DEM/perfil de elevación oficial sin cambiar el contrato del motor.

## 8. Progreso sobre la ruta

El progreso no se calcula como `distancia caminada / distancia de ruta`.

La posición válida se proyecta sobre la `LineString` oficial de la versión fijada de la ruta. El motor calcula:

- punto más próximo sobre la línea;
- distancia acumulada de la línea hasta esa proyección;
- porcentaje de progreso sobre la geometría oficial.

El progreso mostrado al usuario debe evitar retrocesos grandes causados por ruido GPS. Puede conservarse un `maxProgress` visual mientras se mantiene internamente la proyección actual para validación.

## 9. Detección off-route

La salida de ruta se basa en distancia perpendicular al trazado oficial y no en una sola lectura.

Regla V1:

- corredor base aproximado de 30–40 m;
- umbral adaptativo según `accuracyMeters`;
- varias muestras consecutivas fuera del corredor antes de activar el aviso;
- varias muestras válidas dentro del corredor para resolverlo;
- una muestra aislada nunca genera un aviso crítico.

El motor expone estados como:

- `on_route`;
- `uncertain`;
- `off_route`;
- `recovering`.

Los valores exactos de distancia y conteo de muestras se configuran en un objeto de reglas testeable.

## 10. Permisos y ciclo móvil

### Preparar aventura

Antes de crear la sesión se comprueba:

1. permiso de ubicación foreground;
2. permiso background cuando el sistema lo permita;
3. servicio GPS habilitado;
4. paquete offline cuando la ruta lo requiera;
5. batería/estado del dispositivo como advertencia no bloqueante cuando proceda.

No se solicitan permisos de ubicación durante el onboarding general de la app.

### Android

Durante una aventura activa se configura foreground service de ubicación con notificación persistente del tipo:

`Mágina Aventura · Ruta en curso`

El usuario debe entender que la ubicación continúa usándose con la pantalla bloqueada.

### Degradaciones

- sin señal GPS: sesión continúa, UI indica `Buscando señal`;
- precisión pobre: muestra degradada, no necesariamente afecta métricas;
- permiso revocado: snapshot inmediato + aviso crítico;
- batería baja: aviso, no finalización automática;
- app reabierta con sesión activa: rehidratación automática.

## 11. Sincronización posterior

La capa local genera lotes idempotentes:

- metadata de sesión;
- bloques secuenciales de track;
- eventos de cambio de estado;
- snapshot/final summary.

Cada lote lleva una clave idempotente y secuencia para permitir reintentos sin duplicación.

La subida a Supabase no forma parte del camino crítico del GPS: una actividad puede llegar a `FINISHED` localmente sin conexión.

La transición a `VALIDATING` ocurre cuando el backend recibe los datos necesarios.

## 12. UI de aventura activa

La pantalla `adventure/[slug]` deja de ser simulada y pasa a mostrar:

- MapLibre full-screen;
- geometría oficial;
- track realizado en tiempo real;
- posición del usuario;
- progreso de ruta;
- distancia;
- tiempo total;
- tiempo en movimiento;
- desnivel inicial;
- estado GPS;
- estado off-route;
- controles Pausar/Reanudar/Finalizar;
- acceso de seguridad.

No se muestran descubrimientos ficticios. Los hooks visuales de Plan 05 quedan preparados pero sin contenido inventado.

## 13. Testing

### 13.1 Tests unitarios del motor

Casos obligatorios:

- caminar en línea recta;
- pausa y reanudación;
- punto con mala precisión;
- salto GPS imposible;
- timestamps fuera de orden;
- pérdida temporal de señal;
- salida > corredor durante varias muestras;
- una única muestra fuera del corredor no activa alarma;
- regreso al trazado;
- progreso monotónico visual;
- finalización de sesión.

### 13.2 Replay determinista

El motor puede alimentarse con una secuencia grabada/fixture como si fuera GPS en tiempo real. Esto permite reproducir regresiones sin salir al campo.

No se inventan coordenadas de una ruta oficial para demo de producto; los fixtures sintéticos se etiquetan explícitamente como tests.

### 13.3 Integración móvil

Se prueba:

- permisos;
- foreground tracking;
- background tracking;
- persistencia incremental;
- rehidratación;
- UI conectada al motor;
- MapLibre con track realizado.

### 13.4 Prueba física obligatoria

En Android real:

1. iniciar actividad corta;
2. caminar con pantalla encendida;
3. bloquear pantalla;
4. mantener desplazamiento;
5. volver a abrir la app;
6. comprobar continuidad del track;
7. pausar/reanudar;
8. finalizar;
9. comprobar métricas y persistencia offline.

## 14. Criterio de cierre

Este bloque se considera terminado cuando:

- `ACTIVE -> PAUSED -> ACTIVE -> FINISHED` funciona;
- el track persiste incrementalmente;
- una sesión puede recuperarse tras cierre/reapertura;
- no se pierde la actividad por falta de Internet;
- distancia y tiempo no incluyen saltos GPS rechazados;
- off-route requiere evidencia sostenida y se recupera al volver;
- progreso se calcula sobre geometría oficial versionada;
- Android prebuild y configuración background pasan CI;
- tests sintéticos y replay son deterministas;
- una prueba física corta confirma continuidad con pantalla bloqueada.

## 15. Decisiones aprobadas

- Perfil GPS: adaptativo equilibrado.
- Arquitectura: Location Provider -> Activity Engine puro -> persistencia/UI.
- Persistencia: track incremental + snapshots.
- Offline: actividad completa sin red y sync posterior por lotes.
- Ruta: actividad fijada a `geometryVersion`.
- Off-route: corredor adaptativo ~30–40 m + varias muestras consecutivas.
- Background: requerido para experiencia completa; degradación explícita si falta permiso.
- Testing: sintético + replay + Android físico.
