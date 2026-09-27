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
  const stack = <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;

  if (startupDiagnosticVariant === 'A' || startupDiagnosticVariant === 'D') {
    return stack;
  }

  // Product/B/C screens use SafeAreaView. Keep the native diagnostics A/D
  // isolated from the provider so they can still bisect minimal startup.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const SafeAreaProvider = require('react-native-safe-area-context').SafeAreaProvider;
  return <SafeAreaProvider>{stack}</SafeAreaProvider>;
}
