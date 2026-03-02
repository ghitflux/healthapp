'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppShellWeb } from '@/components/sections/app-shell-web';

export default function ConvenioLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard(['convenio_admin', 'owner']);

  return <AppShellWeb variant="convenio">{children}</AppShellWeb>;
}
