'use client';

/**
 * @file components/patterns/date-range-filter.tsx
 * @description Molecula — Filtro simples de intervalo com date pickers estilizados.
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';

export interface DateRangeFilterProps {
  from?: string;
  to?: string;
  onFromChange: (value: string | undefined) => void;
  onToChange: (value: string | undefined) => void;
  label?: string;
  className?: string;
}

export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  label = 'Período',
  className,
}: DateRangeFilterProps) {
  const hasActiveFilters = Boolean(from || to);

  return (
    <div className={cn('flex flex-col gap-2 rounded-lg border bg-background p-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              onFromChange(undefined);
              onToChange(undefined);
            }}
          >
            Limpar
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="date-range-from" className="text-xs text-muted-foreground">
            De
          </Label>
          <DatePicker
            id="date-range-from"
            value={from ?? ''}
            onChange={onFromChange}
            placeholder="Selecione a data"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date-range-to" className="text-xs text-muted-foreground">
            Ate
          </Label>
          <DatePicker
            id="date-range-to"
            value={to ?? ''}
            min={from}
            onChange={onToChange}
            placeholder="Selecione a data"
          />
        </div>
      </div>
    </div>
  );
}
