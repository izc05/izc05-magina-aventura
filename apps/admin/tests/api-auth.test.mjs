import test from 'node:test';
import assert from 'node:assert/strict';

class MemoryStorage {
  #data = new Map();
  getItem(key) { return this.#data.has(key) ? this.#data.get(key) : null; }
  setItem(key, value) { this.#data.set(key, String(value)); }
  removeItem(key) { this.#data.delete(key); }
}

test('api refreshes an expired access token once and retries the request', async () => {
  globalThis.sessionStorage = new MemoryStorage();
  globalThis.MAGINA_ADMIN_CONFIG = {
    supabaseUrl: 'https://example.supabase.co',
    publishableKey: 'sb_publishable_test'
  };

  const apiModule = await import(`../src/core/api.mjs?test=${Date.now()}`);
  apiModule.setSession({ access_token: 'expired', refresh_token: 'refresh-1', user: { id: 'user-1' } });

  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('/auth/v1/token?grant_type=refresh_token')) {
      return new Response(JSON.stringify({ access_token: 'fresh', refresh_token: 'refresh-2', user: { id: 'user-1' } }), { status: 200 });
    }
    const auth = options.headers?.authorization;
    if (auth === 'Bearer expired') {
      return new Response(JSON.stringify({ message: 'JWT expired' }), { status: 401 });
    }
    assert.equal(auth, 'Bearer fresh');
    return new Response(JSON.stringify([{ id: 'route-1' }]), { status: 200 });
  };

  const rows = await apiModule.table('routes', '?select=id');
  assert.deepEqual(rows, [{ id: 'route-1' }]);
  assert.equal(calls.filter((call) => call.url.includes('grant_type=refresh_token')).length, 1);
  assert.equal(apiModule.getSession().access_token, 'fresh');
});
