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
- El funcionamiento de ruta debe tolerar cobertura deficiente. En aventuras reales publicadas, el paquete offline verificado será requisito previo para iniciar: mapa, track/geometría, AdventureDefinition pinned, checkpoints/discoveries, seguridad y assets documentales necesarios deben quedar disponibles sin cobertura.
- La meteorología es dinámica y queda fuera del paquete inmutable: se guarda el último snapshot disponible con hora de actualización y estado de caducidad; nunca se presenta una previsión antigua como actual.
- Los descubrimientos deben priorizar aprender, explorar y disfrutar: el producto no se limita a registrar rutas, sino que enseña territorio, patrimonio, naturaleza, olivar y cultura mediante contenido editorial desbloqueable.
- El motor y la UI son data-driven. Cada ruta tendrá contenido personalizado y curado, pero añadir una nueva ruta no debe exigir código específico de producto.
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
- meteorología específica de la ruta como integración desacoplada: temperatura, precipitación, viento/rachas, sensación térmica y avisos relevantes, siempre con timestamp visible;
- resumen previo "Qué vas a encontrar": número de checkpoints, discoveries y categorías, ocultando coordenadas/contenido cuando forme parte del misterio;
- dossier previo de seguridad, acceso, equipamiento, agua, cobertura y puntos relevantes;
- estado y tamaño del paquete offline integral;
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
- paquete offline integral y versionado: mapa PMTiles, GPX/track, geometría, AdventureDefinition pinned, checkpoints/discoveries, seguridad, contenido documental y assets esenciales;
- para rutas reales publicadas, gate de inicio que exige paquete offline ready y versión compatible; fixtures DEV pueden mantener excepción explícita;
- conservación del último snapshot meteorológico descargado para consulta offline, indicando claramente cuándo fue actualizado;
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
- ficha documental desbloqueable por discovery: título, resumen, historia, curiosidades, patrimonio/naturaleza, imágenes y fuentes; audio u otros medios cuando exista contenido editorial aprobado;
- descubrimientos secretos con pistas progresivas: no exponer coordenadas exactas ni contenido completo antes de desbloquearlos salvo decisión editorial explícita;
- álbum/colecciones;
- porcentaje de colección;
- historial de descubrimientos;
- persistencia del contenido desbloqueado para consultarlo después de la ruta.

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
- auditoría;
- edición del dossier previo de ruta, seguridad, acceso y equipamiento;
- edición/versionado de fichas documentales de checkpoints/discoveries y sus assets;
- control editorial de qué discoveries son visibles, ocultos o revelados por pista;
- configuración de metadatos meteorológicos de la ruta (punto/área de referencia y política de frescura);
- composición y publicación del paquete offline integral.

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

# MA-001 — Ruta patrón de la beta

MA-001 será el vertical canónico para convertir el motor ya validado en una experiencia completa de Mágina Aventura. No se considerará cerrada la beta por disponer solo de tracking GPS: debe cubrir preparación, exploración, aprendizaje, seguridad, uso offline, finalización y memoria posterior de la aventura.

## Experiencia antes de salir

La ficha de MA-001 debe permitir decidir y preparar la salida sin consultar otra aplicación:

- hero/fotografía e identidad de la ruta;
- municipio, dificultad, distancia, duración, desnivel y altitudes;
- mapa interactivo, track oficial y perfil de elevación;
- accesos, aparcamiento/inicio, tipo de firme, agua y cobertura cuando exista información verificada;
- seguridad, equipamiento recomendado y avisos activos;
- meteorología contextual a la ruta con hora de actualización;
- resumen "Qué vas a encontrar" con categorías y número de objetivos sin estropear los secretos;
- comunidad pública asociada a la ruta cuando el módulo esté integrado;
- descarga/actualización del paquete offline y confirmación "Lista para salir".

## Paquete offline de aventura

La acción "Descargar aventura" debe preparar una unidad versionada y verificable, no únicamente teselas de mapa. Debe contener, según disponibilidad editorial:

