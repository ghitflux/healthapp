'use client';

/**
 * @file components/patterns/page-breadcrumb.tsx
 * @description Molecula — Breadcrumb padronizado para páginas internas.
 */

import Link from 'next/link';
import { Fragment } from 'react';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  doctors: 'Médicos',
  schedules: 'Agendas',
  exams: 'Exames',
  appointments: 'Agendamentos',
  financial: 'Financeiro',
  settings: 'Configurações',
  convenios: 'Convênios',
  users: 'Usuários',
  analytics: 'Analytics',
  'audit-logs': 'Auditoria',
};

export interface PageBreadcrumbItem {
  label: string;
  href?: string;
}

function prettifySegment(segment: string) {
  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildBreadcrumbItems(pathname: string): PageBreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [{ label: 'Painel' }];
  }

  const [rootSegment, ...tailSegments] = segments;
  const items: PageBreadcrumbItem[] = [
    {
      label: 'Painel',
      href: rootSegment ? `/${rootSegment}/dashboard` : undefined,
    },
  ];

  tailSegments.forEach((segment, index) => {
    const isLast = index === tailSegments.length - 1;
    const href = isLast
      ? undefined
      : `/${[rootSegment, ...tailSegments.slice(0, index + 1)].join('/')}`;

    items.push({
      label: SEGMENT_LABELS[segment] ?? prettifySegment(segment),
      href,
    });
  });

  return items;
}

export function buildBreadcrumbLabel(pathname: string) {
  return buildBreadcrumbItems(pathname)
    .map((item) => item.label)
    .join(' › ');
}

export interface PageBreadcrumbProps {
  items?: PageBreadcrumbItem[];
}

export function PageBreadcrumb({ items }: PageBreadcrumbProps) {
  const pathname = usePathname();
  const resolvedItems = items && items.length > 0 ? items : buildBreadcrumbItems(pathname);

  if (resolvedItems.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {resolvedItems.map((item, index) => {
          const isLast = index === resolvedItems.length - 1;

          return (
            <Fragment key={`${item.label}-${item.href ?? index}`}>
              <BreadcrumbItem>
                {item.href && !isLast ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
