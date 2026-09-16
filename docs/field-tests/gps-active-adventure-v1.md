# Mágina Aventura — GPS Active Adventure V1 · prueba física Android

Esta prueba es obligatoria antes de declarar validado el seguimiento GPS en segundo plano. Debe hacerse con una build nativa/de desarrollo instalada en un Android físico; Expo Go no es válido para esta evidencia.

## Identificación

- Build SHA:
- APK / build identifier:
- Dispositivo:
- Versión Android:
- Ruta o zona segura de prueba:
- Fecha:
- Hora de inicio:
- Persona que realiza la prueba:

## Precondiciones

- [ ] Instalación limpia o estado de permisos documentado.
- [ ] Ubicación del teléfono activada.
- [ ] Permiso de ubicación precisa concedido.
- [ ] Permiso de ubicación en segundo plano / “Permitir siempre” concedido.
- [ ] Notificación del servicio de ubicación visible al iniciar la aventura.
- [ ] Batería suficiente para completar la prueba.
- [ ] Se conoce un recorrido corto y seguro; no hace falta usar una ruta oficial publicada.

## Flujo obligatorio

- [ ] Iniciar una aventura desde Preparación: PASS / FAIL
- [ ] Primera posición GPS válida aparece en la pantalla: PASS / FAIL
- [ ] El track visible crece al caminar: PASS / FAIL
- [ ] Distancia y tiempo cambian usando datos reales: PASS / FAIL
- [ ] Bloquear la pantalla durante **al menos 5 minutos**: PASS / FAIL
- [ ] Track continuo después de desbloquear: PASS / FAIL
- [ ] La notificación de seguimiento permanece durante el bloqueo: PASS / FAIL
- [ ] Pausar: PASS / FAIL
- [ ] Confirmar que el tracking no sigue sumando durante la pausa: PASS / FAIL
- [ ] Reanudar: PASS / FAIL
- [ ] Confirmar que vuelve a registrar posiciones: PASS / FAIL
- [ ] Forzar cierre de la app durante una actividad activa: PASS / FAIL
- [ ] Reabrir y recuperar la misma actividad sin crear un duplicado: PASS / FAIL
- [ ] Continuar caminando tras la recuperación: PASS / FAIL
- [ ] Activar modo avión / quedar sin datos durante parte de la actividad: PASS / FAIL
- [ ] El registro GPS continúa sin conexión: PASS / FAIL
- [ ] Finalizar sin conexión: PASS / FAIL
- [ ] Confirmación de finalización mostrada: PASS / FAIL
- [ ] Resumen final persiste: PASS / FAIL
- [ ] El track queda en la cola local pendiente de sincronización: PASS / FAIL

## Integridad y seguridad

- [ ] Un punto de mala precisión no produce un salto evidente de distancia: PASS / FAIL
- [ ] Un salto GPS imposible no infla la distancia: PASS / FAIL
- [ ] Si existe track oficial verificado, salida sostenida de la ruta genera estado fuera de ruta: PASS / FAIL / N/A
- [ ] Si no existe track oficial, la app **no** afirma “En ruta” ni inventa porcentaje de progreso: PASS / FAIL
- [ ] Si el permiso de segundo plano no está concedido, la app no afirma que funcionará con pantalla bloqueada: PASS / FAIL

## Evidencias

- Captura de Preparación con permisos:
- Captura de aventura antes de bloquear:
- Captura tras >=5 min con pantalla bloqueada:
- Captura tras recuperación de cierre forzado:
- Captura en modo avión / sin datos:
- Captura de resumen final:
- Track diagnóstico exportado / número de puntos:
- Log o notas relevantes:

## Resultado

- Resultado global: PASS / FAIL
- Incidencias encontradas:
- Correcciones necesarias:
- Nueva prueba requerida: SÍ / NO

> No marcar esta prueba como PASS por CI, emulador o pruebas unitarias. La evidencia física Android es un gate independiente. Tampoco afirmar validación de una ruta concreta de Sierra Mágina si la prueba se realizó en otra zona segura.
