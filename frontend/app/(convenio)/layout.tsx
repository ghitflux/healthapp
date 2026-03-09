'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useResolvedConvenioId } from '@/hooks/convenio/use-resolved-convenio-id';
import { AppShellWeb } from '@/components/sections/app-shell-web';

export default function ConvenioLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard(['convenio_admin', 'owner']);
  useResolvedConvenioId();

  return <AppShellWeb variant="convenio">{children}</AppShellWeb>;
}
