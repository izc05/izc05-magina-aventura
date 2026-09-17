import assert from 'node:assert/strict';
import test from 'node:test';
import {
  routeCodeFromEyebrowText,
  shouldShowCatalogTab,
} from '../catalog-route-tools.mjs';

test('route code parser extracts MA code from Route Master eyebrow', () => {
  assert.equal(routeCodeFromEyebrowText('Bedmar y Garcíez · MA-010'), 'MA-010');
  assert.equal(routeCodeFromEyebrowText('Torres · MA-008'), 'MA-008');
  assert.equal(routeCodeFromEyebrowText('Ruta sin código'), null);
});

test('catalog tab is shown only when canonical profile exists', () => {
  assert.equal(shouldShowCatalogTab({ catalog_profile: { canonical_catalog_id: 'ma-junta-001' } }), true);
  assert.equal(shouldShowCatalogTab({ catalog_profile: null }), false);
  assert.equal(shouldShowCatalogTab({}), false);
});
