import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMediaTags, sanitizeMediaFilename, buildMediaObjectKey } from '../src/core/media.mjs';

test('normalizeMediaTags trims, lowercases and deduplicates tags', () => {
  assert.deepEqual(normalizeMediaTags(' Ruta, OLIVAR, ruta ,  Patrimonio '), ['ruta','olivar','patrimonio']);
});

test('sanitizeMediaFilename strips unsafe filename characters and transliterates accents', () => {
  assert.equal(sanitizeMediaFilename('Mi foto (final) ñ.jpg'), 'Mi-foto-final-n.jpg');
});

test('buildMediaObjectKey keeps files under the media namespace', () => {
  const key = buildMediaObjectKey('uuid-123', 'sendero.jpg');
  assert.equal(key, 'uploads/uuid-123-sendero.jpg');
});
