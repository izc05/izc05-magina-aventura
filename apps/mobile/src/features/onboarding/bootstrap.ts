import type { OnboardingStorage } from './onboarding-storage';

export type OnboardingBootstrapResult = 'onboarding' | 'ready';

const DEFAULT_BOOTSTRAP_TIMEOUT_MS = 4_000;

/**
 * The native splash should only cover React Native initialization. Once JS is
 * running, a stuck or failed marker read must not leave the in-app launch
 * screen visible forever. A failed read preserves the existing safe fallback:
 * show the home screen without claiming onboarding was completed.
 */
export async function resolveOnboardingBootstrap(
  storage: Pick<OnboardingStorage, 'hasSeen'>,
  timeoutMs = DEFAULT_BOOTSTRAP_TIMEOUT_MS,
): Promise<OnboardingBootstrapResult> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    const seen = await Promise.race<boolean>([
      storage.hasSeen(),
      new Promise<boolean>((resolve) => {
        timeoutHandle = setTimeout(() => resolve(true), timeoutMs);
      }),
    ]);

    return seen ? 'ready' : 'onboarding';
  } catch {
    return 'ready';
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
  }
}
