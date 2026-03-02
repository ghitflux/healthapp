'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppShellWeb } from '@/components/sections/app-shell-web';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard(['owner']);

  return <AppShellWeb variant="owner">{children}</AppShellWeb>;
}
