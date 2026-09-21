import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const projectRoot = process.cwd();
const syntheticMarkers = [
  'dev-adventure-engine-test',
  'DEV ONLY · TEST DATA',
  'QA ONLY · TEST DATA',
  'QA · SIMULADOR TEST DATA',
  'Adventure Engine v2 · TEST DATA',
  'dev-bedmar-cuadros-001',
  'Sendero de Cuadros',
  'Bedmar y Garcíez',
];

function exportReadableBundle(label, environment) {
  const output = mkdtempSync(join(tmpdir(), `magina-phase4c-${label}-`));

  try {
    execFileSync(
      'pnpm',
      ['exec', 'expo', 'export', '--platform', 'android', '--no-bytecode', '--no-minify', '--output-dir', output],
      {
        cwd: projectRoot,
        env: { ...process.env, ...environment },
        stdio: 'inherit',
      },
    );

    const bundlePath = join(output, '_expo', 'static', 'js', 'android');
    const bundleName = execFileSync('find', [bundlePath, '-maxdepth', '1', '-name', '*.js', '-printf', '%f'], {
      encoding: 'utf8',
    }).trim();
    if (!bundleName) throw new Error(`${label}: readable Android bundle was not emitted`);

    return readFileSync(join(bundlePath, bundleName), 'utf8');
  } finally {
    rmSync(output, { force: true, recursive: true });
  }
}

function assertIncludes(bundle, marker, label) {
  if (!bundle.includes(marker)) {
    throw new Error(`${label}: expected marker was not embedded: ${marker}`);
  }
}

function assertExcludes(bundle, marker, label) {
  if (bundle.includes(marker)) {
    throw new Error(`${label}: prohibited marker was embedded: ${marker}`);
  }
}

const qaBundle = exportReadableBundle('qa', {
  APP_VARIANT: 'phase4c-qa',
  EXPO_PUBLIC_ENABLE_QA_HARNESS: 'true',
  EXPO_PUBLIC_BUILD_TYPE: 'phase4c-qa',
});
assertIncludes(qaBundle, 'dev-adventure-engine-test', 'QA standalone');
assertIncludes(qaBundle, 'Adventure Engine v2 · TEST DATA', 'QA standalone');

const productBundle = exportReadableBundle('product', {
  APP_VARIANT: 'production',
  EXPO_PUBLIC_ENABLE_QA_HARNESS: 'false',
  EXPO_PUBLIC_BUILD_TYPE: 'production',
});
for (const marker of syntheticMarkers) {
  assertExcludes(productBundle, marker, 'Production release');
}

console.log('Phase 4C bundle isolation passed: QA contains TEST DATA; production contains none.');
