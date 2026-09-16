import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const branding = readFileSync(new URL('../branding.css', import.meta.url), 'utf8');
const fullLogo = readFileSync(new URL('../assets/magina-aventura-logo.svg', import.meta.url), 'utf8');
const iconLogo = readFileSync(new URL('../assets/magina-aventura-icon.svg', import.meta.url), 'utf8');

test('uses the approved full Mágina Aventura logo in the main web lockups', () => {
  const fullLogoReferences = html.match(/assets\/magina-aventura-logo\.svg/g) ?? [];
  assert.ok(fullLogoReferences.length >= 2, `expected the full official logo in header and hero, found ${fullLogoReferences.length}`);
  assert.match(html, /class="brand-logo"/);
  assert.match(html, /class="hero-brand-logo"/);
  assert.match(branding, /\.brand-logo/);
  assert.match(branding, /\.hero-brand-logo/);
});

test('pins the approved mountain-path-sun artwork and removes the old olive branch mark', () => {
  for (const source of [fullLogo, iconLogo]) {
    assert.match(source, /data-brand-mark="mountain-path-sun"/);
    assert.match(source, /#D4AF37/i);
    assert.doesNotMatch(source, /rama de olivo/i);
    assert.doesNotMatch(source, /<ellipse/i);
  }
  assert.match(fullLogo, /Mágina Aventura/);
  assert.match(fullLogo, /SIERRA MÁGINA · JAÉN/);
});

test('keeps the compact official symbol for favicons and in-app mockups', () => {
  assert.match(html, /rel="icon" href="assets\/magina-aventura-icon\.svg"/);
  assert.match(html, /phone-appbar[\s\S]*assets\/magina-aventura-icon\.svg/);
  assert.match(html, /profile-ui-brand[\s\S]*assets\/magina-aventura-icon\.svg/);
});

test('authors nine cinematic frames with progressive scene metadata', () => {
  const frames = html.match(/data-scene-frame="\d+"/g) ?? [];
  assert.equal(frames.length, 9, `expected 9 cinematic frames, found ${frames.length}`);
  for (const property of ['--scene-image', '--scene-x', '--scene-y', '--scene-zoom']) {
    assert.ok(html.includes(property), `missing ${property} scene metadata`);
  }
});

test('keeps a local WebP fallback behind every cinematic frame', () => {
  const fallbacks = html.match(/--scene-fallback:url\('assets\/scenes\/scene-(?:01|06|09)\.webp'\)/g) ?? [];
  assert.equal(fallbacks.length, 9, `expected 9 local cinematic fallbacks, found ${fallbacks.length}`);
  for (const asset of ['scene-01.webp', 'scene-06.webp', 'scene-09.webp']) {
    assert.ok(html.includes(`assets/scenes/${asset}`), `missing local fallback ${asset}`);
  }
  assert.match(css, /background-image:var\(--scene-image\),var\(--scene-fallback\)/);
});

test('uses at least five distinct real Sierra Mágina photography sources in the cinematic sequence', () => {
  const urls = [...html.matchAll(/https:\/\/commons\.wikimedia\.org\/wiki\/Special:Redirect\/file\/([^?'\")]+)/g)]
    .map((match) => match[1]);
  const unique = new Set(urls);
  assert.ok(unique.size >= 5, `expected at least 5 unique Commons photo sources, found ${unique.size}`);
});

test('publishes visible photography credits and Creative Commons license information', () => {
  assert.match(html, /data-photo-credits/);
  assert.match(html, /Veinticuatro de Jahén/);
  assert.match(html, /Azkoiti/);
  assert.match(html, /CC BY-SA 4\.0/);
  assert.match(html, /CC BY-SA 3\.0/);
});

test('uses scene assets directly from the main stylesheet without the temporary scene-fix layer', () => {
  assert.doesNotMatch(html, /scene-fix\.css/);
  assert.match(css, /background-image:var\(--scene-image/);
  assert.match(css, /background-position:var\(--scene-x/);
});

test('renders exploration as a recognisable app preview instead of a decorative crop', () => {
  assert.match(html, /class="phone-shell/);
  assert.match(html, /class="phone-map/);
  assert.match(html, /Rutas cerca de ti/);
  assert.match(html, /Mapa/);
  assert.match(html, /Guardadas/);
  assert.match(css, /\.phone-shell/);
  assert.match(css, /\.phone-route-line/);
});

test('shows profile capabilities without fake user activity totals', () => {
  assert.match(html, /class="profile-ui/);
  assert.match(html, /Tu progreso/);
  assert.match(html, /Insignias/);
  assert.match(css, /\.profile-progress-bar/);
  assert.doesNotMatch(html, />24<|58 km/);
});

test('finishes with a premium but honest Android release panel', () => {
  assert.match(html, /data-download-device/);
  assert.match(html, /data-release-status="coming-soon"/);
  assert.match(html, /APK directa/);
  assert.match(html, /Google Play/);
  assert.match(html, /Próximamente/);
  assert.match(css, /\.download-device/);
  assert.match(css, /\.download-section::before/);
  assert.doesNotMatch(html, /href="https:\/\/play\.google\.com/);
});

test('keeps the four cinematic story titles in semantic HTML', () => {
  for (const text of [
    'Explora Sierra Mágina',
    'Cada ruta es una aventura',
    'Descubre lo que te rodea',
    'La aventura empieza aquí',
  ]) {
    assert.ok(html.includes(text), `missing story title: ${text}`);
  }
});

test('keeps exploration, profile and download destinations', () => {
  for (const id of ['exploracion', 'perfil', 'descarga']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});
