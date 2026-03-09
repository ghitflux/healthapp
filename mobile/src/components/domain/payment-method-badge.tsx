import { Badge } from '@/components/ui/badge';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

interface PaymentMethodBadgeProps {
  method?: 'pix' | 'credit_card' | 'debit_card' | string | null;
}

export function PaymentMethodBadge({ method }: PaymentMethodBadgeProps) {
  const label =
    method && method in PAYMENT_METHOD_LABELS
      ? PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS]
      : 'Metodo';

  return <Badge label={label} className="border-slate-200 bg-slate-100" textClassName="text-slate-700" />;
}
