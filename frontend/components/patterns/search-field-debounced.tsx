'use client';

/**
 * @file components/patterns/search-field-debounced.tsx
 * @description Molécula — Campo de busca com debounce de 300ms.
 */

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { SearchIcon, XIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

export interface SearchFieldDebouncedProps {
  value?: string;
  defaultValue?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  delay?: number;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function SearchFieldDebounced({
  value: controlledValue,
  defaultValue = '',
  onSearch,
  placeholder = 'Buscar...',
  delay = 300,
  disabled = false,
  className,
  'aria-label': ariaLabel = 'Campo de busca',
}: SearchFieldDebouncedProps) {
  const [internalValue, setInternalValue] = useState(
    controlledValue ?? defaultValue
  );
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync com controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setInternalValue(newValue);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(newValue);
    }, delay);
  }

  function handleClear() {
    setInternalValue('');
    clearTimeout(timerRef.current);
    onSearch('');
  }

  return (
    <div className={cn('relative', className)}>
      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        className="pl-9 pr-9"
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-[color,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:text-foreground motion-safe:hover:scale-110"
          aria-label="Limpar busca"
        >
          <XIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
