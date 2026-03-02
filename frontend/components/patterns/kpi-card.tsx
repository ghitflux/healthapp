/**
 * @file components/patterns/kpi-card.tsx
 * @description Molécula — KPI Card com suporte a trend, descrição e skeleton.
 * Localização canônica no design system (migrado de components/data-display/).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrendChip } from '@/components/ds/trend-chip';
import type { LucideIcon } from '@/lib/icons';

export interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  description?: string;
  trend?: {
    value: number;
    invertSemantic?: boolean;
  };
  className?: string;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  iconColor,
  description,
  trend,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn('shadow-card', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={cn('h-4 w-4 shrink-0', iconColor ?? 'text-muted-foreground')} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="mt-1">
            <TrendChip
              value={trend.value}
              invertSemantic={trend.invertSemantic}
            />
            <span className="text-xs text-muted-foreground ml-1">vs. mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('shadow-card', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export function KpiGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  } as const;

  return (
    <div className={cn('grid gap-4', colClasses[columns], className)}>
      {children}
    </div>
  );
}
