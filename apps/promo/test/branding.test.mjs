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

test('keeps external photography out of the new cinematic runtime markup', () => {
  assert.doesNotMatch(html, /commons\.wikimedia\.org/);
  assert.doesNotMatch(html, /upload\.wikimedia\.org/);
  assert.match(html, /Dirección visual y escenas originales para Mágina Aventura/);
});

test('renders exploration as a recognisable app preview inside the app scene', () => {
  assert.match(html, /data-cinematic-scene="app"[\s\S]*class="phone-shell/);
  assert.match(html, /class="phone-map/);
  assert.match(html, /Rutas cerca de ti/);
  assert.match(html, /Mapa/);
  assert.match(html, /Guardadas/);
  assert.match(css, /\.phone-shell/);
  assert.match(css, /\.phone-route-line/);
});

test('shows profile capabilities inside the progress scene without fake totals', () => {
  assert.match(html, /data-cinematic-scene="progress"[\s\S]*class="profile-ui/);
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

test('keeps exploration, profile and download destinations', () => {
  for (const id of ['exploracion', 'perfil', 'descarga']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});
