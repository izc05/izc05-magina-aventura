import { Stack } from 'expo-router';
import { startupBreadcrumb } from '../src/features/diagnostics/startup-breadcrumbs';
import { startupDiagnosticVariant } from '../src/features/diagnostics/startup-diagnostic-variant';

if (startupDiagnosticVariant !== 'A' && startupDiagnosticVariant !== 'D') {
  // Product/B/C variants retain the Beta 02 background task registration.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('../src/activity/background-location-task');
}

startupBreadcrumb('root-layout');

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
