# Roadmap — Game Engine V2

## Fase 0 — Inventario y congelación

Objetivo: saber qué conservar de la app actual.

Entregables:
- inventario de módulos actuales;
- tabla KEEP / ADAPT / REPLACE / REMOVE;
- dependencias actuales;
- flujo real de GPS;
- flujo real de sesión;
- fallos conocidos;
- contratos que ya funcionan;
- APK baseline reproducible.

No modificar funcionalidad durante esta fase salvo correcciones imprescindibles para poder medir.

## Fase 1 — Auditoría open source

Auditar LootDrop, GPScavenger, stephenthedev/scavenger-hunt, ViroReact y Expo GeoPulse.

Para cada proyecto:
- commit/tag inspeccionado;
- licencia;
- compatibilidad comercial;
- tecnología;
- mantenimiento reciente;
- dependencias;
- módulos útiles;
- código potencialmente reutilizable;
- ideas solo conceptuales;
- riesgos;
- decisión ADOPT / ADAPT / STUDY / REJECT.

Crear `OSS_AUDIT.md`.

No copiar código durante la auditoría.

## Fase 2 — Contratos del motor

Definir TypeScript contracts independientes de UI:

- RouteDefinition
- RouteVersion
- CheckpointDefinition
- ChallengeDefinition
- RewardDefinition
- DiscoveryDefinition
- AdventureSession
- AdventureProgress
- LocationSample
- ProximityState
- RouteAssetPack

Añadir fixtures de una mini ruta de QA con 3 checkpoints.

## Fase 3 — Vertical slice sin GPS real

Crear un modo simulador.

Debe permitir:
- cargar ruta QA;
- mover una posición falsa;
- activar radios;
- desbloquear checkpoints;
- resolver un reto;
- recibir recompensa;
- avanzar al siguiente checkpoint;
- guardar y restaurar sesión.

Esta fase debe funcionar en emulador y tests sin salir físicamente al campo.

## Fase 4 — Mapa y geometría

Integrar:
- geometría de ruta;
- posición del usuario;
- checkpoint actual;
- siguientes checkpoints;
- recorrido realizado;
- estados visuales.

Resolver definitivamente el mapa vacío.

Añadir cache/offline de los recursos necesarios para la ruta descargada.

## Fase 5 — GPS real robusto

Conectar el Location Engine.

Validar:
- precisión;
- rechazo de saltos;
- distancia real;
- reloj correcto;
- pausa;
- reanudación;
- bloqueo de pantalla;
- background;
- recuperación de proceso;
- finalización.

Crear pruebas físicas documentadas.

## Fase 6 — Ruta 001 Las Viñas

Construir el primer paquete real.

Contenido mínimo:
- geometría oficial;
- 5–10 checkpoints iniciales;
- historia documentada;
- imágenes;
- discoveries;
- preguntas/retos;
- recompensas;
- fuentes;
- assets.

La ruta debe cargarse desde datos.

## Fase 7 — Inventario, insignias y discoveries

Añadir:
- collectibles;
- insignias;
- XP si se mantiene;
- discoveries encontrados;
- historial de ruta;
- resumen final.

Todo persistente y sincronizable.

## Fase 8 — Supabase y sincronización

Diseñar esquema Postgres/PostGIS.

Requisitos:
- offline-first;
- outbox;
- idempotencia;
- versionado de rutas;
- assets en Storage;
- progreso por usuario;
- migraciones reproducibles.

## Fase 9 — Contenido comercial

Añadir promociones sin contaminar el núcleo.

Modelo:
- negocio;
- promoción;
- ubicación;
- condiciones;
- vigencia;
- recompensa vinculada;
- validación/canje futuro.

No bloquear una ruta porque no exista promoción comercial.

## Fase 10 — AR

Prototipo con ViroReact u otra alternativa aprobada.

Solo para checkpoints seleccionados.

Gate:
- rendimiento aceptable;
- compatibilidad Android;
- fallback sin AR;
- peso de APK controlado.

## Fase 11 — Route Builder / panel

Objetivo final: crear una nueva ruta sin programar.

El editor deberá permitir:
- dibujar/importar geometría;
- colocar checkpoints;
- configurar radios;
- cargar textos e imágenes;
- elegir reto;
- elegir recompensa;
- ordenar narrativa;
- publicar una versión;
- generar pack offline.

## Gate de aceptación V2

No se fusiona en `main` hasta cumplir:
- CI verde;
- tests unitarios del motor;
- tests de persistencia;
- prueba emulador con GPS simulado;
- prueba física Android;
- mapa funcional;
- tiempo y distancia correctos;
- recuperación tras pantalla apagada;
- Las Viñas ejecutable de inicio a fin en modo QA;
- documentación de licencias;
- documentación de arquitectura;
- evidencia visual.
