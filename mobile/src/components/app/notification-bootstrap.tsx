import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useNotifications } from '@/hooks/use-notifications';

export function NotificationBootstrap() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { registerCurrentDevice } = useNotifications();

  useEffect(() => {
    if (!isAuthenticated) return;
    void registerCurrentDevice();
  }, [isAuthenticated, registerCurrentDevice]);

  return null;
}
