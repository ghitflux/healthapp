'use client';

/**
 * @file components/sections/app-shell-web.tsx
 * @description Organismo — Shell principal do painel web.
 * Compõe Sidebar + Header + area de conteúdo principal.
 * Substitui o layout inline repetido em (convenio) e (owner).
 */

import { Sidebar } from '@/components/navigation/sidebar';
import { Header } from '@/components/navigation/header';

export interface AppShellWebProps {
  variant: 'convenio' | 'owner';
  children: React.ReactNode;
}

export function AppShellWeb({ variant, children }: AppShellWebProps) {
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
      <Sidebar variant={variant} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main
          id="main-content"
          className="flex-1 overflow-auto p-6"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
