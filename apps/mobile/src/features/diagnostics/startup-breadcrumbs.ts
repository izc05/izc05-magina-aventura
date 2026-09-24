const developmentBuild = typeof __DEV__ !== 'undefined' && __DEV__;
const qaBuild = process.env.EXPO_PUBLIC_ENABLE_QA_HARNESS === 'true';
const startupDiagnosticsEnabled = developmentBuild || qaBuild;

export type StartupBreadcrumb =
  | 'native-start'
  | 'react-runtime'
  | 'root-layout'
  | 'background-task-import'
  | 'onboarding-storage-start'
  | 'onboarding-storage-complete'
  | 'onboarding-mounted'
  | 'home-mounted';

/**
 * Emits non-personal startup breadcrumbs only in development or the QA APK.
 * Production bundles do not log these phase markers.
 */
export function startupBreadcrumb(phase: StartupBreadcrumb): void {
  if (!startupDiagnosticsEnabled) return;
  console.info(`[STARTUP][${phase}]`);
}

export function areStartupDiagnosticsEnabled(): boolean {
  return startupDiagnosticsEnabled;
}
