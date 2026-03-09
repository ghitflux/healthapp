import { useEffect, useEffectEvent } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useNotifications } from '@/hooks/use-notifications';

export function NotificationBootstrap() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { registerCurrentDevice } = useNotifications();

  const registerEvent = useEffectEvent(async () => {
    await registerCurrentDevice();
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    registerEvent();
  }, [isAuthenticated, registerEvent]);

  return null;
}
