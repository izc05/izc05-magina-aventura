# Mágina Aventura — RC1 Canon · Sección 10 — Beta real y calidad de producción

Status: **APPROVED / LOCKED CANON**  
Date: 2026-09-17  
Owner rule: **No modificar salvo decisión explícita del propietario del producto. Todo cambio futuro debe quedar versionado y justificado; nunca sobrescrito silenciosamente.**

## 1. Principio de calidad

Que compile no significa que esté listo para caminar por la montaña.

Un candidato beta requiere simultáneamente:

- validación digital: CI, tests, compilación, migraciones, seguridad y contratos;
- validación física: Android real, GPS, pantalla bloqueada, offline, recuperación, batería y comportamiento de campo.

Ninguna prueba automatizada puede sustituir una evidencia física que el gate declare manual.

## 2. Candidato exacto

Toda evidencia de beta pertenece a un candidato identificable por SHA/build y, cuando aplique, por versiones de backend, esquema y catálogo.

Si cambia el candidato, una evidencia anterior sólo sigue siendo válida si el gate permite expresamente su reutilización. No se acepta evidencia de otro SHA por conveniencia.

## 3. Estados de gates

Estados canónicos:

- `READY`: evidencia suficiente;
- `BLOCKED`: existe un fallo que impide avanzar;
- `MANUAL`: necesita evidencia humana/real pendiente;
- `NOT_APPLICABLE`: el gate no aplica al perfil de candidato.

La evaluación final debe ser determinista y explicar qué impide llegar a READY.

## 4. Gates automáticos mínimos

Antes de cualquier beta cerrada deben verificarse, como mínimo:

- instalación reproducible de dependencias y lockfile coherente;
- TypeScript/typecheck;
- unit/integration tests del dominio y aplicaciones;
- límites entre paquetes;
- Android Expo prebuild;
- Android release build instalable;
- `supabase db reset` desde cero;
- migraciones completas;
- pgTAP/RLS/RPC/grants y contratos de seguridad;
- contratos de paquetes offline, sincronización e idempotencia;
- smoke tests de los flujos que puedan automatizarse.

## 5. Seguridad funcional

Además de SQL/tests, staging debe demostrar que:

- un usuario normal no puede elevarse a Admin;
- un usuario no puede leer datos privados de otro fuera de las políticas autorizadas;
- ni móvil ni Admin reciben `service_role`/secret keys;
- un cliente normal no puede alterar saldo, ledger, estado de verificación, roles o campos de moderación protegidos;
- las vistas/payloads públicos no exponen coordenadas sensibles por accidente.

## 6. Android físico obligatorio

El gate GPS físico es manual y obligatorio. La prueba debe cubrir como mínimo:

- inicio desde Preparación;
- primera posición válida;
- track y métricas reales;
- pantalla bloqueada durante al menos 5 minutos;
- continuidad al desbloquear;
- pausa/reanudación;
- cierre forzado y recuperación de la misma actividad sin duplicado;
- tramo sin datos / modo avión;
- continuación del registro GPS sin conexión;
- finalización offline;
- persistencia del resumen;
- cola de sincronización posterior;
- rechazo/filtrado de puntos de mala precisión o saltos imposibles;
- salida de ruta sólo cuando existe geometría oficial/verificada;
- comportamiento honesto cuando no existe geometría verificable.

Expo Go, CI y emuladores no satisfacen este gate.

## 7. Offline Adventure Test

Un candidato beta debe superar una aventura preparada online y ejecutada sin conectividad incluyendo:

- apertura del paquete descargado;
- mapa y geometría;
- GPS y track;
- métricas;
- checkpoints/descubrimientos soportados offline;
- pausa/reanudación;
- finalización;
- cierre/reapertura;
- consulta del resumen;
- posterior sincronización sin duplicados.

## 8. Red degradada e idempotencia

Probar transiciones entre conectividad buena, mala y nula. Timeouts y reintentos no pueden duplicar:

- actividades;
- descubrimientos;
- XP;
- insignias;
- retos;
- rankings;
- recompensas;
- reservas/canjes.

## 9. Calidad GPS

Se prueban secuencias con precisión buena, mediocre, puntos imposibles y recuperación. Una muestra errónea no puede inflar significativamente distancia/progreso ni conceder un resultado protegido por sí sola.

Los bugs GPS reales relevantes deben poder convertirse en fixtures/replays sanitizados para regresión automática.

## 10. Batería, temperatura y sesiones largas

Antes de ampliar beta deben recogerse evidencias reales de consumo por dispositivo/Android/duración. No se fija un presupuesto arbitrario antes de medir.

Las sesiones largas deben observar:

- consumo de batería;
- CPU/temperatura;
- crecimiento de memoria;
- estabilidad de MapLibre;
- crecimiento/uso de SQLite;
- frecuencia de render/tareas;
- continuidad de tracking.

Modo ahorro nunca desactiva silenciosamente el tracking crítico.

## 11. Paquetes offline

Probar:

