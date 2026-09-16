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
