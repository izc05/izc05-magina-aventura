# Mágina Aventura — Promo cinematográfica

Landing estática independiente para presentar Mágina Aventura sin acoplarla todavía al runtime de la app móvil.

## Estructura

- `index.html`: narrativa y secciones.
- `styles.css`: diseño responsive y estados de scroll.
- `app.js`: secuencia cinematográfica vinculada al scroll, reveals y CTA.
- `assets/sequence/part-*.txt`: sprite WebP optimizado y dividido en fragmentos de transporte; `app.js` lo recompone en el navegador. Esto permite mantener los assets en la rama usando la API de GitHub sin perder la secuencia de 9 escenas.

## Probar en local

Desde esta carpeta:

```bash
python -m http.server 4173
```

Abrir `http://localhost:4173`.

## APK

El CTA está preparado con `data-apk-link`; mientras `href="#"` muestra “APK próximamente”. Cuando exista el artefacto final, sustituir `href` por la URL del APK o de Google Play.

## Integración futura

Las secciones `#exploracion` y `#perfil` están diseñadas como escaparate. Más adelante pueden consumir datos reales desde el mismo backend de Mágina Aventura sin cambiar la narrativa principal.
