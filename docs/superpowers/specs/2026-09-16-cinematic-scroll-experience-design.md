# Mágina Aventura Cinematic Scroll Experience — Design

## Context

The current promo already has a sticky cinematic hero, nine background frames, a scroll-driven `requestAnimationFrame` renderer, four story steps, exploration/profile mockups, official branding, reduced-motion handling, and mobile-specific behavior.

The approved direction changes the experience from a sequence of unrelated photographs into one continuous, proprietary visual journey. The final art must be original to Mágina Aventura; Wikimedia/Commons photography is not part of the target design.

## Goal

Turn the promo into a six-sequence cinematic scroll experience where the user feels they are moving through Sierra Mágina as they scroll with mouse, trackpad, or touch, before the environment naturally reveals the app and ends at the download CTA.

## Product principles

- The user should feel they are travelling through one continuous adventure, not scrolling through a gallery.
- Final hero/story imagery must be original Mágina Aventura artwork with no runtime dependence on external image hosts.
- Motion must be driven by scroll position rather than autoplay video.
- Desktop and mobile tell the same story, with lighter movement and fewer simultaneous layers on compact devices.
- Text remains outside the artwork so assets can be reused in app onboarding, store listings, social campaigns, and future landing pages.
- Existing official mountain/path/sun branding remains unchanged.
- Existing honest Android release messaging remains unchanged until a real APK/Play Store release exists.
- `prefers-reduced-motion` must produce a calm readable version without essential information being lost.

## Narrative structure

### Sequence 1 — Despertar de Mágina

Purpose: establish territory and emotional tone.

Visual layers: sky/light, distant mountain silhouettes, mid-ground relief, haze/atmosphere, optional foreground vegetation.

Motion: slow parallax, tiny camera push, haze drift, logo and opening copy fade/translate.

Copy direction: `Mágina Aventura` / `Descubre Sierra Mágina como nunca antes`.

### Sequence 2 — Empieza el camino

Purpose: make the user feel they have entered the route.

Visual layers: distant landscape, route/sendero, mid-ground vegetation, close foreground vegetation/rock.

Motion: foreground travels faster than background; camera push increases; the path becomes the visual guide into the next sequence.

Copy direction: `Cada ruta empieza con un paso`.

### Sequence 3 — Explora y descubre

Purpose: increase adventure and discovery.

Visual layers: ridge/bosque/rock environment, optional hiker silhouette, discovery marker layer, atmosphere.

Motion: stronger depth, small lateral motion, controlled zoom, discovery cues entering as the user advances.

Copy direction: `Explora. Descubre. Avanza.`.

### Sequence 4 — La app entra en escena

Purpose: connect the landscape with the actual product.

Visual layers: continuing environment, device/mockup layer, map/routing UI, route cards.

Motion: nature stays visible while the device/UI enters and stabilizes; UI does not abruptly replace the scene.

Copy direction: `La aventura también se guía contigo`.

### Sequence 5 — Tu progreso

Purpose: show personal continuity, profile, achievements, collections, and future community value without invented user totals.

Visual layers: darker/cleaner environment, profile UI, achievement cards, progress accents.

Motion: calmer than Sequence 3; UI panels float into place with short depth shifts.

Copy direction: `Cada aventura deja huella`.

### Sequence 6 — Cierre hero

Purpose: return to a large landscape and convert attention into action.

Visual layers: panoramic proprietary hero art, subtle atmosphere, brand lockup, CTA.

Motion: landscape opens out, motion settles, CTA becomes dominant.

Copy direction: `Tu próxima ruta empieza aquí`.

## DOM architecture

Replace the single nine-frame cinematic stack and four generic story steps with six semantic scene articles inside the existing sticky cinematic container.

Each scene uses the same contract:

```html
<article class="cinematic-scene" data-cinematic-scene="awakening">
  <div class="scene-layer" data-scene-layer data-depth="0.10"></div>
  <div class="scene-layer" data-scene-layer data-depth="0.24"></div>
  <div class="scene-layer" data-scene-layer data-depth="0.42"></div>
  <div class="scene-copy" data-scene-copy>...</div>
</article>
```

`data-depth` is a numeric multiplier used by the renderer. Asset URLs remain CSS custom properties so final original art can be swapped without changing JavaScript.

Sequence 4 and 5 additionally contain the existing phone/profile UI markup instead of maintaining separate disconnected full-height feature sections.

