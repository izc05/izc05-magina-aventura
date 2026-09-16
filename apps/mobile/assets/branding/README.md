# Mágina Aventura mobile branding

The approved brand source lives in this directory. Do not redraw the icon independently for Android, iOS, splash, web or marketing.

## Master files

- `magina-aventura-icon.svg` — square symbol source: mountain + path + AOVE-gold sun + olive branch.
- `magina-aventura-logo.svg` — horizontal wordmark source.

## Required raster exports before store/internal-distribution packaging

Export from `magina-aventura-icon.svg` without changing geometry or palette:

- `icon.png` — 1024×1024 PNG, opaque, sRGB.
- `adaptive-icon.png` — 1024×1024 PNG foreground with Android-safe padding; background `#2F4A2E`.
- `splash-logo.png` — transparent PNG using the same mark, target 512×512 canvas.

The Expo config must point to these files only after the exports exist in the repository. Never commit a temporary unrelated icon just to satisfy packaging.

## Palette

- Olive: `#2F4A2E`
- AOVE Gold: `#D4AF37`
- Limestone: `#E7E1D6`
- Warm White: `#FAF9F6`
- Sky: `#7FB3D9`

## Android splash verification

The native splash background is already configured through the `expo-splash-screen` config plugin. Expo development builds do not reproduce the final Android splash faithfully; verify final mark placement with an internal-distribution or release APK/AAB after the raster export is attached.
