import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const testDir = dirname(fileURLToPath(import.meta.url));
const adminDir = resolve(testDir, '..');
const scriptPath = resolve(adminDir, 'scripts/write-config.mjs');
const configPath = resolve(adminDir, 'config.js');

test('write-config works when Netlify base directory is apps/admin', async () => {
  const original = await readFile(configPath, 'utf8');
  const markerUrl = 'https://example-staging.supabase.co';
  const markerKey = 'sb_publishable_netlify_base_test';

  try {
    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: adminDir,
      env: {
        ...process.env,
        MAGINA_ADMIN_SUPABASE_URL: markerUrl,
        MAGINA_ADMIN_SUPABASE_PUBLISHABLE_KEY: markerKey,
      },
      encoding: 'utf8',
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const generated = await readFile(configPath, 'utf8');
    assert.match(generated, new RegExp(markerUrl.replaceAll('.', '\\.')));
    assert.match(generated, new RegExp(markerKey));
  } finally {
    await writeFile(configPath, original, 'utf8');
  }
});
