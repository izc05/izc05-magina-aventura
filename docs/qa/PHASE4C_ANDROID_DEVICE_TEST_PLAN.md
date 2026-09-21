# Fase 4C — Protocolo QA Android pre-device

**Rama objetivo:** `feat/adventure-engine-v2`  
**Alcance:** Adventure Engine v2 y la interfaz Android aprobada hasta Fase 4B.  
**Contenido permitido:** únicamente la aventura sintética `dev-adventure-engine-test` en una build Development.  
**Contenido prohibido:** MA-001, Cuadros, Bedmar y cualquier contenido editorial real.

## Objetivo

Este protocolo valida en un Android físico que el pipeline canónico funciona fuera de Vitest: proveedor de ubicación, normalización, Activity Engine, Exploration Engine, inbox SQLite, recovery y UI. No valida nuevas funcionalidades de producto ni concede recompensas reales.

## Preparación

Usar un dispositivo Android físico identificado con fabricante, modelo, versión Android, nivel de parche y espacio libre. Registrar el SHA de la build instalada y conservar el APK Debug generado por CI. La prueba debe realizarse con una cuenta o entorno de prueba, sin datos reales de rutas.

Antes de comenzar, comprobar que la build muestra `DEV ONLY · TEST DATA` y la ruta `Adventure Engine v2 · TEST DATA`. Si aparece MA-001, Cuadros, Bedmar o contenido no sintético, detener la prueba y registrar un bloqueo de release.

## Instalación y arranque

1. Instalar el APK Debug mediante `adb install -r <apk>` o el mecanismo corporativo equivalente.
2. Registrar `adb shell getprop ro.build.version.release`, modelo y hora de inicio.
3. Abrir la aplicación y completar onboarding si aparece.
4. Capturar la pantalla de Inicio mostrando el bloque `DEV ONLY · TEST DATA`.
5. Abrir la aventura sintética y capturar el detalle de ruta. Verificar que la etiqueta de datos de desarrollo es visible y que el mapa no afirma ser cartografía real.

## Permisos y GPS

1. Desde Preparación, registrar el estado inicial de servicios de ubicación.
2. Conceder ubicación foreground.
3. Probar foreground-only denegando background. La app debe permitir continuar con advertencia de modo limitado y no debe afirmar seguimiento continuo con pantalla bloqueada.
4. Repetir, si es posible, concediendo background. La pantalla debe mostrar el estado correspondiente sin inventar precisión, distancia ni geometría.
5. Apagar temporalmente servicios de ubicación y comprobar el mensaje de bloqueo. No iniciar hasta documentar el resultado.

## Inicio y AdventureDefinition pinned

1. Pulsar `Iniciar aventura`.
2. Confirmar que la actividad pasa a estado activo y que la interfaz muestra valores desconocidos (`—`) hasta recibir datos suficientes, no ceros inventados.
3. Capturar la pantalla inicial del HUD.
4. Registrar en logs el slug, versión, routeId y geometryVersion pinned. No editar la definición durante la actividad.
5. Si se sustituye el paquete por una versión distinta, recovery debe rechazar la definición exacta no coincidente.

## Checkpoints y discovery

En la build Development, usar únicamente los controles explícitos del harness:

1. Pulsar `CP1`. Verificar desbloqueo único y overlay `CHECKPOINT ALCANZADO`.
2. Pulsar `CP1` de nuevo. No debe aparecer un segundo unlock ni duplicarse la observación.
3. Pulsar `CP2`. Verificar que el prerrequisito de CP1 se respeta.
4. Pulsar `DISC`. Verificar overlay `NUEVO DESCUBRIMIENTO`, progreso y persistencia local.
5. Pulsar `CP3`. Verificar que el prerrequisito del discovery se respeta.
6. Confirmar en todo momento que alcanzar un objetivo no finaliza la actividad.
7. Reabrir la pantalla o provocar una recreación de Activity. El overlay no debe aparecer sólo por hidratar una observación existente; únicamente aparece ante una observación nueva.

## Pausa, background y recovery

