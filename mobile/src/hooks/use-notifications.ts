import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { UnreadCount } from '@api/types/UnreadCount';
import { useGetUnreadNotificationCount, useRegisterDeviceToken } from '@api/hooks/useNotifications';
import { unwrapEnvelope } from '@/lib/api-envelope';
import { useAuthStore } from '@/stores/auth-store';

function canAttemptNativePushRegistration() {
  if (Constants.appOwnership === 'expo') {
    return false;
  }

  const expoConfig = Constants.expoConfig;
  return Boolean(expoConfig?.android?.googleServicesFile || expoConfig?.ios?.googleServicesFile);
}

export function useNotifications() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const unreadQuery = useGetUnreadNotificationCount({
    query: {
      enabled: isAuthenticated,
    },
  });
  const registerMutation = useRegisterDeviceToken();

  const unreadCount = unwrapEnvelope<UnreadCount>(unreadQuery.data)?.count ?? 0;

  async function registerCurrentDevice() {
    if (!canAttemptNativePushRegistration()) {
      return false;
    }

    try {
      const messagingModule = await import('@react-native-firebase/messaging');
      const messaging = messagingModule.default;

      await messaging().requestPermission();
      const token = await messaging().getToken();

      if (!token) return false;

      await registerMutation.mutateAsync({
        data: {
          token,
          device_type: Platform.OS === 'ios' ? 'ios' : 'android',
        },
      });

      return true;
    } catch (error) {
      console.warn('Push registration unavailable on this device/build:', error);
      return false;
    }
  }

  return {
    unreadCount,
    registerCurrentDevice,
    unreadQuery,
  };
}
