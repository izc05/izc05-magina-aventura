# MANUS-06 — Auditoría visual/funcional e inventario DEMO

**Fecha:** 2026-09-29  
**Snapshot auditado:** `feat/game-kit-foundation` en `a67fd8d` (base de PR #75; incluye el Game Kit Playground).  
**Método/evidencia:** revisión estática del código y estilos. No se tuvo un emulador, BrowserStack ni Android físico disponible en esta ejecución; por tanto, no se afirman capturas ni validación de píxeles, safe areas, truncado o touch targets en un dispositivo. Las observaciones de presentación que dependen del render real están marcadas como riesgos a verificar.

## Resumen ejecutivo

- **P0:** no se identifica un bloqueo técnico absoluto a partir del código inspeccionado.
- **P1 antes de beta:** el contenido de desarrollo puede parecer factual/seguro para caminar; los números de aventura/resumen/pasaporte son hardcoded e incompatibles entre sí; la pantalla de pruebas de mapas está expuesta desde Home y muestra textos de “oficial/verificado”.
- **P2:** controles que no hacen nada, pausa/fin que no pausa ni finaliza una sesión, estado vacío/error/loading ausente o ambiguo, retorno/back con stack confuso, y riesgos visuales que necesitan una revisión real a 360–420 dp.
- **P3:** conectar progresión/colecciones y navegación secundaria a datos reales después de cerrar los contratos y runtime; no incluido en esta tanda.

No se modificó código de producto, GPS, permisos, Activity, SQLite, recovery, pause/resume ni sync. No se aplicaron correcciones; se propone una tanda visual separada al final.

## A. Inventario de datos DEMO / hardcoded

| Pantalla | Dato visible | Origen actual | Debería venir de | Riesgo de confusión |
|---|---|---|---|---|
| Home / tarjeta de ruta | Ruta “Sendero de Cuadros y Adarves”; municipio; 8,7 km; +412 m; 2 h 30 min; dificultad; 750 XP, 120 aceitunas y 7 descubrimientos | `src/features/routes/fixtures.ts` (`developmentRoutes[0]`); Home toma solo el primer fixture (`app/index.tsx:27–30,127–130`). La tarjeta sí muestra “DATOS DE DESARROLLO” (`RouteCard.tsx:30–34`). | Catálogo editorial publicado y versionado; preview de recompensas emitido por el catálogo/backend | La etiqueta reduce el riesgo, pero el hero promete “Rutas reales” (`index.tsx:50–54`) y el fixture contiene lugares, distancias, descripción y notas de seguridad plausibles.
| Home / contenido | “Retos de temporada”, ranking y descubrimientos; filtros “Todos/Fácil/Moderada/Difícil”; “Ver todas” | Copy/chips estáticos (`index.tsx:18–25,65–80,119–143`) | Catálogo/servicio de rutas y retos, con filtros funcionales y estados vacíos | Las opciones aparentan navegación/filtrado activo aunque no hay acción conectada; “próximamente” aparece solo en la tarjeta de retos.
| Detalle | Descripción, elevación, duración, dificultad, XP, aceitunas, recuento de descubrimientos y notas de seguridad para las tres rutas | `fixtures.ts:10–93` | Catálogo verificado de ruta y contenido de seguridad revisado; recompensas desde reglas de progresión | Puede interpretarse como guía real. La tarjeta marca desarrollo, pero el lenguaje del contenido no siempre distingue fixture de recomendación verificada.
| Detalle / mapa | Track, checkpoints, POI, altitudes, punto del senderista, geometría v1, bounds y perfil de elevación | `development-route-map-repository.ts:5–110`; coordenadas son constantes. El repositorio devuelve el mismo payload para todos los slugs conocidos (`:112–127`). | Payload geoespacial publicado para el `routeId`/`geometryVersion` seleccionado; posición solo del proveedor de ubicación activo | P1: el detalle presenta “Track oficial” y “Checkpoints verificados” si hay payload (`routes/[slug].tsx:250–273`), mientras el mapa puede estar usando datos de desarrollo. Los slugs de Pico/Cueva reciben el mismo track Bedmar.
| Detalle / offline | Manifest con `routeId: dev-bedmar-cuadros-001`, asset/URL, tamaño, hash, bounds, zoom y versiones | Constantes del repositorio de desarrollo (`development-route-map-repository.ts:129–148`); el manifest Bedmar se devuelve también para slugs dev restantes | Manifest firmado/versionado asociado al identificador real de ruta y asset publicado | La interfaz puede decir “Listo sin conexión” aunque el contenido sea un fixture o un asset no correspondiente a la ruta seleccionada.
| Preparar | Ubicación: “Pendiente”; GPS segundo plano: “Pendiente”; offline; seguridad: “Revisar” | Estado fijo para GPS/seguridad y estado local leído del manifest (`routes/[slug]/prepare.tsx:28–61,77–84`) | Estado real de permisos/runtime y paquete descargado | El copy informa que GPS está pendiente, una advertencia honesta; no hay preflight real en esta pantalla. El offline empieza como `unavailable` hasta resolver lectura y puede dar impresión de indisponibilidad transitoria.
| Aventura activa | 25 %, 2,1 km, 00:38, +140 m; objetivo/POI y distancia “140 m” | Literales en `adventure/[slug].tsx:67–82,91–113`; el primer POI del fixture se muestra como objetivo (`:46–46,97–112`) | Estado de una sesión real del runtime/Activity y descubrimientos verificados | P1: parecen métricas de actividad real. Además, “MODO SIMULADO” convive con “SEGUIMIENTO EN VIVO” (`:92`), mensaje contradictorio.
| Resumen | 14,2 km; 03:45; +650 m; 500 + 150 XP; cuatro coleccionables, tres marcados como obtenidos | Literales en `adventure/[slug]/summary.tsx:31–60` | Resumen final de la sesión completada, outbox/ledger de rewards y colección del usuario | P1: datos de resultado parecen reales y no tienen etiqueta DEMO; no se derivan de la ruta ni de la aventura activa.
| Pasaporte/perfil | Nivel 3; título “Explorador Principiante”; 1250/2000 XP; progreso visual 62 %; 3 rutas; 12 descubrimientos; 48 km; 3 insignias recientes y colección de 6 | Literales en `profile.tsx:39–84`; solo email/inicial se obtiene de Auth (`:27–35`) | Proyección de progreso, actividades confirmadas, badges y colección asociados al user id | P1: números hardcoded, no vinculados al usuario; título/nivel se contradicen. Las tarjetas con `???` ocultan el nombre pero mantienen emoji/familia (`CollectionCard.tsx:12–23`).
| Game Kit Playground | XP (50/100/200/75/25/500), nivel, 4,2 km, 82 min, checkpoints, descubrimientos, retos, badges, coleccionables, objetivo, relato/ruta ficticios y secuencia de 650 XP | `src/features/game-kit/mock-content.ts:34–165`, reducer puro `model.ts` y controles en `app/game-kit-playground.tsx`; la pantalla indica MOCK/QA y que no usa GPS/persistencia (`game-kit-playground.tsx:168–200,264–270`) | En producción: eventos verificados de aventura, catálogo editorial y ledger de rewards/colección; no integrar el fixture como dato real | Bajo dentro del Playground por sus avisos visibles. El contenido ficticio (“El eco del molino”, “La piedra que guarda silencio”) y la ruta no deben reutilizarse como recomendaciones.
| Probador Visual & Capas | 8,7 km, 4 POI, “track oficial”, checkpoints “verificados”, perfil/estadísticas y posición simulada | `app/theme-tester.tsx:141–173`; mismo payload de desarrollo | Datos del catálogo publicados y posición indicada como simulada | Alto si usuarios no QA llegan aquí: el Home ofrece la herramienta sin gating de QA y el copy “oficial/verificados” no refleja la fuente mock.

### Discrepancia de métricas entre pantallas

La ruta destacada anuncia 8,7 km; aventura activa enseña 2,1 km/38 min/+140 m/25 %; resumen muestra 14,2 km/3:45/+650 m; pasaporte suma 48 km, 3 rutas y 12 descubrimientos. Son snapshots hardcoded independientes, no una sesión coherente. El resumen incluso muestra 650 XP (500 + 150) aunque el preview destacado ofrece 750 XP. Referencias: `fixtures.ts:10–37`; `adventure/[slug].tsx:67–82`; `adventure/[slug]/summary.tsx:31–60`; `profile.tsx:39–62`.

## B. Auditoría funcional y visual

### Navegación comprobable

```text
Home (/)
  ├─ tarjeta destacada → /routes/[slug]
  │    ├─ Preparar aventura → /routes/[slug]/prepare
  │    │    └─ “Continuar en modo desarrollo” → /adventure/[slug]
  │    │         └─ “Pausar / Terminar” → /adventure/[slug]/summary
  │    │              ├─ “Ver mi Pasaporte” → /profile
  │    │              └─ “Volver al inicio” → /
  │    └─ volver → router.back()
  ├─ “Probador Visual & Capas” → /theme-tester
  ├─ Game Kit Playground → /game-kit-playground (solo `__DEV__` en esta base)
  └─ Perfil en bottom nav → /profile
       └─ “← Inicio” → push('/')
```

| Punto | Evidencia | Hallazgo |
|---|---|---|
| Home → detalle | `app/index.tsx:127–130` | Solo se muestra `developmentRoutes[0]`; “Ver todas” es texto sin handler (`:119–125`).
| Buscador/filtros | `app/index.tsx:56–80` | El input no tiene estado ni acción de búsqueda; filtros son `View`, no controles accionables.
| Navegación inferior | `app/index.tsx:146–160` | Solo “Perfil” navega; Rutas/Retos/Colecciones/Ranking parecen botones pero no hacen nada. El avatar “M” tampoco tiene acción (`:45–47`).
| Herramientas dev | `app/index.tsx:82–97` | El Probador Visual se ofrece desde Home sin condición `__DEV__`/QA; no hay guard de build en su pantalla. Ruta directa `/theme-tester` también existe.
| Preparar → activa | `app/routes/[slug]/prepare.tsx:136–149` | La acción se llama “Continuar en modo desarrollo”, explícita; crea navegación, no una sesión real.
| Activa → resumen | `app/adventure/[slug].tsx:115–133` | “Pausar / Terminar” navega directamente a Summary; no hay acción de pausa, reanudación ni confirmación de fin en esta pantalla. Botones “Ruta” y “SOS” no tienen handlers (`:115–132`).
| Summary → perfil/Home | `app/adventure/[slug]/summary.tsx:66–79` | Ambas acciones usan `push`; atrás de Android puede volver a Summary/Activa, sin limpiar ni confirmar la sesión.
| Perfil → Home | `app/profile.tsx:18–21` | `push('/')` añade otra Home al stack. Back hardware vuelve al perfil anterior; preferible definir intención de `replace`/back en una tanda separada.
| Slug inválido | Detalle/Preparar muestran “Ruta no disponible” (`routes/[slug].tsx:156–167`, `prepare.tsx:63–74`); Activa y Summary devuelven `null` (`adventure/[slug].tsx:42–44`, `summary.tsx:16–18`) | Deep link/slug inválido puede producir pantalla vacía en dos pasos del flujo.

### Layout, estados y accesibilidad (revisión estática)

- **Home:** scroll principal con `paddingBottom: 116`, bottom nav absoluto de 82 dp y safe area solo `edges={['top']}` (`app/index.tsx:32–39,146–162,166–168,270–289`). No se puede confirmar colisión con barra del sistema sin dispositivo; revisar Android gestures/3-button y escalado de fuente.
- **Detalle:** área scrolleable y CTAs al final del ScrollView; hero de 330 dp, tarjetas y botón de acción (`routes/[slug].tsx:175–178,296–308,313–346`). El hero utiliza título de ruta con estilo grande sin límite de líneas (`:191–195`); riesgo de corte visual a 360 dp o texto ampliado, por verificar.
- **Preparar:** ScrollView y footer absoluto; el contenido reserva 120 dp (`prepare.tsx:86–90,134–150,154–177`). La zona GPS pendiente es texto, no un estado de permisos. Verificar separación del footer/system bar en pantalla corta.
- **Activa:** pantalla fija sin ScrollView; mapa de 600 dp con HUD arriba, botón de salida y tarjeta inferior superpuestos (`adventure/[slug].tsx:48–59,61–85,87–133,139–202`). En 360 dp el nombre largo, objetivo y tres botones compiten por anchura; es un **riesgo de truncado/solape**, no un defecto visual confirmado. No hay estado de mapa cargando/error explícito; `route === undefined` retorna `null`.
- **Summary:** ScrollView con `paddingBottom: 120` más footer absoluto (`summary.tsx:20–24,64–80,84–104`). Verificar navegación Android y que último item no quede tapado con fuentes grandes.
- **Perfil:** ScrollView no tiene `paddingBottom` propio (`profile.tsx:14–16,87–95`), no hay footer persistente; el avatar/nombre tienen fallback, pero no estado de carga o perfil vacío real. Los títulos y valores son estáticos.
- **Mapa/errores:** el detalle captura fallos del repositorio y muestra `unavailable`; estilo remoto puede fallar y se vuelve al `baseMapStyle` (`routes/[slug].tsx:79–120`). `RouteMap` muestra “Track verificado no disponible” si falta payload (`map/RouteMap.tsx:200–204`) pero no un error/cargando del SDK de mapa. No se identificó un control de reintento para carga del mapa; descarga offline sí ofrece Descargar/Actualizar/Reintentar (`routes/[slug].tsx:277–294`).
- **Loading/error/empty:** Home retorna `null` si falta fixture (`index.tsx:27–30`); Activa/Summary también retornan `null` para ruta desconocida. AuthGuard redirige mientras no hay sesión, sin pantalla de loading propia (`app/_layout.tsx:6–25`); `AuthContext` no captura rechazo de `getSession` (`src/context/AuthContext.tsx:26–43`). Login muestra el error crudo de Supabase en Alert (`app/login.tsx:14–40`).
- **Accesibilidad/touch:** algunos botones del Playground y RouteCard definen `accessibilityRole`/label, pero navegación Home, controles del mapa, tabs del Theme Tester y acciones Activa no ofrecen rol/label/estado en el código inspeccionado. Targets de acción se fijan en 44–66 dp en varias pantallas, pero contraste/tamaño con fuente del sistema necesita evaluación visual real.
- **Game Kit:** ScrollView longitudinal y márgenes inferiores están implementados (`game-kit-playground.tsx:161–175,272–273,291–357`); el mapa conceptual es de 300 dp y contiene un HUD con métricas/objetivo (`:178–193`). La insignia MOCK y disclosure ficticio son prominentes (`:168–200`). Comprobar a 360–420 dp HUD largo, feedback, reduced motion, estados de checkpoint, botón Reset y scroll completo siguiendo el checklist de MANUS-05. El componente de feedback escucha `reduceMotionChanged` en `GameKitComponents.tsx:127–171`.

## C. Clasificación de hallazgos

### P0 — Bloqueante

- **Ninguno confirmado estáticamente.** Esta conclusión no sustituye QA en Android ni el gate físico de runtime.

### P1 — Importante antes de beta

1. **Datos de actividad incongruentes y no conectados (Home/Activa/Summary/Pasaporte).** Referencias arriba. Puede hacer creer que la app registró una aventura o recompensas que no ocurrieron. Recomendación: no mostrar estas vistas como producción hasta conectarlas con una única fuente de estado/ledger; si siguen como mock, disclosure persistente por pantalla y valores cruzados coherentes.
2. **Contenido/track con lenguaje de verificación y riesgo de navegación.** `fixtures.ts` contiene rutas y coordenadas etiquetadas `developmentFixture`; el mapa sirve el mismo track Bedmar para tres slugs (`development-route-map-repository.ts:112–148`), mientras detalle y Theme Tester usan “Track oficial”/“verificados” (`routes/[slug].tsx:250–273`, `theme-tester.tsx:153–160`). Recomendación: bloquear etiquetas de verificación y navegación para fixtures; enlazar manifest/payload al route id real y tener revisión de contenido/safety antes de publicar.
3. **Probador de capas de desarrollo accesible desde Home.** `index.tsx:82–97` no lo oculta en builds normales; el Theme Tester contiene afirmaciones “oficial”/“verificado” (`theme-tester.tsx:153–160`). Recomendación visual segura: feature flag QA/dev para entrada y disclaimer permanente en esa pantalla antes de beta.
4. **Resumen de finalización no corresponde a la ruta activa.** La ruta destacada tiene 8,7 km; Summary muestra 14,2 km y 650 XP, sin disclosure; la ruta actual entrega otro preview de XP (`summary.tsx:31–60`, `fixtures.ts:16–24`). Recomendación: conectar el resumen al estado de sesión/route y marcar explícitamente fixtures.

### P2 — Pulido/funcionalidad de experiencia

1. Conectar búsqueda, chips de dificultad, “Ver todas” y tabs de bottom nav; si aún no están disponibles, usar estados deshabilitados/“próximamente” reales y no controles silenciosos (`index.tsx:56–80,119–160`).
2. Definir la semántica de “Pausar / Terminar”, separar pausa de finalización y añadir confirmación/estado de sesión al cerrar; hoy ambos llevan a Summary. Los controles Ruta/SOS requieren handler o indicación no disponible (`adventure/[slug].tsx:115–133`). **No corregir aquí**: requiere decisión funcional/runtime.
3. Reemplazar `null` por empty/not-found y loading/error states en Home, Activa, Summary y Auth; fallo de mapa sin mensaje de recuperación. Incluir reintento donde proceda.
4. Revisar `push` versus `replace` para Summary → Home/Perfil y Perfil → Home; probar back hardware, retorno a aventura y reentrada (`summary.tsx:66–79`, `profile.tsx:18–21`).
5. QA visual 360–420 dp: ancho del HUD/tarjeta activa, títulos largos, footer fijo vs scroll, safe areas, navegación gestual/3 botones, fuentes grandes, contraste y target de tabs. Hallazgos aún no comprobables sin emulador/APK.
6. Identificar con un estado transitorio la lectura offline mientras se consulta manifest; evitar “No disponible” antes de la respuesta cuando todavía está cargando (`routes/[slug]/prepare.tsx:28–61`).
7. Revisar roles, nombres accesibles, estado selected/disabled y feedback de botones; particularmente Home, Theme Tester, Active Adventure y capa de mapa.
8. En Game Kit, completar QA visual desde la APK ARM64: HUD largo, scroll completo, estados de todos los checkpoints, reset/replay, texto DEMO siempre visible y reduced-motion.

### P3 — Futuro

- Conectar retos, ranking, colecciones y badges del pasaporte a servicios propios una vez estabilizados los contratos de progreso y rewards.
- Añadir filtros reales, paginación/catálogo completo y personalización accesible del perfil.
- Definir telemetría de UX y localización/formatos para distancias, duración, XP y lenguaje editorial.

## D. Mapa de archivos implicados

| Archivo | Uso en auditoría |
|---|---|
| `apps/mobile/app/index.tsx` | Home, entradas, search/filtros, bottom navigation |
| `apps/mobile/app/routes/[slug].tsx` | Detalle, mapa, offline, etiquetas de verificación, CTA |
| `apps/mobile/app/routes/[slug]/prepare.tsx` | Preflight demo, offline state y transición a aventura |
| `apps/mobile/app/adventure/[slug].tsx` | Aventura activa demo y acciones incompletas |
| `apps/mobile/app/adventure/[slug]/summary.tsx` | Resumen/recompensas hardcoded y navegación |
| `apps/mobile/app/profile.tsx` | Pasaporte, progresión, badges y colección hardcoded |
| `apps/mobile/app/theme-tester.tsx` | Herramienta dev expuesta, payload y copy de track verificado |
| `apps/mobile/app/game-kit-playground.tsx` | Playground QA, controles, disclosure, layout |
| `apps/mobile/app/_layout.tsx`, `src/context/AuthContext.tsx`, `app/login.tsx` | Auth guard, estado de carga/error/login |
| `apps/mobile/src/features/routes/fixtures.ts` | Fichas demo de rutas y rewards preview |
| `apps/mobile/src/features/routes/development-route-map-repository.ts` | Track/checkpoints/POI/altitud/posición/manifest mock compartido |
| `apps/mobile/src/features/routes/route-utils.ts` | Resolución del slug contra fixtures |
| `apps/mobile/src/map/RouteMap.tsx` | Render/capas/estados de mapa |
| `apps/mobile/src/features/game-kit/mock-content.ts`, `model.ts`, `GameKitComponents.tsx` | Contenido ficticio, estado local y UI Game Kit |
| `apps/mobile/src/components/ui/RouteCard.tsx`, `RouteMetrics.tsx`, `CollectionCard.tsx`, `XPRewardCard.tsx` | Componentes de métricas, colección y rewards |

## E. Próxima tanda UX segura sugerida (separada de GPS)

1. **PR UX-1, contenido/disclaimers y feature gates:** retirar/ocultar Probador Visual fuera de QA; etiquetar explícitamente Summary/Profile/fixtures como demo, eliminar “oficial/verificado” del Theme Tester mientras consuma mocks; alinear cifras demo entre pantallas. Solo cambios visuales/copy, sin tocar runtime.
2. **PR UX-2, estados y navegación:** “próximamente”/deshabilitado en controles no implementados, empty/not-found/loading/error states para pantallas de catálogo, definir `push`/`replace` de retorno. Mantener en espera cualquier cambio a pausa/fin que afecte Activity runtime.
3. **PR UX-3, QA visual:** instalar artifact del Playground en Android real/BrowserStack y registrar viewport, safe areas, scroll, contraste, accesibilidad y resultados del checklist. Corregir solo layout/copy del Game Kit en una rama separada, sin editar los archivos comunes mientras MANUS-05 siga en curso.

## Evidencia y límites

- Evidencia inspeccionada: rutas/copy/constantes/handlers/estilos enumerados arriba en snapshot `a67fd8d`.
- No se obtuvieron capturas, no se instaló APK en dispositivo, y no se declara aprobada ninguna pantalla ni prueba física.
- P0/P1 se documentan como hallazgos/recomendaciones; no se modificaron los archivos de producto ni se alteraron gates físicos.
