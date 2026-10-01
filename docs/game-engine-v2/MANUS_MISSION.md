# MANUS — Mission Brief: Game Engine V2

## Tu misión

Trabaja exclusivamente sobre:

`feat/game-engine-v2-open-source-foundation`

Tu objetivo no es añadir pantallas sueltas. Tu objetivo es preparar el nuevo motor escalable de Mágina Aventura.

Lee primero:
1. `docs/game-engine-v2/README.md`
2. `docs/game-engine-v2/ROADMAP.md`

## Prioridad inmediata

Ejecuta Fase 0 y Fase 1 antes de programar el nuevo motor.

### Tarea A — Auditoría de la app actual

Entrega un documento:

`docs/game-engine-v2/CURRENT_APP_AUDIT.md`

Debe incluir una tabla por módulo:

| módulo | archivo(s) | función | estado | decisión | razón |
|---|---|---|---|---|---|
| ejemplo | location runtime | GPS | estable/inestable | KEEP/ADAPT/REPLACE | ... |

Audita como mínimo:
- navegación;
- pantalla Home;
- exploración/mapa;
- preparación de ruta;
- sesión de aventura;
- GPS;
- cronómetro;
- distancia;
- pausa/reanudación;
- persistencia;
- background;
- checkpoints;
- contenido;
- Supabase;
- tests;
- workflows;
- build Android.

Busca específicamente la causa estructural de:
- mapa vacío;
- ausencia de checkpoint activo cuando debería existir;
- saltos aparentes de tiempo;
- incrementos de distancia anómalos;
- cualquier multiplicador, mock o aceleración QA activa.

No cambies todavía esos módulos salvo que sea necesario para poder reproducir y documentar el problema.

### Tarea B — Auditoría OSS

Inspecciona:

- https://github.com/LootDropX/Solana-Mobile
- https://github.com/StoutsHonor/GP-Scavenger
- https://github.com/stephenthedev/scavenger-hunt
- https://github.com/ReactVision/viro
- https://github.com/ramon3198/expo-geopulse

Crea:

`docs/game-engine-v2/OSS_AUDIT.md`

Para cada uno registra:
- URL;
- commit/tag exacto;
- fecha de inspección;
- LICENSE exacta encontrada;
- compatibilidad con uso comercial;
- obligación de atribución;
- stack;
- partes útiles;
- dificultad de integración;
- riesgos;
- decisión ADOPT / ADAPT / STUDY / REJECT.

IMPORTANTE:
- No asumas una licencia por lo que diga un README.
- Abre el archivo LICENSE/COPYING real.
- Si falta, marca UNKNOWN y no copies código.
- No pegues código externo en nuestra rama durante esta fase.

### Tarea C — Mapa de arquitectura V2

Crea:

`docs/game-engine-v2/ARCHITECTURE.md`

Debe definir:
- Game Engine;
- Location Engine;
- Map Layer;
- Content Engine;
- Challenge Engine;
- Reward Engine;
- Inventory;
- Offline storage;
- Supabase sync;
- Route Pack.

Incluye diagrama Mermaid.

### Tarea D — Primer contrato de datos

Después de A+B+C y solo si no hay bloqueo, crea contratos TypeScript mínimos para:
- RouteDefinition;
- CheckpointDefinition;
- ChallengeDefinition;
- RewardDefinition;
- AdventureSession;
- AdventureProgress.

No conectes todavía UI real.

Añade una fixture llamada algo equivalente a:
`qa-three-checkpoints`

con tres checkpoints virtuales para poder probar proximidad sin salir al campo.

### Tarea E — Pruebas

Crea tests para:
- checkpoint bloqueado;
- entrada en radio;
- desbloqueo;
- reto completado;
- recompensa concedida una sola vez;
- avance al siguiente checkpoint;
- persistencia/restauración;
- reanudación sin acelerar tiempo.

## Forma de trabajar

- Commits pequeños y descriptivos.
- No trabajar directamente sobre `main`.
- No hacer merge.
- No borrar arquitectura anterior todavía.
- No reescribir UI por estética.
- No meter AR todavía.
- No meter promociones todavía.
- No añadir nuevas rutas todavía.
- No esconder errores con mocks.
- Toda suposición debe quedar escrita.

## Entrega inicial esperada

La primera entrega de Manus debe contener únicamente:
1. CURRENT_APP_AUDIT.md
2. OSS_AUDIT.md
3. ARCHITECTURE.md
4. propuesta concreta de qué módulos propios conservar;
5. propuesta concreta de qué patrón open source aprovechar;
6. lista de bloqueos;
7. plan de implementación de Fase 2 y Fase 3.

Solo después se empieza a mover código del motor.

## Criterio rector

Si una Ruta 002 requiere cambiar el código del motor para poder existir, la arquitectura todavía no es suficientemente escalable.
