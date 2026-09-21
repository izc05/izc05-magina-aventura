import type { ConfigContext } from 'expo/config';

const isPhase4cQa = process.env.APP_VARIANT === 'phase4c-qa';
const qaPackage = 'com.isivolt.maginaaventura.qa';

/**
 * The QA artifact has a distinct identity so it can coexist with a future
 * product build. APP_VARIANT is build configuration only; runtime TEST DATA
 * still requires the separately inlined EXPO_PUBLIC_ENABLE_QA_HARNESS flag.
 */
export default ({ config }: ConfigContext) => ({
  ...config,
  name: isPhase4cQa ? 'Mágina Aventura QA' : (config.name ?? 'Mágina Aventura'),
  android: {
    ...config.android,
    package: isPhase4cQa ? qaPackage : (config.android?.package ?? 'com.isivolt.maginaaventura'),
  },
  extra: {
    ...config.extra,
    buildType: isPhase4cQa ? 'phase4c-qa' : 'production',
  },
});
