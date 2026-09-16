import test from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_NAV_ITEMS } from '../src/core/navigation.mjs';
import { can } from '../src/core/roles.mjs';

const requiredIds = [
  'dashboard','routes','map','discoveries','media','users','community','moderation',
  'gamification','olives','rewards','partners','redemptions','notifications','safety','admins','audit','settings'
];

test('admin navigation exposes every agreed management area with unique hrefs', () => {
  assert.deepEqual(ADMIN_NAV_ITEMS.map((item) => item.id), requiredIds);
  assert.equal(new Set(ADMIN_NAV_ITEMS.map((item) => item.href)).size, ADMIN_NAV_ITEMS.length);
});

test('super admin can manage every capability while partner is scoped', () => {
  for (const item of ADMIN_NAV_ITEMS) assert.equal(can('super_admin', item.capability), true);
  assert.equal(can('partner', 'rewards.manage'), true);
  assert.equal(can('partner', 'redemptions.manage'), true);
  assert.equal(can('partner', 'routes.manage'), false);
  assert.equal(can('moderator', 'moderation.manage'), true);
  assert.equal(can('moderator', 'admins.manage'), false);
});
