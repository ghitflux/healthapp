'use client';

import { Sidebar } from '@/components/navigation/sidebar';
import { Header } from '@/components/navigation/header';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function ConvenioLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard(['convenio_admin', 'owner']);

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar variant="convenio" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
