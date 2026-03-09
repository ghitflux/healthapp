'use client';

import { useEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { configureKubbClient } from '@/lib/kubb-client';
import { api } from '@/lib/api';
import { authService } from '@/lib/auth';
import { getAuthUserConvenioId } from '@/lib/auth-user';
import { useAuthStore } from '@/stores/auth-store';

function AuthBootstrap() {
  const user = useAuthStore((state) => state.user);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setUser = useAuthStore((state) => state.setUser);
  const attemptedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const token = authService.getAccessToken();

    if (!token) {
      attemptedTokenRef.current = null;
      setLoading(false);
      return;
    }

    const role = authService.getUserRole();
    const needsUser = !user;
    const needsConvenio = role === 'convenio_admin' && !getAuthUserConvenioId(user);

    if (!needsUser && !needsConvenio) {
      return;
    }

    if (attemptedTokenRef.current === token) {
      return;
    }

    attemptedTokenRef.current = token;

    let cancelled = false;
    setLoading(true);

    void api
      .get('/v1/users/me/')
      .then((response) => {
        if (cancelled) return;
        setUser(response.data?.data ?? response.data);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [setLoading, setUser, user]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  configureKubbClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
