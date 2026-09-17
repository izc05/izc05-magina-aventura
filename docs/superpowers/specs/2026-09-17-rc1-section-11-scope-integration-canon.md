# Mágina Aventura — RC1 Canon · Sección 11 — Alcance RC1 / RC1.1 / V2 y orden de integración

Status: **APPROVED / OWNER-LOCKED CANON**  
Date: 2026-09-17  
Owner rule: **No modificar salvo decisión explícita del propietario del producto. No reinterpretar ni reducir este alcance por conveniencia técnica.**

## 1. Principio de versiones

Mágina Aventura evoluciona en tres escalones:

- **RC1**: primera versión completa del bucle fundamental de aventura física.
- **RC1.1**: profundización social, narrativa y de progresión sin cambiar el núcleo.
- **V2**: capacidades avanzadas como AR, IA de naturaleza, 3D avanzado, recompensas físicas y ecosistema local ampliado.

RC1 no es una versión recortada. Es la primera versión completa capaz de demostrar el producto.

## 2. Bucle obligatorio de RC1

RC1 debe demostrar de extremo a extremo:

`explorar -> elegir aventura -> preparar -> descargar -> iniciar -> caminar -> navegar -> descubrir -> capturar/interactuar -> finalizar -> sincronizar -> progresar`

Si una función no fortalece este bucle o pone en riesgo GPS, offline, seguridad o estabilidad, no tiene prioridad sobre el núcleo.

## 3. Alcance obligatorio RC1

### Identidad y entrada
- identidad visual oficial;
- splash/loading;
- onboarding;
- autenticación;
- perfil básico.

### Explorar
- mapa de Sierra Mágina;
- catálogo real de rutas con procedencia;
- búsqueda y filtros;
- municipios/territorios;
- POI principales;
- estado operativo honesto.

### Ficha y preparación
- distancia, desnivel, dificultad y duración cuando estén verificadas;
- procedencia y trazabilidad;
- mapa y geometría;
- perfil de elevación sólo cuando exista evidencia válida;
- readiness de GPS, permisos, batería, offline, clima y avisos.

### Offline
- PMTiles/asset cartográfico;
- geometría/track;
- POI;
- descubrimientos públicos/hints;
- checkpoints;
- contenido esencial;
- snapshot de seguridad/restricciones;
- snapshot meteorológico;
- manifiesto versionado.

### Modo Aventura
- GPS real;
- track recorrido;
- ruta oficial diferenciada;
- tiempo, distancia y métricas derivadas de datos reales;
- pausa/reanudación;
- persistencia y recuperación;
- off-route sólo con geometría válida;
- funcionamiento offline;
- superficie de seguridad.

### Descubrimientos V1
- proximidad real;
- estados visible/oculto/secreto cuando proceda;
- interacción dentro de Modo Aventura;
- evidencia persistida;
- validación servidor para resultados protegidos;
- feedback provisional honesto.

### Cámara V1 en RC1
La cámara forma parte de RC1 como diferenciador del producto, sin exigir ARCore.

Capacidades mínimas:
- captura de recuerdo;
- interacción de descubrimiento con overlay simple;
- lectura QR/checkpoint cuando aplique;
- cola/evidencia offline;
- resultado provisional hasta validación.

No se requiere para RC1:
- reconstrucción AR 3D;
- reconocimiento IA de flora/fauna;
- modelos avanzados de visión.

### Progreso RC1
- XP;
- niveles;
- estadísticas verificadas;
- colecciones;
- insignias significativas;
- porcentaje/mapa personal de Mágina explorada.

Retos, temporadas y rankings pueden estar integrados en dominio si están sanos, pero una UI completa de temporada/rankings no bloquea el primer RC.

### Comunidad RC1
- lectura de fotos/reseñas/incidencias/condiciones;
- aportaciones operativas útiles tras/durante actividad, especialmente sendero, agua, vegetación, obstáculos e incidencias;
- moderación y privacidad básica;
- distinción oficial/comunidad.

Un feed social profundo no bloquea RC1.

### Clima RC1
- AEMET detrás de adapter/cache/backend;
- snapshot con marca temporal;
- temperatura, precipitación y viento relevantes;
- evolución temporal durante ventana estimada de aventura cuando exista;
- funcionamiento con snapshot offline;
- diferenciación entre previsión y alerta oficial.

### Seguridad RC1
- posición/última posición válida;
- precisión GPS;
- batería;
- track recorrido;
- cierres oficiales e incidencias diferenciados;
- mostrar camino recorrido;
- no prometer capacidades de rescate.

### Admin RC1
Debe permitir operar el núcleo sin recompilar Android:
- Route Master;
- GPX/geometría y versionado;
- publicación por estados;
- POI y descubrimientos;
- multimedia;
- cierres/incidencias;
- usuarios/moderación básica;
- configuración de progreso necesaria;
- feature flags;
- auditoría.

### Backend RC1
- Supabase Auth;
- PostgreSQL/PostGIS;
- RLS/RPC/grants;
- Supabase Storage;
- R2 para PMTiles/artefactos pesados versionados;
- SQLite operativo móvil;
- sincronización idempotente.

### Calidad obligatoria RC1
Antes de closed beta:
- CI verde;
- base desde cero/migraciones verdes;
- release APK;
- staging smoke;
- GPS físico;
- offline físico;
- recuperación física;
- pruebas de batería;
- Admin -> publicación -> móvil smoke;
- candidato identificado por SHA exacto.