- descarga completa;
- interrupción y recuperación;
- versión obsoleta;
- actualización parcial/versionada;
- borrado consciente;
- espacio insuficiente;
- integridad/checksum cuando aplique.

No mezclar silenciosamente geometría, mapa, checkpoints o contenido de versiones incompatibles.

Los datos GPS operativos no pueden borrarse para hacer espacio como si fueran caché.

## 12. Recuperación Android

Probar cierre de UI/proceso y escenarios de reinicio aplicables. La app debe recuperar exactamente lo persistido y nunca inventar continuidad que Android no haya proporcionado.

## 13. Clima y datos externos

Probar proveedor OK, lento, error, snapshot antiguo y ausencia de conexión. La UI distingue claramente:

- actualizado;
- cacheado;
- desactualizado;
- no disponible.

Un fallo del proveedor nunca se transforma en una previsión inventada.

## 14. Cierres y seguridad de ruta

Un cierre/restricción oficial recibido después de descargar una aventura debe poder bloquear nuevos inicios cuando el dispositivo se actualice.

Cuando el teléfono use un snapshot antiguo, muestra la fecha de la última comprobación; no afirma que una ruta esté abierta si sólo dispone de información desactualizada.

## 15. Comunidad y privacidad

Beta debe comprobar publicación/lectura/moderación de fotos, comentarios, reseñas, incidencias y reportes, con especial atención a:

- RLS;
- coordenadas exactas;
- contenido sensible;
- borrado lógico/moderación;
- separación oficial/comunidad.

## 16. Progresión y recompensas

Una actividad verificada conocida debe generar un resultado determinista. Repetir la misma petición no modifica de nuevo XP, estadísticas, badges, retos o rankings.

Antes de habilitar recompensas físicas se prueban doble petición, doble tap, QR repetido, reserva expirada, cancelación, stock cero y saldo insuficiente.

Las recompensas físicas pueden mantenerse con feature flag OFF sin bloquear el núcleo de RC1.

## 17. Admin-to-Mobile smoke test

Flujo obligatorio en staging:

`crear/editar aventura -> importar/validar GPX -> configurar descubrimiento/media -> review -> publicar -> móvil recibe versión -> aplicar cierre temporal -> móvil bloquea inicio -> reabrir -> móvil vuelve a reflejar disponibilidad`.

Demuestra que el producto puede evolucionar desde Admin sin recompilar la APK cuando sólo cambia contenido/configuración soportada.

## 18. Crash reporting y observabilidad

Antes de beta ampliada debe existir observabilidad técnica suficiente para conocer versión, Android/modelo, contexto técnico y stack trace, minimizando datos personales.

No se adjuntan por defecto tracks GPS completos, fotos privadas o mensajes a un crash report.

Métricas de beta priorizadas:

- crash-free sessions;
- errores de sincronización;
- fallos de paquetes offline;
- recuperaciones de actividad;
- GPS degradado;
- batería;
- fallos/latencia de servicios críticos.

## 19. Staging, producción y rollback

Flujo deseado:

`branch -> CI -> staging -> smoke/manual field evidence -> candidate READY -> closed beta/production progression`.

Debe existir estrategia de rollback o desactivación para:

- código/app;
- feature flags;
- contenido versionado;
- mapas/assets;
- migraciones y cambios de base de datos mediante procedimientos seguros.

Preferir migraciones compatibles durante transiciones frente a operaciones destructivas improvisadas.

## 20. Despliegue beta progresivo

Secuencia recomendada:

`equipo interno -> 2–5 testers -> 10–20 testers -> beta ampliada`.

Los testers de campo son obligatorios para validar el corazón del producto. Pruebas domésticas cubren UI/auth, pero no sustituyen montaña/GPS/offline.

## 21. Readiness report

Cada candidate debe producir un estado legible como:

- CI: READY/BLOCKED;
- DB reset: READY/BLOCKED;
- security: READY/BLOCKED;
- Android release: READY/BLOCKED;
- offline: READY/BLOCKED/MANUAL;
- Admin smoke: READY/BLOCKED/MANUAL;
- GPS physical: MANUAL/READY;
- battery field: MANUAL/READY;
- staging smoke: MANUAL/READY;
- deferred features: NOT_APPLICABLE.

Resultado final sólo es `READY FOR CLOSED BETA` cuando todos los gates obligatorios del perfil están satisfechos.

## 22. Reglas canónicas bloqueadas

1. **CI verde no equivale a beta lista.**
2. **Toda evidencia pertenece a un gate y a un candidato concreto.**
3. **Las pruebas físicas no pueden sustituirse por CI.**
4. **GPS, offline, recuperación y batería son calidad crítica, no extras.**
5. **Un RC debe poder explicar por qué está READY, BLOCKED o MANUAL.**
6. **Funciones secundarias pueden permanecer tras feature flags sin bloquear el núcleo.**
7. **La beta se amplía progresivamente con evidencia real.**
8. **No se falsea disponibilidad, seguridad, GPS, clima ni progreso para superar un gate.**
9. **Cualquier cambio a este canon requiere decisión explícita del propietario y queda versionado.**