- mapa PMTiles;
- GPX/track y geometría oficial;
- AdventureDefinition y versión de geometría pinned;
- checkpoints, discoveries, prerequisitos y radios de activación;
- dossier de seguridad y preparación;
- fichas documentales y assets necesarios para los descubrimientos;
- imágenes/medios imprescindibles para el recorrido;
- hashes/versiones suficientes para detectar un paquete stale.

Una ruta real publicada no debe comenzar si el paquete requerido no está listo o es incompatible. La app debe permitir actualizarlo antes de salir. La meteorología no forma parte del contenido inmutable: se cachea el último snapshot con timestamp y estado de frescura.

## Experiencia durante la aventura

El mapa sigue siendo la superficie protagonista. El usuario debe poder consultar sin romper la sesión:

- progreso, distancia, tiempo, desnivel y estado GPS;
- siguiente objetivo y progreso de checkpoints/discoveries;
- estado offline y guardado local;
- seguridad y avisos activos ya descargados;
- último snapshot meteorológico y, con conectividad, actualización bajo demanda o automática prudente;
- secciones rápidas "Ruta", "Objetivos", "Seguridad", "Tiempo" y "Mi progreso".

Los discoveries no son simples pins. Deben convertir el recorrido en exploración guiada. Un discovery oculto puede mostrarse como objetivo misterioso o pista sin revelar su posición exacta. Al validarse, se desbloquea una experiencia narrativa/documental.

## Ficha documental de cada descubrimiento

Cada discovery real de MA-001 se curará individualmente. La plantilla editorial debe admitir:

- título y subtítulo;
- categoría: flora, fauna, patrimonio, olivar, tradición o paisaje;
- texto breve de celebración;
- explicación ampliada e historia/contexto;
- curiosidades y claves para observar el lugar;
- galería de imágenes y, opcionalmente, audio/vídeo/escena 3D;
- fuentes y autoría/procedencia del contenido;
- nivel de visibilidad previo: visible, pista, oculto;
- relación con otros discoveries/misiones;
- información de seguridad específica si aplica.

El contenido desbloqueado queda disponible posteriormente en la colección del usuario.

## Experiencia después de la ruta

El resumen se convierte en "Diario de aventura", no únicamente en una tabla de métricas. Debe incluir:

- mapa del track realmente recorrido;
- distancia, tiempo, desnivel y puntos GPS;
- checkpoints y discoveries completados;
- discoveries no encontrados mostrados sin revelar necesariamente la solución;
- fichas documentales desbloqueadas;
- fotografías del usuario cuando Comunidad esté integrada;
- recompensas/insignias solo cuando hayan sido verificadas por el backend;
- posibilidad futura de compartir la experiencia con la Comunidad.

## Gate de MA-001 Beta

MA-001 supera su gate cuando una persona puede, en un Android real: estudiar la ruta, consultar tiempo y seguridad, descargar la aventura completa, desplazarse a la salida, completar el recorrido con cobertura deficiente, desbloquear contenido real, pausar/recuperar la sesión, finalizar y revisar después su diario/colección sin pérdida ni datos inventados.

## Escalado a nuevas rutas

MA-001 define la plantilla. Las siguientes rutas se personalizan una a una en contenido, track, seguridad, checkpoints, discoveries, narrativa, fotografías y documentación, pero reutilizan el mismo motor, UI, esquema de datos, Admin y pipeline offline. El objetivo es que crear MA-002, MA-003 y siguientes sea principalmente **curación editorial + carga/validación geoespacial + prueba de campo**, no desarrollo de nuevas pantallas o lógica específica.

## Secuencia posterior al hardening actual

1. Cerrar Fase 4C y prueba Android física del motor actual.
2. Integrar el gate de paquete offline integral para rutas reales.
3. Implementar el modelo editorial/documental de discovery y colección persistente.
4. Integrar meteorología contextual y cacheada con timestamp.
5. Preparar MA-001 real en Admin: track, seguridad, objetivos, contenido y assets.
6. Ejecutar prueba de campo MA-001 y corregir UX/rendimiento.
7. Integrar Comunidad/Admin en la línea canónica y habilitar fotografías/comentarios moderados.
8. Congelar la plantilla de ruta y usarla para escalar al catálogo.

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