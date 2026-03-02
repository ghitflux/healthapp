/**
 * @file components/ds/status-pill.tsx
 * @description Atom de domínio — Pill visual para status de agendamentos e pagamentos.
 * Usa as CSS vars --color-status-* definidas em globals.css.
 */

import { cn } from '@/lib/utils';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

type StatusKey = AppointmentStatus | PaymentStatus;

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pendente',
    className:
      'bg-warning-50 text-warning-700 border border-warning-200 dark:bg-warning-900/20 dark:text-warning-400',
  },
  confirmed: {
    label: 'Confirmado',
    className:
      'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400',
  },
  in_progress: {
    label: 'Em andamento',
    className:
      'bg-[#f5f3ff] text-[#4c1d95] border border-[#ede9fe] dark:bg-purple-900/20 dark:text-purple-400',
  },
  completed: {
    label: 'Concluído',
    className:
      'bg-success-50 text-success-700 border border-success-100 dark:bg-success-900/20 dark:text-success-400',
  },
  cancelled: {
    label: 'Cancelado',
    className:
      'bg-danger-50 text-danger-700 border border-danger-100 dark:bg-danger-900/20 dark:text-danger-400',
  },
  no_show: {
    label: 'Não compareceu',
    className:
      'bg-neutral-100 text-neutral-600 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400',
  },
  processing: {
    label: 'Processando',
    className:
      'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400',
  },
  failed: {
    label: 'Falhou',
    className:
      'bg-danger-50 text-danger-700 border border-danger-100 dark:bg-danger-900/20 dark:text-danger-400',
  },
  refunded: {
    label: 'Reembolsado',
    className:
      'bg-[#f0fdfa] text-[#134e4a] border border-[#ccfbf1] dark:bg-teal-900/20 dark:text-teal-400',
  },
};

export interface StatusPillProps {
  status: StatusKey;
  /** Override do label exibido */
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
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
