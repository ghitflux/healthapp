/**
 * @file components/ds/rating-stars.tsx
 * @description Atom de domínio — Exibição de avaliação em estrelas (1-5).
 */

import { cn } from '@/lib/utils';
import { StarIcon } from '@/lib/icons';

export interface RatingStarsProps {
  /** Valor da avaliação (0 a 5, suporta decimais) */
  value: number;
  /** Número máximo de estrelas */
  max?: number;
  /** Tamanho das estrelas */
  size?: 'sm' | 'md' | 'lg';
  /** Exibir valor numérico ao lado */
  showValue?: boolean;
  /** Total de avaliações */
  totalRatings?: number;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
} as const;

export function RatingStars({
  value,
  max = 5,
  size = 'md',
  showValue = false,
  totalRatings,
  className,
}: RatingStarsProps) {
  const starSize = SIZE_CLASSES[size];
  const clampedValue = Math.max(0, Math.min(max, value));

  return (
    <div className={cn('flex items-center gap-1', className)} aria-label={`Avaliação: ${clampedValue} de ${max}`}>
      <div className="flex items-center">
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < Math.floor(clampedValue);
          const partial = !filled && i < clampedValue;
          return (
            <StarIcon
              key={i}
              className={cn(
                starSize,
                'transition-colors',
                filled
                  ? 'fill-warning-500 text-warning-500'
                  : partial
                  ? 'fill-warning-200 text-warning-500'
                  : 'fill-none text-neutral-300'
              )}
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-foreground">
          {clampedValue.toFixed(1)}
        </span>
      )}
      {totalRatings !== undefined && (
        <span className="text-xs text-muted-foreground">
          ({totalRatings.toLocaleString('pt-BR')})
        </span>
      )}
    </div>
  );
}