## 4. Funciones que NO bloquean RC1

No bloquean RC1:
- AR avanzado;
- IA flora/fauna;
- 3D completo del terreno;
- recompensas físicas activas;
- red comercial/partners completa;
- Mi Olivo completo;
- clubs/grupos/eventos;
- chat privado;
- creación pública de rutas;
- versión iOS.

Estas funciones no se eliminan del producto; se secuencian.

## 5. RC1.1

RC1.1 profundiza sin redefinir el núcleo:
- feed territorial;
- seguimiento de exploradores y perfiles públicos;
- publicación social de fotos/comentarios con privacidad;
- retos completos y temporadas;
- rankings Senderista/Explorador/Mágina con scopes;
- historias y cadenas narrativas multi-ruta/municipio;
- descubrimientos con pistas, secuencias, QR y secretos avanzados;
- Mi Olivo como representación visual secundaria del progreso;
- recompensas digitales/cosméticas antes de valor físico.

## 6. V2

V2 puede incorporar:
- ARCore/experiencias AR seleccionadas;
- IA de flora/fauna con confianza y protección de especies sensibles;
- terreno 3D avanzado;
- recompensas físicas y canje con partners;
- ecosistema local ampliado;
- eventos y campañas comunitarias;
- creación/moderación de rutas de usuarios.

Nada de V2 puede obligar a degradar seguridad, privacidad, honestidad de datos u offline-first.

## 7. Raíz técnica de integración

La base técnica autorizada para comenzar RC1 es `fix/antigravity-stabilization` una vez verificada en verde.

Topología canónica:

`main -> fix/antigravity-stabilization -> integration/rc1 -> RC1 candidate -> field validation -> main`

`main` no se usa como banco de pruebas de integración.

## 8. Integrar por capacidades, no por PRs históricos

Las ramas grandes/divergidas no se fusionan ciegamente. Se extraen capacidades actuales y necesarias, preservando contratos y migraciones válidas una sola vez.

Orden de integración objetivo:

1. canon/guardrails;
2. base estabilizada;
3. contracts/domain/geo/route-import/offline-sync/activity-engine;
4. MapLibre/GPX/PostGIS/PMTiles/offline;
5. GPS/SQLite/background/recovery/sync/off-route;
6. Auth/profiles/RLS;
7. catálogo canónico y procedencia;
8. UX móvil oficial/onboarding/preparación/Modo Aventura/summary;
9. community foundation + mobile;
10. discoveries/proximity/collections;
11. progression cycle;
12. Admin por subcapacidades;
13. Admin catalog ingest;
14. weather adapter/cache/AEMET;
15. camera discovery V1;
16. Beta Readiness aplicado al candidato real;
17. release APK candidato;
18. pruebas físicas y staging;
19. correcciones y nuevo candidato cuando proceda;
20. closed beta y, sólo después, merge a `main`.

## 9. Reglas específicas de integración

- No usar merges masivos de ramas divergidas como estrategia por defecto.
- Resolver conflictos a favor del canon aprobado, no de la implementación más antigua.
- Consolidar cadenas apiladas evitando reintroducir commits equivalentes varias veces.
- Después de cada capability slice ejecutar gates automáticos relevantes.
- No cambiar silenciosamente contratos de datos para hacer encajar una UI vieja.
- No declarar validado un candidato distinto al SHA realmente probado.
- Una corrección que afecte un gate invalida/reabre la evidencia correspondiente.

## 10. Admin como subproyecto de integración

`feat/admin-v1` se considera una fuente extensa de capacidades, no un merge monolítico obligatorio.

Prioridad de incorporación:
1. schema/migrations y seguridad;
2. RBAC/capabilities;
3. Route Master/versionado/publicación;
4. seguridad/incidencias;
5. multimedia;
6. feature flags/auditoría;
7. progresión necesaria;
8. notificaciones;
9. partners/recompensas cuando el scope las active.

## 11. Promo web

`apps/promo` evoluciona en paralelo y no bloquea el núcleo Android. Antes de lanzamiento debe respetar:
- identidad oficial;
- imágenes propias/locales aprobadas;
- experiencia cinematográfica de scroll;
- responsive y rendimiento;
- reduced-motion;
- SEO básico;
- CTA real a beta/app cuando exista.

## 12. Reglas canónicas bloqueadas

1. **RC1 es la primera versión completa del bucle fundamental, no una demo vacía.**
2. **La cámara de descubrimiento V1 pertenece a RC1; AR avanzado no.**
3. **GPS, offline, seguridad y recuperación tienen prioridad sobre funciones secundarias.**
4. **RC1.1 añade profundidad; no corrige un núcleo incompleto.**
5. **V2 añade ambición sin redefinir el producto.**
6. **Se integra por capacidades sobre una base estabilizada, no por acumulación ciega de PRs.**
7. **`integration/rc1` es el banco de integración; `main` recibe el candidato sólo tras validación.**
8. **Las evidencias de campo pertenecen al SHA exacto probado.**
9. **Un conflicto entre código histórico y canon se resuelve a favor del canon.**
10. **Cualquier cambio de este documento requiere decisión explícita del propietario y nueva revisión versionada.**
