# Mágina Aventura — Free-first Infrastructure

## Decision

Mágina Aventura se desarrollará con una arquitectura **free-first** que permita llegar a una beta real sin depender de infraestructura doméstica para el servicio público.

## Environments

### Local / staging

- Mini PC del proyecto.
- Docker para servicios auxiliares y pruebas.
- Cloudflare Tunnel para publicar staging sin abrir puertos del router.
- Backups y herramientas internas.
- Posibilidad futura de ejecutar servicios pesados propios como routing, procesado GPX/DEM o generación de tiles.

El mini PC **no será inicialmente el backend público crítico** de autenticación, recompensas o actividades, para evitar que un corte de luz, reinicio, fallo de disco o conexión doméstica deje inutilizable la app.

### Beta pública

- Supabase Free: Auth, PostgreSQL, PostGIS, RLS, Edge Functions y datos transaccionales.
- Cloudflare: DNS, CDN, Workers cuando proceda, R2 para ficheros pesados y recursos descargables.
- GitHub Actions: CI.
- Expo/EAS: builds móviles cuando proceda.

### Producción futura

Sin cambiar contratos de dominio:

- Supabase Pro si el crecimiento justifica la gestión administrada; o
- VPS/servidor gestionado para servicios propios; o
- arquitectura híbrida manteniendo Supabase y externalizando procesos pesados.

## Data ownership

### Supabase/PostGIS

- perfiles;
- municipios;
- rutas y versiones;
- geometrías de rutas;
- checkpoints;
- descubrimientos;
- actividades;
- eventos de actividad;
- XP;
- insignias;
- retos;
- rankings;
- reward ledger;
- integration outbox;
- moderación y auditoría.

### Cloudflare R2

- imágenes de rutas;
- imágenes de descubrimientos;
- GPX originales/versionados;
- GeoJSON derivados cuando sea útil;
- paquetes offline;
- PMTiles/vector tiles propios;
- recursos visuales pesados.

La base de datos conserva IDs, metadatos, hashes, versiones y claves de objeto; los binarios pesados permanecen fuera de PostgreSQL.

## Mapping

### Rendering

- Mobile: MapLibre React Native.
- Web/Admin: MapLibre GL JS.

### Base map

No se utilizará el servidor público estándar de tiles de OpenStreetMap como infraestructura de producción ni para descargas offline masivas.

Dirección preferida para beta:

1. datos OpenStreetMap conforme a su licencia;
2. generación/provisión de vector tiles compatible;
3. empaquetado PMTiles cuando sea adecuado;
4. almacenamiento en Cloudflare R2;
5. MapLibre como renderer.

Un proveedor comercial/gratuito de tiles puede utilizarse durante desarrollo siempre que sus términos permitan el uso previsto.

### Route geometry

- GPX original conservado y versionado.
- Conversión a GeoJSON/LineString.
- Geometría canónica en PostGIS.
- El móvil descarga una versión inmutable de la ruta para una aventura.
- Una ruta ya iniciada no cambia debajo del usuario aunque un administrador publique una nueva versión.

## Offline strategy

Antes de una aventura, el dispositivo puede descargar un `route package` con:

- route version;
- LineString oficial;
- checkpoints;
- discovery triggers necesarios;
- datos esenciales de seguridad;
- metadatos de la ruta;
- mapa/tiles del corredor cuando estén disponibles.

Durante la aventura:

- GPS se persiste localmente;
- checkpoints y proximidad se calculan localmente;
- eventos se añaden a una cola local;
- las recompensas externas permanecen provisionales;
- al recuperar red se sincroniza de forma idempotente.

## Future self-hosted services

Servicios candidatos para mini PC/VPS, pero no necesarios para el primer vertical:

- generación de PMTiles;
- importador/normalizador GPX;
- DEM/elevation processing;
- routing con motor open source compatible;
- thumbnails/optimización de imágenes;
- workers de análisis antifraude pesado;
- backups externos.

## Payments

Los pagos no forman parte de Foundations. La arquitectura mantendrá separados:

- cuenta/identidad;
- entitlement/suscripción;
- catálogo de recompensas;
- pagos;
- ledger de recompensas.

Así podremos introducir Stripe, Redsys/Bizum u otro proveedor más adelante sin acoplar la lógica de rutas/GPS al sistema de cobro.

## Cost principle

El objetivo es poder desarrollar y realizar la primera beta con planes gratuitos. Esto **no implica que producción a escala vaya a permanecer siempre a coste cero**: almacenamiento, tráfico, builds, mapas, email, observabilidad o número de usuarios pueden requerir planes de pago cuando haya adopción real.
