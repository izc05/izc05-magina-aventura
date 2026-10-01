import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeBrowserSupabaseKey } from '../src/core/config-guard.mjs';

function jwt(role) {
  const part = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ role, iss: 'supabase' })}.signature`;
}

test('accepts modern Supabase publishable keys', () => {
  assert.equal(assertSafeBrowserSupabaseKey('sb_publishable_example'), 'sb_publishable_example');
});

test('accepts legacy anon JWT keys', () => {
  const key = jwt('anon');
  assert.equal(assertSafeBrowserSupabaseKey(key), key);
});

test('rejects legacy service-role JWT keys', () => {
  assert.throws(() => assertSafeBrowserSupabaseKey(jwt('service_role')), /legacy anon JWT/);
});

test('rejects secret and malformed keys', () => {
  assert.throws(() => assertSafeBrowserSupabaseKey('sb_secret_example'), /Secret Supabase keys/);
  assert.throws(() => assertSafeBrowserSupabaseKey('eyJ.invalid'), /Malformed legacy Supabase JWT/);
});