The existing navigation anchors `#exploracion`, `#perfil`, and `#descarga` remain valid. `#exploracion` and `#perfil` become anchors within the cinematic sequence so existing links are not broken.

## Motion engine

Keep the existing dependency-free `requestAnimationFrame` scroll renderer for V1.

The renderer computes:

- overall cinematic progress from `0..1`;
- active scene index and local progress within the current scene;
- per-scene opacity/crossfade;
- per-layer translation and scale from `data-depth`;
- copy entrance/hold/exit opacity;
- UI entrance for sequences 4 and 5;
- global progress indicator.

The animation model must be deterministic from scroll position. No timers are required for core motion.

A helper boundary is introduced in `apps/promo/cinematic.js` so motion math can be unit-tested independently of DOM rendering:

```js
export function clamp(value, min = 0, max = 1) {}
export function sceneState(progress, sceneIndex, sceneCount) {}
export function layerTransform(localProgress, depth, compact) {}
```

`app.js` owns DOM discovery, event listeners, navigation/reveal behavior, and calls the cinematic helpers.

## Styling

Create `apps/promo/cinematic.css` for the six-scene experience so the existing general component styling in `styles.css` does not become harder to maintain.

Scene layers use absolute positioning and `will-change: transform, opacity`. Only transform and opacity are animated during scrolling.

Desktop cinematic length target: approximately `700vh` to `780vh` for six sequences. Mobile target: approximately `620vh` to `700vh`, with shorter travel and lower translation distances.

The final values are tuned visually while preserving six clearly readable sequence beats.

## Proprietary asset contract

Final runtime assets live under:

`apps/promo/assets/cinematic/<sequence>/<layer>.webp`

Expected sequence folders:

- `01-awakening/`
- `02-path/`
- `03-discovery/`
- `04-app/`
- `05-progress/`
- `06-finale/`

Each folder may contain 2–5 WebP layers. Transparent foreground layers may use WebP alpha. Assets contain no rendered text or logos unless explicitly part of an in-world object.

Until final artwork is approved, code may use neutral local development placeholders or existing repository-local imagery, but no new external runtime image dependencies may be introduced.

## Mobile behavior

At `max-width: 900px`:

- use the same six scene IDs and narrative order;
- reduce maximum layer travel by at least 40%;
- disable decorative layers that do not contribute to scene meaning using `.scene-layer--desktop-only`;
- keep all copy inside safe viewport padding;
- ensure phone/profile mockups fit without horizontal overflow;
- preserve touch scrolling with no scroll-jacking.

## Reduced motion

For `prefers-reduced-motion: reduce`:

- scenes still crossfade by scroll position;
- per-layer translation/zoom is disabled;
- copy remains readable;
- progress navigation still works;
- no looping decorative animation is required.

## Accessibility

- Decorative scene layers are `aria-hidden="true"`.
- Scene copy remains semantic HTML.
- Existing top navigation labels remain keyboard accessible.
- Color overlays must maintain readable contrast against all final art.
- Scroll interaction is enhancement only; content order in DOM is meaningful without animation.

## Testing

Add tests that verify:

1. exactly six named cinematic scenes exist in the intended order;
2. each scene exposes layered depth metadata;
3. exploration/profile/download anchors are preserved;
4. the runtime does not introduce external cinematic image URLs;
5. motion math returns bounded scene opacity and sensible compact/desktop travel;
6. reduced-motion behavior is present;
7. mobile CSS contains a compact cinematic branch;
8. existing brand, download honesty, favicon/logo, and navigation tests still pass.

## Branching and integration

Implementation branch: `feat/cinematic-scroll-experience-v1`, based directly on the current green `feat/cinematic-promo-v1` head.

The experimental `feat/cinematic-promo-local-media-v2` branch is not a required dependency of this design because its Wikimedia-derived imagery conflicts with the newly approved proprietary-art direction. It can remain available for reference but should not be merged solely to support this work.

`main` and application/RC/GPS branches are out of scope.

## Success criteria

The feature is ready for integration when:

- all six sequences are represented in semantic markup;
- scrolling creates a continuous layered movement effect on desktop and mobile;
- sequences 4 and 5 naturally integrate the product UI;
- reduced-motion mode is usable;
- no cinematic runtime imagery depends on external hosts;
- existing branding and release-status behavior is preserved;
- all promo tests pass in GitHub Actions;
- GitHub Pages deploys successfully from the feature branch.
