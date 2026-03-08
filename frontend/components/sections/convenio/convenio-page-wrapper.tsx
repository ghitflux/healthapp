'use client';

/**
 * @file components/sections/convenio/convenio-page-wrapper.tsx
 * @description Wrapper client-side para páginas do convênio.
 * Extrai o convenioId do auth store e injeta nas páginas.
 */

import { useAuthStore } from '@/stores/auth-store';
import { getAuthUserConvenioId } from '@/lib/auth-user';

interface ConvenioPageWrapperProps {
  children: (convenioId: string) => React.ReactNode;
}

export function ConvenioPageWrapper({ children }: ConvenioPageWrapperProps) {
  const user = useAuthStore((s) => s.user);
  const convenioId = getAuthUserConvenioId(user);
  return <>{children(convenioId)}</>;
}
