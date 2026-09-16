# Mágina Aventura — Promo cinematográfica

Landing estática independiente para presentar Mágina Aventura sin acoplarla todavía al runtime de la app móvil.

## Estructura

- `index.html`: narrativa, logo oficial, títulos cinematográficos y secciones.
- `styles.css`: diseño responsive y estados de scroll.
- `branding.css`: capa de identidad visual, logo, titulares y overlays.
- `app.js`: secuencia cinematográfica vinculada al scroll, reveals y CTA.
- `assets/cinematic-sequence.webp`: sprite WebP optimizado con 9 escenas consecutivas. El scroll hace crossfade y zoom entre ellas hasta acercarse al móvil.
- `assets/magina-aventura-logo.svg` y `assets/magina-aventura-icon.svg`: identidad oficial compartida con la app móvil.
- `test/*.test.mjs`: contrato de branding, navegación y movimiento móvil.

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

La conexión automatizada actual puede escribir despliegues de Pages, pero no dispone de `administration:write`, por lo que no puede realizar esa activación inicial del repositorio.

## APK

El CTA está preparado con `data-apk-link`; mientras `href="#"` muestra “APK próximamente”. Cuando exista el artefacto final, sustituir `href` por la URL del APK o de Google Play.

## Integración futura

Las secciones `#exploracion` y `#perfil` están diseñadas como escaparate. Más adelante pueden consumir datos reales desde el mismo backend de Mágina Aventura sin cambiar la narrativa principal.
