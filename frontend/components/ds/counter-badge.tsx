/**
 * @file components/ds/counter-badge.tsx
 * @description Atom de domínio — Badge numérico para contagens (notificações não lidas, etc.).
 */

import { cn } from '@/lib/utils';

export interface CounterBadgeProps {
  count: number;
  /** Limite máximo exibido (ex: 99 → "99+") */
  max?: number;
  variant?: 'primary' | 'danger' | 'warning' | 'success';
  size?: 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
}

const VARIANT_CLASSES = {
  primary: 'bg-primary-600 text-white',
  danger: 'bg-danger-500 text-white',
  warning: 'bg-warning-500 text-white',
  success: 'bg-success-500 text-white',
} as const;

const SIZE_CLASSES = {
  sm: 'h-4 min-w-4 text-[10px] px-1',
  md: 'h-5 min-w-5 text-xs px-1.5',
} as const;

export function CounterBadge({
  count,
  max = 99,
  variant = 'danger',
  size = 'sm',
  className,
  'aria-label': ariaLabel,
}: CounterBadgeProps) {
  if (count <= 0) return null;

  const display = count > max ? `${max}+` : String(count);

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium leading-none',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      aria-label={ariaLabel ?? `${display} não lidas`}
    >
      {display}
    </span>
  );
}
