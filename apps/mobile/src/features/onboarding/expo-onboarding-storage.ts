import { Directory, File, Paths } from 'expo-file-system';

import { createOnboardingStorage } from './onboarding-storage';

const root = new Directory(Paths.document, 'magina-aventura');
const markerFile = new File(root, 'onboarding-v1.txt');

function ensureRoot() {
  if (!root.exists) {
    root.create({ intermediates: true, idempotent: true });
  }
}

export const expoOnboardingStorage = createOnboardingStorage({
  async read() {
    ensureRoot();
    if (!markerFile.exists) return null;
    return markerFile.text();
  },
  async write(value) {
    ensureRoot();
    markerFile.write(value);
  },
});
