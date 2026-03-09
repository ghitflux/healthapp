'use client';

/**
 * @file components/sections/convenio/convenio-page-wrapper.tsx
 * @description Wrapper client-side para páginas do convênio.
 * Resolve o convenioId mesmo quando a sessão persistida ainda não foi normalizada.
 */

import { useResolvedConvenioId } from '@/hooks/convenio/use-resolved-convenio-id';

interface ConvenioPageWrapperProps {
  children: (convenioId: string) => React.ReactNode;
}

export function ConvenioPageWrapper({ children }: ConvenioPageWrapperProps) {
  const { convenioId } = useResolvedConvenioId();
  return <>{children(convenioId)}</>;
}
