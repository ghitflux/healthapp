'use client';

/**
 * @file components/patterns/data-table-toolbar.tsx
 * @description Molécula — Toolbar padrão acima de tabelas de dados.
 * Compõe SearchFieldDebounced + FilterChipGroup + ações customizadas.
 */

import { SearchFieldDebounced } from './search-field-debounced';
import { cn } from '@/lib/utils';

export interface DataTableToolbarProps {
  /** Valor atual da busca */
  searchValue?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  /** Slot para filtros ou actions à direita */
  actions?: React.ReactNode;
  /** Conteúdo extra abaixo da toolbar (ex: FilterChipGroup) */
  filters?: React.ReactNode;
  className?: string;
}

export function DataTableToolbar({
  searchValue,
  onSearch,
  searchPlaceholder = 'Buscar...',
  actions,
  filters,
  className,
}: DataTableToolbarProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-3">
        {onSearch && (
          <SearchFieldDebounced
            value={searchValue}
            onSearch={onSearch}
            placeholder={searchPlaceholder}
            className="flex-1 max-w-sm"
          />
        )}
        {actions && (
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        )}
      </div>
      {filters && <div>{filters}</div>}
    </div>
  );
}
