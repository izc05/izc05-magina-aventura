# Mágina Aventura Cinematic Scroll Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing promo into a six-sequence proprietary cinematic scroll journey with layered parallax, integrated app/profile UI, mobile-safe motion, and no external cinematic runtime imagery.

**Architecture:** Keep the existing dependency-free scroll renderer, but split motion math into `cinematic.js` and scene-specific styling into `cinematic.css`. Replace the current nine flat frames/four story steps with six semantic scene articles whose individual layers expose `data-depth` metadata. Preserve the current navigation anchors, official brand assets, release-status behavior, and accessible reduced-motion fallback.

**Tech Stack:** Static HTML/CSS/JavaScript, Node 22 test runner, GitHub Actions, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-16-cinematic-scroll-experience-design.md`

## Global Constraints

- Final cinematic art must be original Mágina Aventura artwork; no Wikimedia/Commons runtime imagery in the target implementation.
- Core motion is scroll-position-driven; no autoplay video and no scroll-jacking.
- Keep official mountain/path/sun logo assets unchanged.
- Keep `#exploracion`, `#perfil`, and `#descarga` anchors valid.
- Preserve honest `coming-soon` Android release status until a real release exists.
- `prefers-reduced-motion: reduce` must remain fully readable.
- Compact breakpoint remains `max-width: 900px`.
- Do not touch `main`, app GPS, RC, weather, catalog, or admin branches.

---

### Task 1: Define the six-scene semantic contract

**Files:**
- Modify: `apps/promo/test/branding.test.mjs`
- Modify: `apps/promo/index.html`

**Interfaces:**
- Produces DOM attributes consumed later by `app.js`: `[data-cinematic-scene]`, `[data-scene-layer]`, `[data-scene-copy]`, and numeric `data-depth`.
- Preserves anchor IDs consumed by top navigation: `exploracion`, `perfil`, `descarga`.

- [ ] **Step 1: Write the failing scene-contract test**

Append this test to `apps/promo/test/branding.test.mjs`:

```js
test('authors the six cinematic journey scenes in narrative order', () => {
  const sceneNames = [...html.matchAll(/data-cinematic-scene="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(sceneNames, [
    'awakening',
    'path',
    'discovery',
    'app',
    'progress',
    'finale',
  ]);
  assert.ok((html.match(/data-scene-layer/g) ?? []).length >= 12);
  assert.ok((html.match(/data-depth="0\.\d+"/g) ?? []).length >= 12);
});
```

- [ ] **Step 2: Run the branding test and verify RED**

Run:

```bash
node --test apps/promo/test/branding.test.mjs
```

Expected: FAIL because the current HTML contains nine `data-scene-frame` elements and no six-scene semantic contract.

- [ ] **Step 3: Replace the current frame/story markup with six semantic scenes**

In `apps/promo/index.html`, keep the existing `#inicio .cinematic > .cinematic-sticky` shell and replace the old `.frames` + `.story-sequence` structure with six articles:

