/**
 * @file components/ds/trend-chip.tsx
 * @description Atom de domínio — Chip de variação percentual de KPIs (+/-%).
 */

import { cn } from '@/lib/utils';
import { TrendingUpIcon, TrendingDownIcon } from '@/lib/icons';

export interface TrendChipProps {
  /** Valor percentual (positivo = alta, negativo = queda) */
  value: number;
  /** Casas decimais */
  decimals?: number;
  /** Inverter a semântica (ex: cancelamentos — queda é bom) */
  invertSemantic?: boolean;
  className?: string;
}

export function TrendChip({
  value,
  decimals = 1,
  invertSemantic = false,
  className,
}: TrendChipProps) {
  const isPositive = value >= 0;
  const isGood = invertSemantic ? !isPositive : isPositive;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        isGood ? 'text-success-600' : 'text-danger-600',
        className
      )}
      aria-label={`${isPositive ? 'Alta' : 'Queda'} de ${Math.abs(value).toFixed(decimals)}%`}
    >
      {isPositive ? (
        <TrendingUpIcon className="h-3 w-3" />
      ) : (
        <TrendingDownIcon className="h-3 w-3" />
      )}
      {isPositive ? '+' : ''}
      {value.toFixed(decimals)}%
    </span>
  );
}
