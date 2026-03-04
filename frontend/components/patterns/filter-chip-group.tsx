'use client';

/**
 * @file components/patterns/filter-chip-group.tsx
 * @description Molécula — Grupo de chips para filtros rápidos.
 */

import { cn } from '@/lib/utils';
import { XIcon } from '@/lib/icons';

export interface FilterChipOption<T extends string = string> {
  value: T;
  label: string;
}

export interface FilterChipGroupProps<T extends string = string> {
  options: FilterChipOption<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
  multiSelect?: boolean;
  className?: string;
}

export function FilterChipGroup<T extends string = string>({
  options,
  selected,
  onChange,
  multiSelect = true,
  className,
}: FilterChipGroupProps<T>) {
  function handleToggle(value: T) {
    if (multiSelect) {
      const next = selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value];
      onChange(next);
    } else {
      onChange(selected.includes(value) ? [] : [value]);
    }
  }

  function handleClear() {
    onChange([]);
  }

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)} role="group">
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleToggle(option.value)}
            aria-pressed={isSelected}
            className={cn(
              'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)] motion-safe:hover:-translate-y-px motion-safe:active:scale-[0.985]',
              isSelected
                ? 'border-primary-600 bg-primary-600 text-white shadow-xs hover:bg-primary-700 hover:shadow-sm'
                : 'border-border bg-background text-foreground hover:bg-neutral-100 hover:border-primary-300 hover:shadow-xs dark:hover:bg-neutral-800'
            )}
          >
            {option.label}
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-muted hover:text-foreground motion-safe:hover:-translate-y-px"
          aria-label="Limpar todos os filtros"
        >
          <XIcon className="h-3 w-3" />
          Limpar
        </button>
      )}
    </div>
  );
}