```html
<div class="cinematic-scenes">
  <article class="cinematic-scene is-active" data-cinematic-scene="awakening">
    <div class="scene-layer scene-layer--sky" data-scene-layer data-depth="0.08" aria-hidden="true"></div>
    <div class="scene-layer scene-layer--far" data-scene-layer data-depth="0.16" aria-hidden="true"></div>
    <div class="scene-layer scene-layer--mid" data-scene-layer data-depth="0.28" aria-hidden="true"></div>
    <div class="scene-copy scene-copy--hero" data-scene-copy>
      <div class="hero-brand-lockup"><img class="hero-brand-logo" src="assets/magina-aventura-logo.svg" alt="Mágina Aventura — Sierra Mágina, Jaén" /></div>
      <p class="eyebrow">SIERRA MÁGINA · JAÉN</p>
      <h1>Descubre Sierra Mágina<br/><span>como nunca antes.</span></h1>
      <p>Rutas, exploración y naturaleza en una experiencia que avanza contigo.</p>
    </div>
  </article>

  <article class="cinematic-scene" data-cinematic-scene="path">
    <div class="scene-layer scene-layer--far" data-scene-layer data-depth="0.12" aria-hidden="true"></div>
    <div class="scene-layer scene-layer--mid" data-scene-layer data-depth="0.30" aria-hidden="true"></div>
    <div class="scene-layer scene-layer--foreground" data-scene-layer data-depth="0.52" aria-hidden="true"></div>
    <div class="scene-copy" data-scene-copy><p class="eyebrow">02 · EL CAMINO</p><h2>Cada ruta empieza<br/><span>con un paso.</span></h2></div>
  </article>

  <article class="cinematic-scene" data-cinematic-scene="discovery">
    <div class="scene-layer scene-layer--far" data-scene-layer data-depth="0.14" aria-hidden="true"></div>
    <div class="scene-layer scene-layer--mid" data-scene-layer data-depth="0.34" aria-hidden="true"></div>
    <div class="scene-layer scene-layer--foreground" data-scene-layer data-depth="0.58" aria-hidden="true"></div>
    <div class="scene-copy" data-scene-copy><p class="eyebrow">03 · DESCUBRE</p><h2>Explora. Descubre.<br/><span>Avanza.</span></h2></div>
  </article>

  <article id="exploracion" class="cinematic-scene cinematic-scene--product" data-cinematic-scene="app">
    <div class="scene-layer scene-layer--far" data-scene-layer data-depth="0.10" aria-hidden="true"></div>
    <div class="scene-copy" data-scene-copy><p class="eyebrow">04 · EXPLORACIÓN</p><h2>La aventura también<br/><span>se guía contigo.</span></h2></div>
    <div class="scene-product" data-scene-product="app"></div>
  </article>

  <article id="perfil" class="cinematic-scene cinematic-scene--product" data-cinematic-scene="progress">
    <div class="scene-layer scene-layer--far" data-scene-layer data-depth="0.08" aria-hidden="true"></div>
    <div class="scene-copy" data-scene-copy><p class="eyebrow">05 · TU HISTORIA</p><h2>Cada aventura<br/><span>deja huella.</span></h2></div>
    <div class="scene-product" data-scene-product="progress"></div>
  </article>

  <article class="cinematic-scene" data-cinematic-scene="finale">
    <div class="scene-layer scene-layer--sky" data-scene-layer data-depth="0.06" aria-hidden="true"></div>
    <div class="scene-layer scene-layer--far" data-scene-layer data-depth="0.14" aria-hidden="true"></div>
    <div class="scene-layer scene-layer--mid" data-scene-layer data-depth="0.24" aria-hidden="true"></div>
    <div class="scene-copy scene-copy--finale" data-scene-copy><p class="eyebrow">MÁGINA AVENTURA</p><h2>Tu próxima ruta<br/><span>empieza aquí.</span></h2><a class="button primary" href="#descarga">Descargar aplicación</a></div>
  </article>
</div>
```

Move the current exploration phone markup into `[data-scene-product="app"]` and the current profile markup into `[data-scene-product="progress"]`; do not duplicate them.

Keep the existing download section after the cinematic sequence with `id="descarga"`.

- [ ] **Step 4: Run the branding test and verify GREEN**

Run:

```bash
node --test apps/promo/test/branding.test.mjs
```

Expected: PASS for the new six-scene test. Existing tests that explicitly require nine old frames may fail; update/remove only those old-frame assertions whose behavior is intentionally superseded by this spec, while keeping logo, download honesty, navigation, and product UI assertions.

- [ ] **Step 5: Commit**

```bash
git add apps/promo/index.html apps/promo/test/branding.test.mjs
git commit -m "feat: structure six cinematic journey scenes"
```

---

### Task 2: Extract deterministic cinematic motion math

**Files:**
- Create: `apps/promo/cinematic.js`
- Create: `apps/promo/test/cinematic.test.mjs`

