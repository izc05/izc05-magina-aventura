import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const expoConfig = JSON.parse(readFileSync(resolve(mobileRoot, 'app.json'), 'utf8')).expo;
const androidConfig = expoConfig.android;
const blockedPermissions = new Set(androidConfig.blockedPermissions ?? []);
assert.deepEqual(androidConfig.permissions ?? [], ['android.permission.CAMERA']);
const mustRemainBlocked = [
  'android.permission.RECORD_AUDIO',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
  'android.permission.READ_MEDIA_AUDIO',
  'android.permission.MANAGE_EXTERNAL_STORAGE',
];

assert.equal(androidConfig.allowBackup, false, 'Private gallery files must not enter Android Auto Backup.');
for (const permission of mustRemainBlocked) {
  assert.ok(blockedPermissions.has(permission), `Expo config must block ${permission}.`);
}
assert.ok(!blockedPermissions.has('android.permission.CAMERA'), 'Camera must be the only gallery-related Android permission left available.');

const imagePickerPlugin = expoConfig.plugins.find(
  (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-image-picker',
);
assert.ok(imagePickerPlugin, 'expo-image-picker config plugin must be enabled.');
assert.match(
  imagePickerPlugin[1].cameraPermission,
  /c[aá]mara.*solo se usa cuando haces una foto.*no se sube ni sincroniza/i,
  'The iOS camera permission message must explain its on-demand, local-only use.',
);
assert.equal(imagePickerPlugin[1].microphonePermission, false, 'The microphone permission must stay disabled.');

// Expo's introspection evaluates safe native config mods in memory and does not write generated files.
const expoCli = resolve(mobileRoot, 'node_modules/.bin/expo');
const introspected = JSON.parse(execFileSync(expoCli, ['config', '--type', 'introspect', '--json'], {
  cwd: mobileRoot,
  encoding: 'utf8',
}));
const androidManifest = introspected._internal?.modResults?.android?.manifest?.manifest;
const iosInfoPlist = introspected._internal?.modResults?.ios?.infoPlist;
assert.ok(androidManifest, 'Expo introspection must return the evaluated Android manifest.');
assert.ok(iosInfoPlist, 'Expo introspection must return the evaluated iOS Info.plist.');

const permissionEntries = androidManifest['uses-permission'] ?? [];
const permissionName = (entry) => entry.$?.['android:name'];
const isRemoved = (entry) => entry.$?.['tools:node'] === 'remove';
const activeGalleryPermissions = permissionEntries
  .filter((entry) => !isRemoved(entry))
  .map(permissionName)
  .filter((permission) => permission && (
    permission === 'android.permission.CAMERA'
    || permission === 'android.permission.RECORD_AUDIO'
    || permission === 'android.permission.READ_EXTERNAL_STORAGE'
    || permission === 'android.permission.WRITE_EXTERNAL_STORAGE'
    || permission.startsWith('android.permission.READ_MEDIA_')
    || permission === 'android.permission.MANAGE_EXTERNAL_STORAGE'
  ))
  .sort();
assert.deepEqual(activeGalleryPermissions, ['android.permission.CAMERA']);
for (const permission of mustRemainBlocked) {
  assert.ok(
    permissionEntries.some((entry) => permissionName(entry) === permission && isRemoved(entry)),
    `The introspected manifest must remove ${permission}.`,
  );
}
assert.equal(androidManifest.application?.[0]?.$?.['android:allowBackup'], 'false');
assert.match(iosInfoPlist.NSCameraUsageDescription ?? '', /c[aá]mara.*solo se usa cuando haces una foto.*no se sube ni sincroniza/i);
assert.match(iosInfoPlist.NSPhotoLibraryUsageDescription ?? '', /solo en este dispositivo/i);
assert.equal(iosInfoPlist.NSMicrophoneUsageDescription, undefined);

console.log('Expo SDK 57 camera permission contract: PASS');
console.log('Introspected Android manifest allows CAMERA only; storage, media, and audio permissions are removed.');
console.log('iOS declares camera/photo purposes and no microphone purpose; no prebuild or native files were generated.');
