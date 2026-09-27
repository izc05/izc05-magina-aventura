# AI & Game Asset Pipeline

## Objetivo

Usar IA para construir una identidad visual propia sin convertir datos geográficos en ficción.

## Qué puede generarse con IA

- hero de rutas;
- thumbnails editoriales;
- illustrations de discoveries;
- badges;
- backgrounds;
- onboarding;
- profile banners;
- challenge art;
- empty states;
- decorative textures;
- map icon concepts que luego se normalizan;
- Lottie/Rive source concepts si se redibujan/animan apropiadamente.

## Qué NO se genera como verdad geográfica

- tracks;
- coordenadas;
- límites;
- fuentes de agua reales;
- caminos;
- dificultad;
- desnivel;
- señalización;
- seguridad;
- ubicación exacta de especies;
- park boundaries.

IA puede ilustrar; PostGIS/GPX/fuentes verificadas determinan la geografía.

## Inventario requerido

Crear más adelante:
`apps/mobile/assets/game/manifest.ts`

Cada asset:
- id;
- kind;
- local path;
- source/origin;
- generatedByAI boolean;
- license si externo;
- attribution si aplica;
- dimensions;
- byte size;
- offlineRequired;
- fallbackId.

## Formatos

- fotografías/hero: WebP preferido;
- iconos de mapa: PNG/WebP pequeños o SDF compatibles;
- animación: Lottie JSON o Rive .riv solo cuando aporte;
- sonido: formatos soportados por Expo Audio, cues cortos;
- evitar PNG enormes.

## Estilo IA canónico

Dirección:
- Sierra Mágina;
- luz mediterránea;
- olivos;
- roca caliza;
- pueblos blancos;
- verde oliva oscuro;
- oro cálido;
- realismo cinematográfico con toque ilustrado;
- premium pero lúdico.

Evitar:
- fantasía medieval genérica;
- estética infantil;
- neón futurista;
- copiar Pokémon, Zelda u otras IPs;
- UI generada dentro de imágenes para pantallas reales.

## Assets del mapa

El mapa no usa una imagen IA como cartografía.

IA sí puede crear:
- badge art;
- discovery portraits;
- marker illustration;
- decorative compass;
- objective emblem.

Luego se convierten en assets consistentes y optimizados.

## Licencias externas

Fuentes posibles deben revisarse por asset:
- Kenney: priorizar CC0;
- OpenGameArt: filtrar por licencia;
- Freesound: preferir CC0;
- LottieFiles: revisar licencia de cada asset;
- Game-icons: requiere atribución según licencia;
- Mixkit: revisar términos vigentes.

No incorporar assets “free” sin registrar licencia.

## Performance

Antes de aceptar un asset:
- medir tamaño;
- redimensionar a resolución real;
- comprimir;
- probar Android físico;
- verificar offline.

No hacer preload global de toda la biblioteca.
