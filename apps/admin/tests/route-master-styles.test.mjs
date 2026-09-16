import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const stylesUrl = new URL('../styles.css', import.meta.url);

test('route master has dedicated responsive visual styles', async () => {
  const css = await readFile(stylesUrl, 'utf8');
  for (const selector of [
    '.route-master-stage',
    '.route-master-header',
    '.route-master-tabs',
    '.route-master-tab',
    '.route-master-metrics',
    '.route-master-summary-grid',
    '.route-readiness-card'
  ]) {
    assert.match(css, new RegExp(selector.replaceAll('.', '\\.')));
  }
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /\.route-master-tabs[\s\S]*overflow-x:\s*auto/);
});

test('sources validation panel has dedicated cards, gate states and responsive layout', async () => {
  const css = await readFile(stylesUrl, 'utf8');
  for (const selector of [
    '.route-sources-layout',
    '.route-gate-card',
    '.route-validation-card',
    '.route-gate-list',
    '.route-gate-item.is-ready',
    '.route-gate-item.is-pending',
    '.route-source-card',
    '.route-track-provenance-grid',
    '.route-source-form'
  ]) {
    assert.match(css, new RegExp(selector.replaceAll('.', '\\.')));
  }
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.route-sources-layout[\s\S]*grid-template-columns:\s*1fr/);
});

test('track map panel has dedicated import and editor styles that collapse on mobile', async () => {
  const css = await readFile(stylesUrl, 'utf8');
  for (const selector of [
    '.route-track-panel',
    '.route-track-panel-heading',
    '.route-track-import-form',
    '.route-master-track-editor'
  ]) {
    assert.match(css, new RegExp(selector.replaceAll('.', '\\.')));
  }
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.route-track-import-form[\s\S]*grid-template-columns:\s*1fr/);
});
