import test from 'node:test';
import assert from 'node:assert/strict';
import * as routeEditor from '../src/core/route-editor.mjs';

test('only super admin can permanently delete non-published routes', () => {
  assert.equal(typeof routeEditor.canPermanentlyDeleteRoute, 'function');
  assert.equal(routeEditor.canPermanentlyDeleteRoute({ status: 'draft' }, ['super_admin']), true);
  assert.equal(routeEditor.canPermanentlyDeleteRoute({ status: 'review' }, ['super_admin']), true);
  assert.equal(routeEditor.canPermanentlyDeleteRoute({ status: 'archived' }, ['super_admin']), true);
  assert.equal(routeEditor.canPermanentlyDeleteRoute({ status: 'published' }, ['super_admin']), false);
  assert.equal(routeEditor.canPermanentlyDeleteRoute({ status: 'archived' }, ['admin']), false);
});

test('route delete confirmation requires the exact route title twice', () => {
  assert.equal(typeof routeEditor.confirmRouteDeletionInput, 'function');
  assert.equal(routeEditor.confirmRouteDeletionInput('Sendero Las Viñas', 'Sendero Las Viñas'), true);
  assert.equal(routeEditor.confirmRouteDeletionInput('Sendero Las Viñas', 'sendero las viñas'), false);
  assert.equal(routeEditor.confirmRouteDeletionInput('Sendero Las Viñas', ''), false);
});