**Interfaces:**
- Produces:
  - `clamp(value, min = 0, max = 1): number`
  - `sceneState(progress, sceneIndex, sceneCount): { local, visibility, active }`
  - `layerTransform(localProgress, depth, compact): { translateY, translateX, scale }`

- [ ] **Step 1: Write failing unit tests**

Create `apps/promo/test/cinematic.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp, sceneState, layerTransform } from '../cinematic.js';

test('clamp keeps cinematic progress inside its bounds', () => {
  assert.equal(clamp(-1), 0);
  assert.equal(clamp(0.45), 0.45);
  assert.equal(clamp(2), 1);
});

test('sceneState activates one of six scenes and bounds local progress', () => {
  const state = sceneState(0.44, 2, 6);
  assert.ok(state.local >= 0 && state.local <= 1);
  assert.ok(state.visibility >= 0 && state.visibility <= 1);
  assert.equal(typeof state.active, 'boolean');
});

test('compact layer travel is smaller than desktop travel', () => {
  const desktop = layerTransform(0.9, 0.5, false);
  const compact = layerTransform(0.9, 0.5, true);
  assert.ok(Math.abs(compact.translateY) <= Math.abs(desktop.translateY) * 0.6 + 0.01);
  assert.ok(compact.scale <= desktop.scale);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
node --test apps/promo/test/cinematic.test.mjs
```

Expected: FAIL with module-not-found for `../cinematic.js`.

- [ ] **Step 3: Implement the motion helpers**

Create `apps/promo/cinematic.js`:

```js
export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function sceneState(progress, sceneIndex, sceneCount) {
  const count = Math.max(1, sceneCount);
  const segment = 1 / count;
  const start = sceneIndex * segment;
  const local = clamp((progress - start) / segment);
  const center = start + segment / 2;
  const distance = Math.abs(progress - center) / segment;
  const visibility = clamp(1 - Math.max(0, distance - 0.15) * 1.7);
  const active = progress >= start && (sceneIndex === count - 1 ? progress <= 1 : progress < start + segment);
  return { local, visibility, active };
}

export function layerTransform(localProgress, depth, compact) {
  const p = clamp(localProgress);
  const d = Math.max(0, Number(depth) || 0);
  const centered = p - 0.5;
  const travel = compact ? 42 : 82;
  const horizontal = compact ? 6 : 14;
  const zoom = compact ? 0.022 : 0.045;
  return {
    translateY: centered * travel * d,
    translateX: centered * horizontal * d,
    scale: 1 + p * zoom * d,
  };
}
```

- [ ] **Step 4: Run tests and verify GREEN**

Run:

```bash
node --test apps/promo/test/cinematic.test.mjs
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/promo/cinematic.js apps/promo/test/cinematic.test.mjs
git commit -m "feat: add cinematic scroll motion helpers"
```

---

### Task 3: Drive the six scenes and layers from scroll position

**Files:**
- Modify: `apps/promo/app.js`
- Modify: `apps/promo/index.html`
- Modify: `apps/promo/test/motion.test.mjs`

**Interfaces:**
- Consumes `sceneState()` and `layerTransform()` from `cinematic.js`.
- Uses DOM contract from Task 1.

- [ ] **Step 1: Replace old frame-specific motion assertions with six-scene assertions**

In `apps/promo/test/motion.test.mjs`, ensure tests assert these source-level behaviors:

```js
assert.match(appJs, /sceneState\(/);
assert.match(appJs, /layerTransform\(/);
assert.match(appJs, /\[data-cinematic-scene\]/);
assert.match(appJs, /\[data-scene-layer\]/);
assert.match(appJs, /prefers-reduced-motion/);
```

Also assert `index.html` loads `cinematic.js` before or through the module entry point.

- [ ] **Step 2: Run motion tests and verify RED**

Run:

```bash
node --test apps/promo/test/motion.test.mjs
```

Expected: FAIL because `app.js` still references `.frame`, `--scene-zoom`, and old story-step calculations.

