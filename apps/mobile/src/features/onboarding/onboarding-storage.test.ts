import { describe, expect, it } from 'vitest';

import { createOnboardingStorage } from './onboarding-storage';

describe('onboarding storage', () => {
  it('reports unseen when no marker exists and persists completion', async () => {
    let marker: string | null = null;
    const storage = createOnboardingStorage({
      async read() {
        return marker;
      },
      async write(value) {
        marker = value;
      },
    });

    await expect(storage.hasSeen()).resolves.toBe(false);
    await storage.markSeen();
    await expect(storage.hasSeen()).resolves.toBe(true);
  });

  it('only treats the exact versioned marker as completed', async () => {
    const storage = createOnboardingStorage({
      async read() {
        return 'old-version';
      },
      async write() {},
    });

    await expect(storage.hasSeen()).resolves.toBe(false);
  });
});
