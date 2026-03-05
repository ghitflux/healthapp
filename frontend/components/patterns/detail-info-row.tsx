/**
 * @file components/patterns/detail-info-row.tsx
 * @description Molecula — Linha label+valor para paineis de detalhe (Sheet/Drawer).
 */

import { cn } from '@/lib/utils';
import type { LucideIcon } from '@/lib/icons';
import type { ReactNode } from 'react';

export interface DetailInfoRowProps {
  label: string;
  value?: ReactNode;
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
}

export function DetailInfoRow({
  label,
  value,
  icon: Icon,
  children,
  className,
}: DetailInfoRowProps) {
  const resolvedValue = value ?? children ?? '—';

  return (
    <div className={cn('flex items-start gap-3 py-2', className)}>
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-semibold text-foreground">{resolvedValue}</dd>
      </div>
    </div>
  );
}