- [ ] **Step 3: Convert `app.js` into a module and wire scene/layer motion**

Change the script tag at the bottom of `index.html` to:

```html
<script type="module" src="app.js"></script>
```

Replace the old frame renderer in `app.js` with this structure while retaining existing reveal and APK-link behavior:

```js
import { clamp, sceneState, layerTransform } from './cinematic.js';

const cinematic = document.querySelector('[data-cinematic]');
const scenes = [...document.querySelectorAll('[data-cinematic-scene]')];
const progressBar = document.querySelector('[data-progress-bar]');
const topbar = document.querySelector('[data-topbar]');
const compactViewport = window.matchMedia('(max-width: 900px)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let raf = 0;

function renderCinematic() {
  if (!cinematic || !scenes.length) return;
  const rect = cinematic.getBoundingClientRect();
  const scrollable = Math.max(1, cinematic.offsetHeight - window.innerHeight);
  const progress = clamp(-rect.top / scrollable);

  scenes.forEach((scene, index) => {
    const state = sceneState(progress, index, scenes.length);
    scene.style.opacity = state.visibility.toFixed(3);
    scene.classList.toggle('is-active', state.active);
    scene.style.pointerEvents = state.visibility > 0.5 ? 'auto' : 'none';

    scene.querySelectorAll('[data-scene-layer]').forEach((layer) => {
      if (reduceMotion.matches) {
        layer.style.removeProperty('--layer-x');
        layer.style.removeProperty('--layer-y');
        layer.style.removeProperty('--layer-scale');
        return;
      }
      const transform = layerTransform(state.local, layer.dataset.depth, compactViewport.matches);
      layer.style.setProperty('--layer-x', `${transform.translateX.toFixed(2)}px`);
      layer.style.setProperty('--layer-y', `${transform.translateY.toFixed(2)}px`);
      layer.style.setProperty('--layer-scale', transform.scale.toFixed(4));
    });

    const copy = scene.querySelector('[data-scene-copy]');
    if (copy) {
      const enter = clamp(state.local / 0.18);
      const exit = 1 - clamp((state.local - 0.78) / 0.18);
      const alpha = Math.min(enter, exit) * state.visibility;
      copy.style.opacity = alpha.toFixed(3);
      if (!reduceMotion.matches) copy.style.transform = `translate3d(0, ${(1 - alpha) * 24}px, 0)`;
    }
  });

  if (progressBar) progressBar.style.transform = `scaleY(${Math.max(0.03, progress).toFixed(3)})`;
  topbar?.classList.toggle('is-scrolled', window.scrollY > 16);
}
```

Wrap `renderCinematic()` with the existing requestAnimationFrame scheduling and listen to `scroll`, `resize`, compact media changes, and reduced-motion changes.

- [ ] **Step 4: Run unit + motion tests and verify GREEN**

Run:

```bash
node --test apps/promo/test/cinematic.test.mjs apps/promo/test/motion.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/promo/index.html apps/promo/app.js apps/promo/test/motion.test.mjs
git commit -m "feat: drive cinematic scenes from scroll"
```

---

### Task 4: Add layered cinematic styling and mobile/reduced-motion branches

**Files:**
- Create: `apps/promo/cinematic.css`
- Modify: `apps/promo/index.html`
- Modify: `apps/promo/styles.css`
- Modify: `apps/promo/test/motion.test.mjs`

**Interfaces:**
- Consumes CSS vars emitted by Task 3: `--layer-x`, `--layer-y`, `--layer-scale`.

- [ ] **Step 1: Add failing style-contract assertions**

Add to `apps/promo/test/motion.test.mjs`:

```js
assert.match(cinematicCss, /\.cinematic-scene/);
assert.match(cinematicCss, /\.scene-layer/);
assert.match(cinematicCss, /var\(--layer-y/);
assert.match(cinematicCss, /@media\s*\(max-width:\s*900px\)/);
assert.match(cinematicCss, /prefers-reduced-motion:\s*reduce/);
```

