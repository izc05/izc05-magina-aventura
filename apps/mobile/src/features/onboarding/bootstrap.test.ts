import { describe, expect, it, vi } from 'vitest';

import { resolveOnboardingBootstrap } from './bootstrap';

describe('resolveOnboardingBootstrap', () => {
  it('routes a first launch to onboarding', async () => {
    await expect(
      resolveOnboardingBootstrap({ hasSeen: async () => false }),
    ).resolves.toBe('onboarding');
  });

  it('continues to the app when the marker exists', async () => {
    await expect(
      resolveOnboardingBootstrap({ hasSeen: async () => true }),
    ).resolves.toBe('ready');
  });

  it('continues to the app after a recoverable marker read failure', async () => {
    await expect(
      resolveOnboardingBootstrap({ hasSeen: async () => { throw new Error('storage unavailable'); } }),
    ).resolves.toBe('ready');
  });

  it('bounds a non-settling marker read instead of showing launch UI forever', async () => {
    vi.useFakeTimers();
    const result = resolveOnboardingBootstrap(
      { hasSeen: async () => new Promise<boolean>(() => undefined) },
      500,
    );

    await vi.advanceTimersByTimeAsync(500);
    await expect(result).resolves.toBe('ready');
    vi.useRealTimers();
  });
});
