'use client';

/**
 * @file features/appointments/appointments-toolbar.tsx
 * @description Toolbar de filtros para listagem de agendamentos.
 */

import { DateRangeFilter } from '@/components/patterns/date-range-filter';
import { Button } from '@/components/ui/button';
import { SearchFieldDebounced } from '@/components/patterns/search-field-debounced';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AppointmentStatusEnum } from '@api/types/AppointmentStatusEnum';
import type { AppointmentTypeEnum } from '@api/types/AppointmentTypeEnum';

interface AppointmentsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: AppointmentStatusEnum | '';
  onStatusChange: (value: AppointmentStatusEnum | '') => void;
  appointmentType: AppointmentTypeEnum | '';
  onTypeChange: (value: AppointmentTypeEnum | '') => void;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange: (value: string | undefined) => void;
  onDateToChange: (value: string | undefined) => void;
  ordering: string;
  onOrderingChange: (value: string) => void;
  activeFilterCount: number;
  onResetFilters: () => void;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos os status' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluido' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'no_show', label: 'Não compareceu' },
];

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'consultation', label: 'Consulta' },
  { value: 'exam', label: 'Exame' },
  { value: 'return_visit', label: 'Retorno' },
];

const ORDER_OPTIONS = [
  { value: '-scheduled_date', label: 'Mais recentes' },
  { value: 'scheduled_date', label: 'Mais antigos' },
] as const;

export function AppointmentsToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  appointmentType,
  onTypeChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  ordering,
  onOrderingChange,
  activeFilterCount,
  onResetFilters,
}: AppointmentsToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchFieldDebounced
          value={search}
          onSearch={onSearchChange}
          placeholder="Buscar por médico..."
          className="w-full sm:w-72"
        />
        <Select
          value={status || 'all'}
          onValueChange={(value) =>
            onStatusChange(value === 'all' ? '' : (value as AppointmentStatusEnum))
          }
        >
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={appointmentType || 'all'}
          onValueChange={(value) =>
            onTypeChange(value === 'all' ? '' : (value as AppointmentTypeEnum))
          }
        >
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ordering} onValueChange={onOrderingChange}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Ordenacao" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <DateRangeFilter
          from={dateFrom}
          to={dateTo}
          onFromChange={onDateFromChange}
          onToChange={onDateToChange}
          className="w-full xl:max-w-md"
        />

        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {activeFilterCount > 0
              ? `${activeFilterCount} filtro${activeFilterCount > 1 ? 's' : ''} ativo${activeFilterCount > 1 ? 's' : ''}`
              : 'Sem filtros ativos'}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={onResetFilters}
            disabled={activeFilterCount === 0}
          >
            Limpar filtros
          </Button>
        </div>
      </div>
    </div>
  );
}
