const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const isExplicitQaBuild =
  process.env.EXPO_PUBLIC_ENABLE_QA_HARNESS === 'true' ||
  process.env.APP_VARIANT === 'phase4c-qa';
const isDevelopmentServer = process.env.NODE_ENV === 'development';
const isProductBundle = !isExplicitQaBuild && !isDevelopmentServer;

/**
 * A conditional require alone still lets Metro crawl the QA graph. Production
 * exports therefore resolve both QA implementation leaves to zero-data stubs.
 * Development and the explicit Phase 4C QA build use the real harness.
 */
if (isProductBundle) {
  const qaHarnessPath = path.join(__dirname, 'src/features/qa/qa-adventure-engine-harness.production.ts');
  const qaSimulationPath = path.join(__dirname, 'src/activity/qa-simulation-runtime.production.ts');
  const routeFixturesPath = path.join(__dirname, 'src/features/routes/fixtures.production.ts');
  const qaHarnessCardPath = path.join(__dirname, 'src/features/qa/QaHarnessCard.production.tsx');
  const qaSimulationPanelPath = path.join(__dirname, 'src/features/qa/QaSimulationPanel.production.tsx');

  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (
      moduleName === './qa-adventure-engine-harness' &&
      context.originModulePath.endsWith(`${path.sep}qa-harness.ts`)
    ) {
      return { filePath: qaHarnessPath, type: 'sourceFile' };
    }

    if (
      (moduleName === './qa-simulation-runtime' || moduleName === '../../activity/qa-simulation-runtime') &&
      (
        context.originModulePath.endsWith(`${path.sep}qa-harness.ts`) ||
        context.originModulePath.endsWith(`${path.sep}activity-runtime.ts`)
      )
    ) {
      return { filePath: qaSimulationPath, type: 'sourceFile' };
    }

    if (
      moduleName === '../routes/fixtures' &&
      context.originModulePath.endsWith(`${path.sep}qa-harness.ts`)
    ) {
      return { filePath: routeFixturesPath, type: 'sourceFile' };
    }

    if (
      moduleName === './QaHarnessCard' &&
      context.originModulePath.endsWith(`${path.sep}qa-harness.ts`)
    ) {
      return { filePath: qaHarnessCardPath, type: 'sourceFile' };
    }

    if (
      moduleName === './QaSimulationPanel' &&
      context.originModulePath.endsWith(`${path.sep}qa-harness.ts`)
    ) {
      return { filePath: qaSimulationPanelPath, type: 'sourceFile' };
    }

    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = config;
