import '../src/activity/background-location-task';

import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { useEffect } from 'react';

const qaBypassAuth = process.env.EXPO_PUBLIC_QA_BYPASS_AUTH === '1';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === 'login';

    if (qaBypassAuth) {
      if (inAuthGroup) {
        router.replace('/');
      }
      return;
    }

    if (isLoading) return;

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (session && inAuthGroup) {
      // Redirect away from login if authenticated
      router.replace('/');
    }
  }, [session, isLoading, segments, router]);

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
