import '../src/activity/background-location-task';

import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { startupBreadcrumb } from '../src/features/diagnostics/startup-breadcrumbs';

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
