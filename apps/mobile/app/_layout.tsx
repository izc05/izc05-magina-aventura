import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { startupBreadcrumb } from '../src/features/diagnostics/startup-breadcrumbs';
import { startupDiagnosticVariant } from '../src/features/diagnostics/startup-diagnostic-variant';

if (startupDiagnosticVariant !== 'A') {
  // Variant A intentionally excludes the background task from the startup graph.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('../src/activity/background-location-task');
}

startupBreadcrumb('root-layout');

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );
}
