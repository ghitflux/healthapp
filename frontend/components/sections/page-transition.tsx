'use client';

/**
 * @file components/sections/page-transition.tsx
 * @description Wrapper de View Transitions para navegação entre páginas.
 * Usa a API nativa do React 19 (startViewTransition) com fallback gracioso.
 * Respeita prefers-reduced-motion via CSS.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    // View Transitions API — graceful fallback se não suportado
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).startViewTransition(() => {});
    }
  }, [pathname]);

  return (
    <div
      className="view-transition-root min-h-full"
      style={{ viewTransitionName: 'page-content' }}
    >
      {children}
    </div>
  );
}
