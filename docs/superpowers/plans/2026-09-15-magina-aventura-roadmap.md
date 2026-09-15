# Mágina Aventura Implementation Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement each plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir Mágina Aventura de extremo a extremo como aplicación móvil de senderismo gamificada, con catálogo premium de rutas, seguimiento GPS, modo aventura geolocalizado, progresión, retos, rankings, recompensas y administración.

**Architecture:** Monorepo con una app móvil Expo/React Native, una app web de administración, paquetes compartidos de dominio/contratos y backend Supabase/PostgreSQL/PostGIS. La app debe funcionar como producto independiente; Mi Olivo y Mi Campo quedan fuera del núcleo y se conectarán únicamente mediante contratos/eventos de recompensa estables.

**Tech Stack:** Expo + React Native + TypeScript, Expo Router, Expo Location/Task Manager, MapLibre React Native, Supabase Auth/Database/Storage/Edge Functions, PostgreSQL + PostGIS, app web de administración, Vitest/Jest, React Native Testing Library, Playwright para Admin, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-15-magina-aventura-product-design.md`

## Global Constraints

- La entrada principal es un catálogo premium de rutas; el modo tipo Pokémon GO solo aparece durante una aventura activa.
- Mágina Aventura debe ser útil sin Mi Olivo ni Mi Campo.
- XP e insignias pertenecen a Mágina Aventura; las aceitunas son unidades transferibles al ecosistema.
- Mi Campo y la lógica visual/evolutiva de Mi Olivo no se implementan en este repositorio.
- Las recompensas con valor externo solo se conceden a actividades verificadas.
- Tracks y ubicación son privados por defecto.
- Bedmar y Garcíez es el territorio piloto; el motor debe ser escalable al resto de Sierra Mágina sin cambiar código de producto.
- El funcionamiento de ruta debe tolerar cobertura deficiente y permitir mapas/route data offline cuando estén preparados.
- No se añade contenido ficticio para aparentar funcionalidad terminada; los fixtures de desarrollo deben estar claramente marcados.

---

## Estrategia de entrega

La especificación completa contiene varios subsistemas independientes. No se implementará como una sola rama gigante. Se divide en ocho planes verticales. Cada plan debe dejar software ejecutable y demostrable antes de iniciar el siguiente.

### Plan 01 — Foundations + diseño visual

**Objetivo demostrable:** prototipo visual navegable de las pantallas fundamentales y monorepo ejecutable con design tokens compartidos.

Pantallas objetivo:

1. Inicio / Rutas.
2. Ficha de ruta.
3. Preparar aventura.
4. Aventura en curso.
5. Descubrimiento desbloqueado.
6. Resumen de aventura.
7. Colecciones.
8. Ranking / Perfil.

Decisiones a cerrar aquí:

- paleta Sierra Mágina (olivo, piedra/caliza, tierra, oro AOVE, cielo);
- tipografía;
- espaciado, radios y elevación;
- cards de ruta;
- HUD de actividad;
- iconografía de Flora, Fauna, Patrimonio, Olivar, Tradiciones y Paisaje;
- estados de descubrimiento: oculto, cercano, disponible, descubierto;
- comportamiento móvil prioritario y adaptación tablet/web.

Criterio de salida: las seis pantallas del flujo principal se pueden recorrer visualmente sin backend y el sistema de diseño está documentado.

---

### Plan 02 — Plataforma base + identidad + modelo geoespacial

**Objetivo demostrable:** usuario puede registrarse/iniciar sesión y consultar desde Supabase una ruta piloto real de Bedmar con geometría PostGIS.

Incluye:

- monorepo definitivo;
- configuración Expo;
- aplicación Admin base;
- Supabase local/remoto;
- Auth;
- perfiles;
- municipios;
- routes / route_versions / route_media;
- geometría LineString/Point PostGIS;
- Storage;
- RLS;
- seed de desarrollo claramente identificado;
- CI: lint, typecheck, unit tests y build.

Criterio de salida: app autenticada + ruta piloto obtenida del backend + CI verde.

---

### Plan 03 — Catálogo y ficha de rutas

**Objetivo demostrable:** experiencia completa antes de caminar: descubrir, filtrar y estudiar una ruta.

Incluye:

- Inicio/Rutas;
- búsqueda;
- filtros por municipio, dificultad, distancia, duración y desnivel;
- favoritos/pendientes;
- ficha de ruta;
- mapa estático/interactivo;
- perfil de elevación;
- fotografías;
- dificultad, km, desnivel, duración y altitud;
- GPX;
- POI/checkpoints visibles;
- seguridad y preparación;
- meteorología como integración desacoplada;
- recompensas potenciales de la ruta.

Criterio de salida: desde la portada se llega a una ficha real y se puede pulsar `Iniciar aventura`.

---

### Plan 04 — Motor GPS + aventura activa + offline

**Objetivo demostrable:** realizar una ruta completa con registro GPS incluso con pantalla bloqueada y finalizar con estadísticas coherentes.

Incluye:

- permisos de ubicación;
- background location;
- estado de actividad persistente;
- track oficial y track realizado;
- distancia;
- tiempo total/en movimiento;
- ritmo/velocidad;
- elevación positiva/negativa;
- altitud;
- progreso sobre la ruta;
- desviación de trazado;
- pausa/reanudación;
- recuperación tras cierre de app;
- paquete offline de mapa + ruta;
- finalización y resumen.

Estados base:

`DRAFT -> ACTIVE -> PAUSED -> FINISHED -> VALIDATING -> VERIFIED | REJECTED`

Criterio de salida: una actividad piloto sobre datos simulados y una prueba física corta registran el track sin perder la sesión.

---

### Plan 05 — Checkpoints + descubrimientos + colecciones

**Objetivo demostrable:** durante una aventura aparecen y se desbloquean descubrimientos reales por proximidad.

Incluye:

- checkpoints obligatorios/opcionales;
- radio de proximidad;
- detección local + confirmación servidor;
- descubrimientos ocultos;
- Flora;
- Fauna;
- Patrimonio;
- Olivar;
- Tradiciones;
- Paisaje;
- rareza;
- animación/modal de descubrimiento;
- álbum/colecciones;
- porcentaje de colección;
- historial de descubrimientos.

Criterio de salida: en la ruta piloto de Bedmar se desbloquea al menos un conjunto real de checkpoints/descubrimientos y queda persistido.

---

### Plan 06 — XP + niveles + insignias + retos + rankings

**Objetivo demostrable:** completar una ruta modifica el perfil de aventurero y los rankings de forma verificable.

Incluye:

- motor de XP configurable;
- niveles;
- achievements/insignias;
- retos diarios/semanales/municipales/temporada;
- temporadas;
- kilómetros y desnivel acumulados;
- municipios/rutas distintas;
- Ranking Senderista;
- Ranking Explorador;
- Ranking Mágina;
- scopes semanal, mensual, temporada e histórico;
- límites contra farmeo repetitivo.

Criterio de salida: una actividad verificada actualiza XP, insignias, reto y ranking con pruebas deterministas.

---

### Plan 07 — Validación, aceitunas e integración externa

**Objetivo demostrable:** una actividad verificada puede producir recompensas auditables sin que Mágina Aventura dependa de Mi Olivo.

Incluye:

- señales antifraude;
- cobertura del track oficial;
- checkpoints alcanzados;
- saltos GPS;
- velocidad imposible;
- precisión insuficiente;
- activity_events;
- reward_ledger;
- integration_outbox;
- idempotencia;
- evento `reward.earned`;
- contrato estable para Mi Olivo;
- reintentos seguros;
- auditoría de por qué se concedió cada recompensa.

Criterio de salida: una actividad `VERIFIED` genera XP/aceitunas/insignias exactamente una vez aunque el consumidor externo se reintente.

---

### Plan 08 — Admin + moderación + prueba de campo + beta

**Objetivo demostrable:** añadir nuevas rutas y contenido sin tocar código y realizar la ruta piloto físicamente en Bedmar.

Admin incluye:

- CRUD de rutas;
- importación GPX;
- editor de geometría;
- checkpoints;
- descubrimientos;
- coleccionables;
- retos;
- insignias;
- temporadas;
- recompensas;
- publicación/despublicación;
- moderación;
- actividad sospechosa;
- auditoría.

Prueba de campo obligatoria:

1. Instalar build real Android.
2. Descargar ruta/mapa.
3. Iniciar aventura en Bedmar.
4. Bloquear el teléfono durante parte del recorrido.
5. Recuperar la app sin perder actividad.
6. Alcanzar checkpoints reales.
7. Desbloquear descubrimientos reales.
8. Salirse deliberadamente de la ruta y comprobar aviso.
9. Finalizar.
10. Validar estadísticas.
11. Confirmar XP/aceitunas/insignias.
12. Confirmar actualización del ranking.

Criterio de cierre V1: el flujo completo se ejecuta físicamente sin intervención manual desde `Iniciar aventura` hasta actividad verificada y recompensada.

---

# Orden de ramas/PR

No se trabajará directamente sobre `main`.

Ramas recomendadas:

- `feat/01-foundations-visual-system`
- `feat/02-platform-auth-geospatial`
- `feat/03-route-catalog-detail`
- `feat/04-gps-adventure-engine`
- `feat/05-discoveries-collections`
- `feat/06-progression-challenges-ranking`
- `feat/07-validation-rewards-integration`
- `feat/08-admin-field-beta`

Cada PR debe permanecer en Draft hasta que su criterio de salida esté verde.

---

# Calidad obligatoria en todos los planes

Cada PR debe comprobar, cuando aplique:

- lint;
- TypeScript;
- unit tests;
- tests de dominio;
- pruebas de componentes;
- build Android/web correspondiente;
- migraciones Supabase reproducibles;
- políticas RLS verificadas;
- tests de integración;
- E2E del flujo modificado;
- accesibilidad básica;
- revisión visual móvil;
- documentación del cambio.

No se inicia el siguiente bloque por comodidad si el bloque anterior deja roto el recorrido principal.

---

# Primer vertical de producto

El primer vertical completo será **Bedmar y Garcíez**, con una ruta piloto que permita validar simultáneamente:

`catálogo -> ficha -> preparación -> GPS -> checkpoint -> descubrimiento -> final -> validación -> XP -> aceitunas -> insignia -> ranking`

El contenido se diseñará de forma data-driven para que después añadir Jimena, Albanchez, Jódar, Torres, Huelma, Cambil y el resto de Sierra Mágina sea principalmente carga/curación de datos y no nueva programación.

---

# Próximo plan a ejecutar

El siguiente documento debe ser:

`docs/superpowers/plans/2026-09-15-01-foundations-visual-system.md`

Ese plan cubrirá el sistema visual y la estructura inicial del monorepo, y será el primer bloque que se implementará.