'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '@/lib/auth';

/**
 * useAuthGuard — Client-side route protection.
 * Strategy pattern: cada layout define os roles permitidos.
 */
export function useAuthGuard(allowedRoles: string[]) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace('/login');
      return;
    }

    if (authService.isTokenExpired()) {
      toast.error('Sessão expirada. Faça login novamente.');
      router.replace('/login');
      return;
    }

    const role = authService.getUserRole();
    if (role && !allowedRoles.includes(role)) {
      toast.error('Acesso negado para esta área.');
      router.replace(`/access-denied?from=${encodeURIComponent(pathname)}`);
    }
  }, [allowedRoles, pathname, router]);

  const role = authService.getUserRole();

  return {
    isAuthenticated: authService.isAuthenticated(),
    role,
    isAuthorized: !!role && allowedRoles.includes(role),
  };
}
