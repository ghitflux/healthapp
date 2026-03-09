import { Badge } from '@/components/ui/badge';
import { APPOINTMENT_STATUS_META, PAYMENT_STATUS_META } from '@/lib/constants';

interface StatusBadgeProps {
  type: 'appointment' | 'payment';
  status?: string | null;
}

export function StatusBadge({ type, status }: StatusBadgeProps) {
  const source = type === 'appointment' ? APPOINTMENT_STATUS_META : PAYMENT_STATUS_META;
  const value = status && status in source ? source[status as keyof typeof source] : undefined;

  return (
    <Badge
      label={value?.label ?? 'Indefinido'}
      className={value?.containerClassName ?? 'border-slate-200 bg-slate-100'}
      textClassName={value?.textClassName ?? 'text-slate-700'}
    />
  );
}