1. Pulsar `Pausar`. Verificar el banner `PAUSA · PROGRESO PROTEGIDO` y que el GPS aparece detenido.
2. Capturar pantalla del banner y conservar logs.
3. Conceder o denegar background según el caso de prueba y bloquear la pantalla durante al menos cinco minutos.
4. Desbloquear y volver a la aplicación. Verificar que el estado, track y exploración permanecen coherentes.
5. Forzar cierre de la aplicación desde Ajustes o `adb shell am force-stop <package>`.
6. Abrir de nuevo la aplicación. Verificar recovery de la misma actividad y de la misma definición versionada.
7. Pulsar `Reanudar` y continuar con el objetivo pendiente.
8. Si la red está disponible, apagarla antes de emitir posiciones. El track y la exploración deben seguir guardándose localmente.
9. Encender la red al final y comprobar que no se presenta una falsa confirmación de sincronización o recompensa.

## Finalización y resumen

1. Completar CP3.
2. Pulsar `Finalizar` explícitamente y confirmar el diálogo.
3. Verificar estado `FINISHED` y que el resumen navega correctamente.
4. Confirmar métricas reales de distancia, tiempo, desnivel y puntos GPS. Si una métrica no existe, debe mostrarse como desconocida, nunca como un cero que sugiera medición.
5. Verificar conteo de checkpoints/discoveries y el último evento registrado.
6. Confirmar que XP, aceitunas, inventario y recompensas permanecen pendientes de validación backend.
7. Forzar un segundo reopening después de cierre. La actividad finalizada no debe reanudarse como activa ni aceptar recovery como si estuviese pendiente.

## Evidencias obligatorias

| Evidencia | Qué conservar | Criterio |
|---|---|---|
| Identidad de build | SHA, nombre de APK, fecha, versión Android | Permite reproducir exactamente la prueba |
| Inicio DEV | Screenshot del bloque `DEV ONLY · TEST DATA` | No aparece en release/producción |
| Detalle y preparación | Screenshots de etiqueta TEST DATA, mapa, permisos y modo limitado | La UI no sobredeclara datos o capacidades |
| HUD | Screenshots antes y después de cada objetivo | Progreso conectado al runtime real |
| Checkpoint 1 duplicado | Screenshot/log de primera y segunda pulsación | Un solo unlock y observación única |
| Discovery | Screenshot del overlay y HUD posterior | Discovery provisional, sin recompensa local |
| Pausa | Screenshot del banner protegido | El progreso queda visible como guardado |
| Recovery | Screenshot después de force-stop/reopening | Misma actividad, versión y exploración |
| Track | Export o consulta controlada de track SQLite | Secuencias monotónicas y sin muestras duplicadas |
| SQLite | Copia autorizada de base o dump de tablas de actividad/exploración | Snapshot, binding, estado y observaciones coherentes |
| Logs | `adb logcat` acotado a la ventana de prueba | Errores, permisos, recovery y finish trazables |
| Resumen | Screenshot de métricas y objetivos | Valores reales o desconocidos honestos |
| Errores | Captura, timestamp, pasos y estado previo | Toda anomalía reproducible |

## Comandos de apoyo

```bash
adb devices
adb shell getprop ro.build.version.release
adb shell getprop ro.product.model
adb logcat -c
adb logcat -v threadtime > phase4c-logcat.txt
adb shell am force-stop <package-name>
adb shell monkey -p <package-name> 1
adb bugreport phase4c-bugreport.zip
```

No extraer ni compartir datos personales del dispositivo. Redactar tokens, identificadores de usuario y cualquier ubicación que no pertenezca al circuito sintético.

## Bloqueadores de release

Detener la prueba si se produce cualquiera de estos casos: contenido sintético visible en una build Release; contenido real introducido como fixture; desbloqueo duplicado; overlay mostrado sólo por recovery; actividad finalizada automáticamente por un objetivo; recovery con otra versión de `AdventureDefinition`; pérdida de track o exploración tras force-stop; métricas fabricadas cuando no hay datos; permisos background afirmados cuando fueron denegados; o recompensa local concedida sin validación servidor.

## Resultado

El resultado de la prueba debe registrar `PASS`, `PASS WITH RISKS` o `BLOCKED`, junto con modelo Android, SHA, pasos ejecutados, evidencias y riesgos pendientes. La aprobación de Fase 4C no sustituye pruebas prolongadas de batería, restricciones OEM, GPS en movimiento real ni validación backend.
