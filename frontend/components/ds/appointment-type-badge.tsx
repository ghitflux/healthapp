/**
 * @file components/ds/appointment-type-badge.tsx
 * @description Atom de dominio — Badge visual para tipos de agendamento.
 */

import { cn } from '@/lib/utils';
import type { AppointmentTypeEnum } from '@api/types/AppointmentTypeEnum';

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  consultation: {
    label: 'Consulta',
    className:
      'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400',
  },
  exam: {
    label: 'Exame',
    className:
      'bg-[#f5f3ff] text-[#4c1d95] border border-[#ede9fe] dark:bg-purple-900/20 dark:text-purple-400',
  },
  return_visit: {
    label: 'Retorno',
    className:
      'bg-[#f0fdfa] text-[#134e4a] border border-[#ccfbf1] dark:bg-teal-900/20 dark:text-teal-400',
  },
};

export interface AppointmentTypeBadgeProps {
  type: AppointmentTypeEnum;
  label?: string;
  className?: string;
}

export function AppointmentTypeBadge({ type, label, className }: AppointmentTypeBadgeProps) {
  const config = TYPE_CONFIG[type] ?? {
    label: type,
    className: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {label ?? config.label}
    </span>
  );
}
