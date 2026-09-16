import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('uses the official Mágina Aventura brand assets', () => {
  assert.match(html, /assets\/magina-aventura-icon\.svg/);
  assert.match(html, /assets\/magina-aventura-logo\.svg/);
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
