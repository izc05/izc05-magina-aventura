import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../branding.css', import.meta.url), 'utf8');

test('uses the compact Mágina Aventura brand lockup instead of the large white logo card', () => {
  assert.match(html, /assets\/magina-aventura-icon\.svg/);
  assert.match(html, /class="hero-brand-lockup"/);
  assert.doesNotMatch(html, /hero-logo-panel/);
  assert.match(css, /\.hero-brand-lockup/);
});

test('uses valid independent cinematic scenes instead of the broken sprite', () => {
  for (const scene of ['scene-01.webp', 'scene-06.webp', 'scene-09.webp']) {
    assert.ok(html.includes(`assets/scenes/${scene}`), `missing cinematic scene: ${scene}`);
  }
  assert.doesNotMatch(html, /cinematic-sequence\.webp/);
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
