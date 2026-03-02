/**
 * @file components/ds/datetime-text.tsx
 * @description Atom de domínio — Exibição formatada de datas e horários.
 */

import { cn } from '@/lib/utils';
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeDate,
} from '@/lib/formatters';

type DateTimeVariant = 'date' | 'time' | 'datetime' | 'relative';

export interface DateTimeTextProps {
  value: string | Date;
  variant?: DateTimeVariant;
  className?: string;
}

export function DateTimeText({
  value,
  variant = 'datetime',
  className,
}: DateTimeTextProps) {
  const str = typeof value === 'string' ? value : value.toISOString();

  const formatted =
    variant === 'date'
      ? formatDate(str)
      : variant === 'time'
      ? formatTime(str)
      : variant === 'relative'
      ? formatRelativeDate(str)
      : formatDateTime(str);

  return (
    <time
      dateTime={typeof value === 'string' ? value : value.toISOString()}
      className={cn('tabular-nums', className)}
    >
      {formatted}
    </time>
  );
}
