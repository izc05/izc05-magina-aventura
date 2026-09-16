import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const branding = readFileSync(new URL('../branding.css', import.meta.url), 'utf8');

test('uses the compact Mágina Aventura brand lockup instead of the large white logo card', () => {
  assert.match(html, /assets\/magina-aventura-icon\.svg/);
  assert.match(html, /class="hero-brand-lockup"/);
  assert.doesNotMatch(html, /hero-logo-panel/);
  assert.match(branding, /\.hero-brand-lockup/);
});

test('authors nine cinematic frames with progressive scene metadata', () => {
  const frames = html.match(/data-scene-frame="\d+"/g) ?? [];
  assert.equal(frames.length, 9, `expected 9 cinematic frames, found ${frames.length}`);
  for (const property of ['--scene-image', '--scene-x', '--scene-y', '--scene-zoom']) {
    assert.ok(html.includes(property), `missing ${property} scene metadata`);
  }
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
