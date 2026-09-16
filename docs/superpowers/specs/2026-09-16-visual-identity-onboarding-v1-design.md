# Mágina Aventura — Visual Identity & Onboarding V1

## Status
Approved visual direction for implementation on mobile. This spec translates the approved concept into code without redesigning the product.

## Goal
Make the existing Expo/React Native app feel like a finished Mágina Aventura product from first launch: branded splash, four-step onboarding, refined home, consistent navigation, and reusable visual identity components.

## Product direction
Mágina Aventura must feel like a premium outdoor adventure app rooted in Sierra Mágina, not a generic React Native template and not a visual clone of Pokémon GO.

Core identity:
- Brand: **Mágina Aventura**
- Sub-brand: **Sierra Mágina · Jaén**
- Main claim: **Camina. Descubre. Conquista Mágina.**
- Supporting idea: **Más que rutas, historias por vivir.**

## Visual language
Primary palette:
- Olive 900: `#2F4A2E`
- AOVE Gold: `#D4AF37`
- Limestone: `#E7E1D6`
- Warm White: `#FAF9F6`
- Sky: `#7FB3D9`

The brand mark combines mountain, path, sun and olive branch motifs. The UI should favor warm white surfaces, olive typography/actions, gold reward accents, generous photography/map areas, rounded cards, restrained shadows and strong outdoor legibility.

## First-launch flow

```text
APP OPEN
  ↓
NATIVE/APP SPLASH
  ↓
Has onboarding been completed?
  ├─ No → ONBOARDING 1 → 2 → 3 → 4 → HOME
  └─ Yes → HOME
```

The onboarding completion value is persisted locally under `magina_onboarding_seen_v1`.

## Splash / loading
The launch experience uses an olive background and the Mágina Aventura brand mark with:
- `Mágina Aventura`
- `Sierra Mágina · Jaén`
- `Cargando aventuras…`

The app-level loading view may animate subtly, but no continuous heavy animation should run during active hiking.

## Onboarding
Four slides:

1. **Bienvenido a Mágina Aventura**  
   `Explora rutas reales por Sierra Mágina con una experiencia que convierte cada recorrido en una aventura.`

2. **Descubre rutas**  
   `Busca senderos, conoce su distancia, desnivel y dificultad y prepara tu aventura antes de salir.`

3. **Camina y desbloquea**  
   `Sigue el recorrido con GPS y descubre patrimonio, naturaleza y lugares especiales mientras avanzas.`

4. **Gana XP y aceitunas**  
   `Completa rutas, descubre lugares, consigue recompensas y sube de nivel dentro de Mágina.`

Controls:
- Slides 1–3: `Omitir`, `Siguiente →`
- Slide 4: `Comenzar aventura ▶`
- Four-dot progress indicator.

Skipping or finishing onboarding persists completion and routes to Home.

## Home
The existing route catalog behavior remains intact. Visual hierarchy becomes:
1. branded header;
2. hero with `Camina. Descubre. Conquista Mágina.`;
3. three value propositions: `Rutas reales`, `Patrimonio vivo`, `Naturaleza única`;
4. route search;
5. difficulty filters;
6. featured route card;
7. bottom navigation.

Bottom navigation labels:
- Rutas
- Retos
- Colecciones
- Ranking
- Perfil

Emoji/symbol placeholders are not part of the final identity. V1 may use lightweight text/vector glyph components until the icon set is centralized.

## Reusable components
Create focused components rather than growing `app/index.tsx` further:
- `BrandMark`
- `AppLogo`
- `AppHeader`
- `BottomNav`
- `FeaturedRouteCard`
- onboarding slide/carousel helpers

## App icon and binary assets
The source of truth for the logo is vector/code-based so the mark is reusable consistently. The Expo app icon/adaptive icon require raster files. Because repository binary upload is not available through the current automation path, this branch must not invent a different placeholder logo. The visual components and asset-generation contract are implemented first; raster export can be attached in the Android packaging step from the approved master artwork.

## Existing functionality that must not regress
Do not break:
- Expo Router paths;
- route fixtures/contracts;
- MapLibre;
- GPX/map behavior;
- offline route packages;
- route detail;
- `/routes/[slug]/prepare`;
- `/adventure/[slug]`;
- future GPS/community/discovery branches.

## Testing
Behavior tests cover:
- exact onboarding slide order/copy;
- first-launch decision from persisted state;
- completion key/version;
- brand palette contract;
- bottom-navigation contract.

CI must pass:
- `pnpm typecheck`
- `pnpm test`
- Expo Android prebuild
- existing database/package-boundary gates.

## Acceptance criteria
A fresh install opens into branded loading/onboarding and then the redesigned Home. A returning user bypasses onboarding. Home remains connected to the current route data and route detail flow. The UI clearly matches the approved Sierra Mágina/olive/AOVE visual direction and does not look like a generic prototype.