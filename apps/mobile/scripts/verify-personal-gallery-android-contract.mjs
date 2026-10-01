import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const expoConfig = JSON.parse(readFileSync(resolve(mobileRoot, 'app.json'), 'utf8')).expo;
const androidConfig = expoConfig.android;
const blockedPermissions = new Set(androidConfig.blockedPermissions ?? []);
const requiredBlockedPermissions = [
  'android.permission.CAMERA',
  'android.permission.RECORD_AUDIO',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
  'android.permission.READ_MEDIA_AUDIO',
  'android.permission.MANAGE_EXTERNAL_STORAGE',
];

assert.equal(androidConfig.allowBackup, false, 'Personal photos must not enter Android Auto Backup.');
for (const permission of requiredBlockedPermissions) {
  assert.ok(blockedPermissions.has(permission), `Expo config must block ${permission}.`);
}

const imagePickerPlugin = expoConfig.plugins.find(
  (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-image-picker',
);
assert.ok(imagePickerPlugin, 'expo-image-picker config plugin must be enabled.');
assert.equal(imagePickerPlugin[1].cameraPermission, false);
assert.equal(imagePickerPlugin[1].microphonePermission, false);

const manifestPath = resolve(mobileRoot, 'android/app/src/main/AndroidManifest.xml');
const manifest = readFileSync(manifestPath, 'utf8');
const permissionTags = [...manifest.matchAll(/<uses-permission(?:-sdk-\d+)?\b[^>]*>/g)];
const permissionMergeRules = new Map(
  permissionTags.flatMap(([tag]) => {
    const name = tag.match(/android:name="([^"]+)"/)?.[1];
    if (!name) return [];
    const mergeRule = tag.match(/tools:node="([^"]+)"/)?.[1] ?? 'merge';
    return [[name, mergeRule]];
  }),
);
for (const permission of requiredBlockedPermissions) {
  const mergeRule = permissionMergeRules.get(permission);
  assert.ok(
    mergeRule === undefined || mergeRule === 'remove',
    `Generated manifest must omit or remove ${permission}; got merge rule ${mergeRule}.`,
  );
}
assert.match(manifest, /android:allowBackup="false"/, 'Generated Android app must opt out of cloud backup.');

console.log('Android personal-gallery permission contract: PASS');
console.log('Photo Picker only; broad media/storage and camera permissions are absent or marked for removal.');
