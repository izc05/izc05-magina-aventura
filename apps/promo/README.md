# Mágina Aventura — Promo cinematográfica

Landing estática independiente para presentar Mágina Aventura sin acoplarla todavía al runtime de la app móvil.

## Estructura

- `index.html`: narrativa, logo oficial, nueve estados visuales de la secuencia y secciones.
- `styles.css`: diseño responsive, escenas, progresión visual y estados de scroll.
- `branding.css`: identidad visual, logo, titulares, tarjetas narrativas y créditos fotográficos.
- `app.js`: secuencia cinematográfica vinculada al scroll, parallax suave, precarga de escenas, reveals y CTA.
- Fotografías reales de Sierra Mágina servidas mediante Wikimedia Commons con anchura limitada para la landing.
- `assets/magina-aventura-logo.svg` y `assets/magina-aventura-icon.svg`: identidad oficial compartida con la app móvil.
- `test/*.test.mjs`: contrato de branding, navegación, continuidad visual, créditos y movimiento móvil.

## Probar en local

Desde esta carpeta:

```bash
python -m http.server 4173
```

Abrir `http://localhost:4173`.

## GitHub Pages

La rama incluye `.github/workflows/promo-pages.yml`, que ejecuta primero las pruebas de la landing y después publica `apps/promo`.

GitHub Pages necesita una activación inicial a nivel de repositorio. Hacer una sola vez:

1. `Settings` → `Pages`.
2. En `Build and deployment`, seleccionar `GitHub Actions` como origen.
3. Reejecutar el workflow `Promo cinematic preview` o hacer un nuevo push en `feat/cinematic-promo-v1`.

## APK

El CTA está preparado con `data-apk-link`; mientras `href="#"` muestra “APK próximamente”. Cuando exista el artefacto final, sustituir `href` por la URL del APK o de Google Play.

## Fotografía y licencias

La secuencia usa fotografía real de Sierra Mágina alojada en Wikimedia Commons. Los encuadres, zooms y superposiciones de la landing constituyen adaptaciones visuales; los créditos visibles también aparecen en el pie de la propia web.

- Veinticuatro de Jahén: `Sierra Mágina 24J 01`, `Paisaje de olivar 24J 01`, `Paisaje de olivar 24J 05` y `Castillo Albanchez de Mágina 24J 01` — CC BY-SA 4.0.
- Azkoiti: `Pico Mágina - Jaén-` — CC BY-SA 3.0.
- Covi: `Vértice geodésico de pico Mágina` — CC BY-SA 4.0.

Las URLs usan `Special:Redirect/file/...?...width=` para solicitar una versión adecuada a web sin descargar los originales de varios megabytes.

## Evolución visual

La secuencia mantiene nueve estados de cámara, pero ya no depende de tres fondos repetidos: recorre olivar, patrimonio, macizo y cumbre con seis fotografías fuente. La lógica del scroll queda desacoplada de la lista concreta de imágenes, porque `app.js` precarga automáticamente las escenas declaradas en el HTML.

## Integración futura

Las secciones `#exploracion` y `#perfil` están diseñadas como escaparate. Más adelante pueden consumir datos reales desde el mismo backend de Mágina Aventura sin cambiar la narrativa principal.
