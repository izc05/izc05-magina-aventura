# Mágina Aventura mobile branding

The official brand source lives in this directory. Android, iOS, splash, web and marketing must derive from this same approved identity instead of redrawing independent marks.

## Approved identity — 2026-09-16

The canonical symbol is the one approved for the project: Sierra Mágina in deep green, a white winding path across the mountain and an AOVE-gold sun. The legacy olive branch/olive-fruit decoration is not part of this mark.

## Master files

- `magina-aventura-icon.svg` — canonical symbol source: mountain + white path + gold sun.
- `magina-aventura-logo.svg` — canonical full lockup with `Mágina Aventura` and `SIERRA MÁGINA · JAÉN`.

Both SVGs expose `data-brand-mark="mountain-path-sun"` so automated checks can pin the identity.

## Generated native assets

Run `pnpm --filter @magina-aventura/mobile brand:assets`. The generator creates:

- `icon.png` — 1024×1024 opaque PNG on warm white.
- `adaptive-icon.png` — 1024×1024 transparent Android foreground with safe padding; background `#FAF9F6` is configured in Expo.
- `splash-logo.png` — transparent 512×512 mark for the native splash and in-app brand components.

These files are generated before local start/native builds and explicitly during CI before Expo prebuild. Do not commit a temporary unrelated icon to satisfy packaging.

## Palette

- Olive: `#2F4A2E`
- Deep green: `#0D5132`
- AOVE Gold: `#D4AF37`
- Warm White: `#FAF9F6`
- Limestone: `#E7E1D6`
- Sky: `#7FB3D9`

## Native verification

The final Android/iOS icon masks and splash placement must be checked in an internal-distribution or release build. Expo development mode does not reproduce all native launcher/splash behavior faithfully.
