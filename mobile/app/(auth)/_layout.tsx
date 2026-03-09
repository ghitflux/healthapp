import { Redirect, Stack, usePathname } from 'expo-router';
import { LoadingScreen } from '@/components/layout/loading-screen';
import { useAuthStore } from '@/stores/auth-store';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const pathname = usePathname();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const isOtpPath = pathname.endsWith('/verify-email') || pathname.endsWith('/verify-phone');

  if (isAuthenticated && !isOtpPath) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="register-clinic" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="verify-phone" />
    </Stack>
  );
}
