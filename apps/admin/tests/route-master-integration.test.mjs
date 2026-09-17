import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sourceUrl = new URL('../route-admin-tools.mjs', import.meta.url);
const sourceBaseUrl = new URL('../route-admin-tools-base.mjs', import.meta.url);
const visualToolsUrl = new URL('../visual-tools.mjs', import.meta.url);
const safetyToolsUrl = new URL('../safety-tools.mjs', import.meta.url);

async function source() {
  const [base, extension] = await Promise.all([
    readFile(sourceBaseUrl, 'utf8'),
    readFile(sourceUrl, 'utf8')
  ]);
  return `${base}\n${extension}`;
}

async function visualSource() {
  return readFile(visualToolsUrl, 'utf8');
}

async function safetySource() {
  return readFile(safetyToolsUrl, 'utf8');
}

test('route admin integrates the master snapshot and human-facing rows', async () => {
  const text = await source();
  assert.match(text, /routeListRowHtml/);
  assert.match(text, /routeMasterShellHtml/);
  assert.match(text, /admin_route_master_snapshot/);
  assert.match(text, /data-route-open/);
  assert.doesNotMatch(text, /route-technical-id/);
});

test('route master navigation does not put route UUID into visible data attributes', async () => {
  const text = await source();
  assert.match(text, /routeBySlug/);
  assert.doesNotMatch(text, /data-route-open=\\?"\$\{esc\(route\.id\)\}/);
});

test('route master wires source and validation forms to protected RPCs and refreshes the snapshot', async () => {
  const text = await source();
  assert.match(text, /\[data-route-source-form\]/);
  assert.match(text, /\[data-route-validation-form\]/);
  assert.match(text, /admin_add_route_source/);
  assert.match(text, /admin_update_route_validation/);
  assert.match(text, /source_label/);
  assert.match(text, /source_official/);
  assert.match(text, /validation_notes/);
  assert.match(text, /admin_route_master_snapshot/);
  assert.match(text, /renderRouteMaster/);
});

test('route master track tab reuses visual editor and imports GPX KML with the internal route id', async () => {
  const [adminText, visualText] = await Promise.all([source(), visualSource()]);
  assert.match(adminText, /mountRouteEditor/);
  assert.match(adminText, /parseTrackText/);
  assert.match(adminText, /sha256Hex/);
  assert.match(adminText, /\[data-route-track-import-form\]/);
  assert.match(adminText, /admin_import_route_track/);
  assert.match(adminText, /geometry_wkt/);
  assert.match(adminText, /original_filename/);
  assert.match(adminText, /file_hash/);
  assert.match(adminText, /target_route_id:\s*route\.id/);
  assert.match(visualText, /export\s+async\s+function\s+mountRouteEditor/);
});

test('route master content form builds the V2 payload, versions it with the internal route id and refreshes content', async () => {
  const text = await source();
  assert.match(text, /\[data-route-content-form\]/);
  assert.match(text, /admin_update_route_content_v2/);
  assert.match(text, /content_payload/);
  assert.match(text, /target_route_id:\s*route\.id/);
  assert.match(text, /getAll\(['"]recommended_seasons['"]\)/);
  assert.match(text, /editorial_sections/);
  for (const field of [
    'elevation_loss_m','elevation_min_m','elevation_max_m','route_kind','access_notes',
    'parking_notes','water_notes','shade_notes','coverage_notes','reward_xp','reward_olives'
  ]) {
    assert.match(text, new RegExp(field));
  }
  assert.match(text, /reloadRouteMaster\(stage, list, route, ['"]content['"]\)/);
});

test('route master discovery cards save metadata through RLS-backed table update and refresh discoveries', async () => {
  const text = await source();
  assert.match(text, /import\s*\{[^}]*patch[^}]*\}\s*from\s*['"]\.\/src\/core\/api\.mjs['"]/s);
  assert.match(text, /querySelectorAll\(['"]\[data-route-discovery-form\]['"]\)/);
  assert.match(text, /snapshot\.discoveries/);
  assert.match(text, /dataset\.discoveryIndex/);
  assert.match(text, /patch\(['"]discoveries['"]/);
  assert.match(text, /name:/);
  assert.match(text, /category:/);
  assert.match(text, /trigger_radius_m:/);
  assert.match(text, /reward_xp:/);
  assert.match(text, /reward_olives:/);
  assert.match(text, /active:/);
  assert.match(text, /reloadRouteMaster\(stage, list, route, ['"]discoveries['"]\)/);
});

test('route master media cards save asset metadata and selected-route relation without exposing route ids', async () => {
  const text = await source();
  assert.match(text, /querySelectorAll\(['"]\[data-route-media-form\]['"]\)/);
  assert.match(text, /snapshot\.media/);
  assert.match(text, /dataset\.mediaIndex/);
  assert.match(text, /patch\(['"]media_assets['"]/);
  assert.match(text, /title:/);
  assert.match(text, /alt_text:/);
  assert.match(text, /archived:/);
  assert.match(text, /patch\(['"]route_media['"]/);
  assert.match(text, /route_id=eq\.\$\{encodeURIComponent\(route\.id\)\}/);
  assert.match(text, /media_id=eq\.\$\{encodeURIComponent\(media\.id\)\}/);
  assert.match(text, /kind=eq\.\$\{encodeURIComponent\(media\.kind\)\}/);
  assert.match(text, /kind:/);
  assert.match(text, /sort_order:/);
  assert.match(text, /reloadRouteMaster\(stage, list, route, ['"]media['"]\)/);
});

test('route master safety actions resolve the selected route by slug, create incidents and resolve snapshot incidents', async () => {
  const text = await safetySource();
  assert.match(text, /data-route-safety-slug/);
  assert.match(text, /dataset\.routeSafetySlug/);
  assert.match(text, /table\(['"]routes['"]/);
  assert.match(text, /slug=eq\.\$\{encodeURIComponent\(slug\)\}/);
  assert.match(text, /\[data-route-safety-form\]/);
  assert.match(text, /insert\(['"]route_safety_incidents['"]/);
  assert.match(text, /route_id:\s*route\.id/);
  assert.match(text, /blocks_adventure:/);
  assert.match(text, /ends_at:/);
  assert.match(text, /admin_route_master_snapshot/);
  assert.match(text, /\[data-route-safety-resolve\]/);
  assert.match(text, /dataset\.routeSafetyResolve/);
  assert.match(text, /snapshot\.safety/);
  assert.match(text, /admin_resolve_safety/);
  assert.match(text, /incident_id:\s*incident\.id/);
});