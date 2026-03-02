/**
 * @file components/ds/currency-text.tsx
 * @description Atom de domínio — Exibição formatada de valores monetários em BRL.
 */

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

export interface CurrencyTextProps {
  /** Valor numérico em centavos ou reais (conforme `asCents`) */
  value: number;
  /** Se true, interpreta value como centavos (divide por 100) */
  asCents?: boolean;
  className?: string;
  /** Ocultar símbolo R$ */
  noSymbol?: boolean;
}

export function CurrencyText({
  value,
  asCents = false,
  className,
  noSymbol = false,
}: CurrencyTextProps) {
  const amount = asCents ? value / 100 : value;
  const formatted = formatCurrency(amount);
  const display = noSymbol ? formatted.replace('R$\u00a0', '').replace('R$ ', '') : formatted;

  return (
    <span className={cn('tabular-nums', className)} aria-label={formatted}>
      {display}
    </span>
  );
}
