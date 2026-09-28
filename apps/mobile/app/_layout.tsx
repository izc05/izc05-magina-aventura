import '../src/activity/background-location-task';

import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { useEffect } from 'react';

const QA_GUEST_MODE = process.env.EXPO_PUBLIC_QA_GUEST === '1';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading && !QA_GUEST_MODE) return;

    const inAuthGroup = segments[0] === 'login';

    if (QA_GUEST_MODE) {
      if (inAuthGroup) router.replace('/');
      return;
    }

    if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
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
