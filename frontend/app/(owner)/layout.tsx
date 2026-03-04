'use client';

import { useEffect } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppShellWeb } from '@/components/sections/app-shell-web';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard(['owner']);

  useEffect(() => {
    function preloadOwnerSections() {
      void import('@/features/owner/owner-dashboard-page-content');
      void import('@/features/owner/owner-convenios-page-content');
      void import('@/features/owner/owner-users-page-content');
      void import('@/features/owner/owner-audit-logs-page-content');
      void import('@/features/owner/owner-financial-page-content');
      void import('@/features/owner/owner-settings-page-content');
      void import('@/features/owner/owner-analytics-page-content');
    }

    if (typeof window === 'undefined') return;

    const win = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof win.requestIdleCallback === 'function') {
      const idleId = win.requestIdleCallback(() => preloadOwnerSections(), { timeout: 1200 });
      return () => {
        if (typeof win.cancelIdleCallback === 'function') {
          win.cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = setTimeout(preloadOwnerSections, 900);
    return () => clearTimeout(timeoutId);
  }, []);

  return <AppShellWeb variant="owner">{children}</AppShellWeb>;
}
