# Mágina Aventura — Promo cinematográfica

Landing estática independiente para presentar Mágina Aventura sin acoplarla todavía al runtime de la app móvil.

## Estructura

- `index.html`: narrativa, logo oficial, nueve estados visuales de la secuencia y secciones.
- `styles.css`: diseño responsive, escenas, progresión visual y estados de scroll.
- `branding.css`: identidad visual, logo, titulares y tarjetas narrativas.
- `app.js`: secuencia cinematográfica vinculada al scroll, parallax suave, reveals y CTA.
- `assets/scenes/scene-01.webp`, `scene-06.webp` y `scene-09.webp`: escenas fuente actuales. Se reutilizan mediante nueve encuadres/zooms progresivos para dar continuidad sin depender de un sprite.
- `assets/magina-aventura-logo.svg` y `assets/magina-aventura-icon.svg`: identidad oficial compartida con la app móvil.
- `test/*.test.mjs`: contrato de branding, navegación, continuidad visual y movimiento móvil.

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

## Evolución visual

La secuencia actual usa tres fotografías fuente y nueve estados de cámara. Esto permite probar el ritmo, el scroll y la composición. Cuando tengamos más imágenes finales de Sierra Mágina, cada estado puede sustituirse por una escena propia sin cambiar la lógica de la landing.

## Integración futura

Las secciones `#exploracion` y `#perfil` están diseñadas como escaparate. Más adelante pueden consumir datos reales desde el mismo backend de Mágina Aventura sin cambiar la narrativa principal.
