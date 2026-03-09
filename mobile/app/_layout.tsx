import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { configureKubbClient } from '@/lib/kubb-client';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth-store';
import { NotificationBootstrap } from '@/components/app/notification-bootstrap';
import { OptionalStripeProvider } from '@/components/providers/optional-stripe-provider';

configureKubbClient();

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <OptionalStripeProvider>
            <StatusBar style="dark" />
            <NotificationBootstrap />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="search" options={{ presentation: 'card', headerShown: false }} />
              <Stack.Screen name="doctor/[id]" />
              <Stack.Screen name="clinic/[id]" />
              <Stack.Screen name="booking" />
              <Stack.Screen name="+not-found" />
            </Stack>
          </OptionalStripeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
