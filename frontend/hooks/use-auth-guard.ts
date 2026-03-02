'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';

/**
 * useAuthGuard — Client-side route protection.
 * Strategy pattern: cada layout define os roles permitidos.
 */
export function useAuthGuard(allowedRoles: string[]) {
  const router = useRouter();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (authService.isTokenExpired()) {
      router.push('/login');
      return;
    }

    const role = authService.getUserRole();
    if (role && !allowedRoles.includes(role)) {
      // Redirecionar para o dashboard do role atual
      const redirectPath = authService.getRedirectPath();
      router.push(redirectPath);
    }
  }, [allowedRoles, router]);

  return {
    isAuthenticated: authService.isAuthenticated(),
    role: authService.getUserRole(),
  };
}
