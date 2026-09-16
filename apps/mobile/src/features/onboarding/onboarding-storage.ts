import { ONBOARDING_STORAGE_KEY } from './onboarding-contract';

export type OnboardingMarkerPort = Readonly<{
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
}>;

export type OnboardingStorage = Readonly<{
  hasSeen(): Promise<boolean>;
  markSeen(): Promise<void>;
}>;

const completionMarker = `seen:${ONBOARDING_STORAGE_KEY}`;

export function createOnboardingStorage(port: OnboardingMarkerPort): OnboardingStorage {
  return {
    async hasSeen() {
      return (await port.read()) === completionMarker;
    },
    async markSeen() {
      await port.write(completionMarker);
    },
  };
}