Update the test setup to read `../cinematic.css`.

- [ ] **Step 2: Run motion tests and verify RED**

Run:

```bash
node --test apps/promo/test/motion.test.mjs
```

Expected: FAIL because `cinematic.css` does not exist.

- [ ] **Step 3: Create `cinematic.css` with the scene system**

Create `apps/promo/cinematic.css` with at least:

```css
.cinematic{height:740vh;position:relative;background:#050805}
.cinematic-sticky{position:sticky;top:0;height:100svh;min-height:620px;overflow:hidden;isolation:isolate}
.cinematic-scenes,.cinematic-scene,.scene-layer{position:absolute;inset:0;width:100%;height:100%}
.cinematic-scene{opacity:0;pointer-events:none;will-change:opacity}
.cinematic-scene.is-active{pointer-events:auto}
.scene-layer{background-repeat:no-repeat;background-position:center;background-size:cover;transform:translate3d(var(--layer-x,0),var(--layer-y,0),0) scale(var(--layer-scale,1));transform-origin:center;will-change:transform;pointer-events:none}
.scene-copy{position:absolute;z-index:8;left:clamp(24px,7vw,120px);top:50%;width:min(720px,78vw);transform:translate3d(0,0,0);will-change:opacity,transform}
.scene-copy h1,.scene-copy h2{font-family:Georgia,"Times New Roman",serif;font-weight:500;letter-spacing:-.035em;line-height:.94;margin:0}
.scene-copy h1,.scene-copy h2{font-size:clamp(52px,7vw,112px)}
.scene-copy span{color:var(--lime)}
.scene-product{position:absolute;z-index:7;right:clamp(24px,7vw,120px);top:50%;transform:translateY(-50%);width:min(470px,42vw)}
.scene-layer--foreground{z-index:4}
.scene-layer--mid{z-index:3}
.scene-layer--far{z-index:2}
.scene-layer--sky{z-index:1}

@media(max-width:900px){
  .cinematic{height:660vh}
  .scene-copy{left:20px;right:20px;top:auto;bottom:11svh;width:auto}
  .scene-copy h1,.scene-copy h2{font-size:clamp(44px,13vw,72px)}
  .scene-product{left:50%;right:auto;top:42%;width:min(360px,86vw);transform:translate(-50%,-50%)}
  .scene-layer--desktop-only{display:none}
}

@media(prefers-reduced-motion:reduce){
  .scene-layer{transform:none!important;will-change:auto}
  .scroll-indicator i{animation:none}
}
```

Link `cinematic.css` after `styles.css` and before `branding.css` in `index.html`.

Remove obsolete old-frame/story layout rules from `styles.css` only when they no longer have DOM consumers. Preserve phone/profile/download component styles.

- [ ] **Step 4: Run tests and verify GREEN**

Run:

```bash
node --test apps/promo/test/*.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/promo/cinematic.css apps/promo/styles.css apps/promo/index.html apps/promo/test/motion.test.mjs
git commit -m "feat: style layered cinematic scroll scenes"
```

---

### Task 5: Replace remote cinematic imagery with a proprietary local asset contract

**Files:**
- Create directories/files under: `apps/promo/assets/cinematic/`
- Modify: `apps/promo/index.html`
- Modify: `apps/promo/test/branding.test.mjs`

**Interfaces:**
- Scene layers consume CSS variables such as `--layer-image:url('assets/cinematic/01-awakening/sky.webp')`.
- Final art swaps are path-compatible and require no JavaScript change.

- [ ] **Step 1: Write the failing no-external-runtime test**

Add to `apps/promo/test/branding.test.mjs`:

