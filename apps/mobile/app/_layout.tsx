import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { useEffect } from 'react';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const qaRouteSimulatorEntry = process.env.EXPO_PUBLIC_QA_ROUTE_SIMULATOR_ENTRY === '1';

  useEffect(() => {
    if (qaRouteSimulatorEntry) {
      if (segments[0] !== 'qa') router.replace('/qa/route-simulator');
      return;
    }
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login';

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (session && inAuthGroup) {
      // Redirect away from login if authenticated
      router.replace('/');
    }
  }, [session, isLoading, segments, router, qaRouteSimulatorEntry]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthGuard>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
            }}
          />
        </AuthGuard>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
