'use client';

/**
 * @file features/doctors/doctors-toolbar.tsx
 * @description Toolbar da listagem de médicos: busca, filtro de disponibilidade e ordenação.
 */

import { DataTableToolbar } from '@/components/patterns/data-table-toolbar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AVAILABILITY_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Disponíveis', value: 'true' },
  { label: 'Indisponíveis', value: 'false' },
];

const ORDERING_OPTIONS = [
  { label: 'Mais recentes', value: '-created_at' },
  { label: 'Nome A-Z', value: 'user__full_name' },
  { label: 'Nome Z-A', value: '-user__full_name' },
  { label: 'Melhor avaliação', value: '-rating' },
];

interface DoctorsToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  isAvailable: boolean | undefined;
  onAvailability: (v: boolean | undefined) => void;
  ordering: string;
  onOrdering: (v: string) => void;
}

export function DoctorsToolbar({
  search,
  onSearch,
  isAvailable,
  onAvailability,
  ordering,
  onOrdering,
}: DoctorsToolbarProps) {
  const availabilityValue =
    isAvailable === undefined ? '' : isAvailable ? 'true' : 'false';

  function handleAvailability(val: string) {
    if (val === '') onAvailability(undefined);
    else onAvailability(val === 'true');
  }

  return (
    <DataTableToolbar
      searchValue={search}
      onSearch={onSearch}
      searchPlaceholder="Buscar por nome ou especialidade..."
      actions={
        <div className="flex items-center gap-2">
          <Select value={availabilityValue} onValueChange={handleAvailability}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="Disponibilidade" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABILITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={ordering} onValueChange={onOrdering}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="Ordenação" />
            </SelectTrigger>
            <SelectContent>
              {ORDERING_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    />
  );
}