```js
test('keeps cinematic runtime imagery under the proprietary local asset tree', () => {
  const runtimeUrls = [...html.matchAll(/--layer-image:url\('([^']+)'\)/g)].map((match) => match[1]);
  assert.ok(runtimeUrls.length >= 12, `expected layered local runtime assets, found ${runtimeUrls.length}`);
  assert.ok(runtimeUrls.every((url) => url.startsWith('assets/cinematic/')));
  assert.doesNotMatch(html, /commons\.wikimedia\.org\/wiki\/Special:Redirect/);
});
```

- [ ] **Step 2: Run branding tests and verify RED**

Run:

```bash
node --test apps/promo/test/branding.test.mjs
```

Expected: FAIL until all cinematic layers reference local proprietary paths.

- [ ] **Step 3: Add the initial proprietary asset tree**

Create these minimum paths using approved/generated original art assets, or development-safe original placeholders produced specifically for Mágina Aventura:

```text
apps/promo/assets/cinematic/01-awakening/sky.webp
apps/promo/assets/cinematic/01-awakening/mountains.webp
apps/promo/assets/cinematic/01-awakening/haze.webp
apps/promo/assets/cinematic/02-path/background.webp
apps/promo/assets/cinematic/02-path/trail.webp
apps/promo/assets/cinematic/02-path/foreground.webp
apps/promo/assets/cinematic/03-discovery/background.webp
apps/promo/assets/cinematic/03-discovery/terrain.webp
apps/promo/assets/cinematic/03-discovery/foreground.webp
apps/promo/assets/cinematic/04-app/background.webp
apps/promo/assets/cinematic/05-progress/background.webp
apps/promo/assets/cinematic/06-finale/sky.webp
apps/promo/assets/cinematic/06-finale/mountains.webp
apps/promo/assets/cinematic/06-finale/foreground.webp
```

Each transparent foreground/haze asset may use WebP alpha. Do not render copy into the files.

- [ ] **Step 4: Wire each layer to its local asset**

For example:

```html
<div class="scene-layer scene-layer--sky" data-scene-layer data-depth="0.08" aria-hidden="true" style="--layer-image:url('assets/cinematic/01-awakening/sky.webp')"></div>
```

Update `.scene-layer` in `cinematic.css` to include:

```css
background-image:var(--layer-image,linear-gradient(135deg,#0c1710,#314327));
```

Remove the old Wikimedia `preconnect` links from `<head>` once no runtime assets need them.

- [ ] **Step 5: Run branding tests and verify GREEN**

Run:

```bash
node --test apps/promo/test/branding.test.mjs
```

Expected: PASS with no Commons runtime URL.

- [ ] **Step 6: Commit**

```bash
git add apps/promo/assets/cinematic apps/promo/index.html apps/promo/cinematic.css apps/promo/test/branding.test.mjs
git commit -m "feat: use proprietary cinematic scene assets"
```

---

### Task 6: Integrate app and progress UI into scenes 4 and 5

**Files:**
- Modify: `apps/promo/index.html`
- Modify: `apps/promo/cinematic.css`
- Modify: `apps/promo/test/branding.test.mjs`

**Interfaces:**
- Uses existing `.phone-shell`, `.phone-screen`, `.profile-ui`, and related component styles.

- [ ] **Step 1: Write failing integration assertions**

Add:

