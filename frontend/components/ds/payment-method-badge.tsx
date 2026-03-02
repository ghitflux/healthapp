/**
 * @file components/ds/payment-method-badge.tsx
 * @description Atom de domínio — Badge para exibição do método de pagamento.
 */

import { cn } from '@/lib/utils';
import { CreditCardIcon, QrCodeIcon, LandmarkIcon } from '@/lib/icons';

export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card';

const METHOD_CONFIG: Record<
  PaymentMethod,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  pix: {
    label: 'PIX',
    icon: QrCodeIcon,
    className: 'bg-[#e6faf9] text-[#0d7a70] border border-[#b2ece8]',
  },
  credit_card: {
    label: 'Cartão de Crédito',
    icon: CreditCardIcon,
    className: 'bg-[#eef2ff] text-[#3730a3] border border-[#c7d2fe]',
  },
  debit_card: {
    label: 'Cartão de Débito',
    icon: LandmarkIcon,
    className: 'bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]',
  },
};

export interface PaymentMethodBadgeProps {
  method: PaymentMethod;
  /** Exibir apenas ícone sem label */
  iconOnly?: boolean;
  className?: string;
}

export function PaymentMethodBadge({
  method,
  iconOnly = false,
  className,
}: PaymentMethodBadgeProps) {
  const config = METHOD_CONFIG[method];
  if (!config) return null;

  const { label, icon: Icon } = config;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
      title={label}
    >
      <Icon className="h-3 w-3" />
      {!iconOnly && label}
    </span>
  );
}