```js
test('embeds the existing product previews inside cinematic scenes four and five', () => {
  assert.match(html, /data-cinematic-scene="app"[\s\S]*class="phone-shell/);
  assert.match(html, /data-cinematic-scene="progress"[\s\S]*class="profile-ui/);
  assert.equal((html.match(/class="phone-shell/g) ?? []).length, 1);
  assert.equal((html.match(/class="profile-ui/g) ?? []).length, 1);
});
```

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
node --test apps/promo/test/branding.test.mjs
```

Expected: FAIL until the existing mockups live inside scenes 4 and 5 rather than separate feature sections.

- [ ] **Step 3: Move existing UI markup without rewriting it**

Move the current phone mockup subtree into `[data-scene-product="app"]` and current profile mockup subtree into `[data-scene-product="progress"]`.

Keep the copy concise inside each scene; remove the now-redundant standalone `feature-light` and `feature-dark` wrappers once their contents have moved.

- [ ] **Step 4: Add product-scene sizing rules**

In `cinematic.css`, add desktop and compact transforms for `.cinematic-scene--product .phone-shell` and `.cinematic-scene--product .profile-ui`, keeping horizontal overflow at zero.

- [ ] **Step 5: Run all tests and verify GREEN**

Run:

```bash
node --test apps/promo/test/*.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/promo/index.html apps/promo/cinematic.css apps/promo/test/branding.test.mjs
git commit -m "feat: blend app previews into cinematic journey"
```

---

### Task 7: Preserve download CTA and end-to-end narrative anchors

**Files:**
- Modify: `apps/promo/index.html`
- Modify: `apps/promo/test/branding.test.mjs`

**Interfaces:**
- Existing navigation and CTA links continue to target `#exploracion`, `#perfil`, and `#descarga`.

- [ ] **Step 1: Strengthen anchor/release tests**

Ensure the existing tests assert:

```js
for (const id of ['exploracion', 'perfil', 'descarga']) {
  assert.match(html, new RegExp(`id="${id}"`));
}
assert.match(html, /data-release-status="coming-soon"/);
assert.doesNotMatch(html, /href="https:\/\/play\.google\.com/);
```

Also assert the finale CTA links to `#descarga`.

- [ ] **Step 2: Run branding tests**

Run:

```bash
node --test apps/promo/test/branding.test.mjs
```

Expected: PASS; if a moved anchor broke, fix the HTML before proceeding.

- [ ] **Step 3: Commit only if fixes were required**

```bash
git add apps/promo/index.html apps/promo/test/branding.test.mjs
git commit -m "test: lock cinematic journey navigation"
```

---

### Task 8: Add branch preview deployment and final verification

**Files:**
- Modify: `.github/workflows/promo-pages.yml`

**Interfaces:**
- Feature branch deployment must run the same Node test command as the existing promo branch.

- [ ] **Step 1: Add `feat/cinematic-scroll-experience-v1` to the workflow branch trigger**

Under `on.push.branches`, add:

```yaml
- feat/cinematic-scroll-experience-v1
```

Do not remove the current primary promo trigger.

- [ ] **Step 2: Run the complete local-equivalent test suite**

Run:

```bash
node --test apps/promo/test/*.test.mjs
```

Expected: 0 failures.

- [ ] **Step 3: Verify runtime-source constraints**

Run:

```bash
grep -R "commons.wikimedia.org/wiki/Special:Redirect" apps/promo/index.html apps/promo/*.css apps/promo/*.js && exit 1 || true
```

Expected: no runtime cinematic Commons references.

- [ ] **Step 4: Commit workflow change**

```bash
git add .github/workflows/promo-pages.yml
git commit -m "ci: preview cinematic scroll experience"
```

- [ ] **Step 5: Verify GitHub Actions and Pages**

Check the workflow run for this branch. Required successful steps:

```text
Checkout
Setup Node
Verify promo branding, motion and navigation
Configure Pages
Upload promo site
Deploy to GitHub Pages
```

Expected: workflow conclusion `success` and Pages deployment success.

- [ ] **Step 6: Compare branch against `feat/cinematic-promo-v1`**

Expected compare state: branch is ahead of `feat/cinematic-promo-v1` and not behind it. Confirm changed files are limited to promo code/assets/tests, workflow, spec, and plan.

---

## Self-review result

- Spec coverage: all six narrative sequences, proprietary art, product integration, mobile behavior, reduced motion, navigation, testing, and deployment have explicit tasks.
- Placeholder scan: no `TBD`, `TODO`, or unspecified implementation steps remain in the plan.
- Interface consistency: `data-cinematic-scene`, `data-scene-layer`, `data-scene-copy`, `data-depth`, `sceneState()`, and `layerTransform()` names are consistent across tasks.
- Scope: only the promo web is modified; app/RC/GPS/admin/catalog branches remain isolated.
