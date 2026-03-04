'use client';

/**
 * @file features/schedules/weekly-schedule-grid.tsx
 * @description Grade semanal visual dos horários de um médico organizados por dia.
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyStateBlock } from '@/components/patterns/empty-state-block';
import {
  EditIcon,
  TrashIcon,
  PlusIcon,
  ClockIcon,
  CalendarIcon,
} from '@/lib/icons';
import type { DoctorSchedule } from '@api/types/DoctorSchedule';

const WEEKDAY_NAMES = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
];

interface WeeklyScheduleGridProps {
  schedules: DoctorSchedule[];
  isLoading: boolean;
  selectedDoctorId: string | null;
  onAdd: () => void;
  onEdit: (schedule: DoctorSchedule) => void;
  onDelete: (schedule: DoctorSchedule) => void;
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-7 gap-2">
      {WEEKDAY_NAMES.map((day) => (
        <div key={day} className="space-y-2">
          <div className="rounded-md bg-muted/50 px-2 py-1.5 text-center">
            <Skeleton className="h-4 w-12 mx-auto" />
          </div>
          <Skeleton className="h-20 w-full rounded-md" />
          <Skeleton className="h-20 w-full rounded-md opacity-60" />
        </div>
      ))}
    </div>
  );
}

interface ScheduleBlockProps {
  schedule: DoctorSchedule;
  onEdit: (schedule: DoctorSchedule) => void;
  onDelete: (schedule: DoctorSchedule) => void;
}

function ScheduleBlock({ schedule, onEdit, onDelete }: ScheduleBlockProps) {
  return (
    <div
      className={`group relative rounded-md border p-2 text-xs space-y-1 transition-colors ${
        schedule.is_active !== false
          ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
          : 'bg-muted/50 border-muted opacity-60'
      }`}
    >
      {/* Time range */}
      <div className="flex items-center gap-1 font-medium text-foreground">
        <ClockIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="truncate">
          {schedule.start_time} – {schedule.end_time}
        </span>
      </div>

      {/* Slot duration */}
      {schedule.slot_duration != null && (
        <div className="text-muted-foreground">
          {schedule.slot_duration} min/slot
        </div>
      )}

      {/* Active badge */}
      {schedule.is_active === false && (
        <Badge variant="secondary" className="text-[10px] px-1 py-0">
          Inativo
        </Badge>
      )}

      {/* Action buttons — shown on hover */}
      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => onEdit(schedule)}
          aria-label="Editar horário"
        >
          <EditIcon className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-destructive hover:text-destructive"
          onClick={() => onDelete(schedule)}
          aria-label="Excluir horário"
        >
          <TrashIcon className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function WeeklyScheduleGrid({
  schedules,
  isLoading,
  selectedDoctorId,
  onAdd,
  onEdit,
  onDelete,
}: WeeklyScheduleGridProps) {
  // No doctor selected
  if (!selectedDoctorId) {
    return (
      <EmptyStateBlock
        icon={CalendarIcon}
        title="Selecione um médico para ver a agenda"
        description="Escolha um médico na lista à esquerda para visualizar e gerenciar seus horários semanais."
      />
    );
  }

  // Loading state
  if (isLoading) {
    return <SkeletonGrid />;
  }

  // Empty: doctor selected but no schedules
  if (schedules.length === 0) {
    return (
      <EmptyStateBlock
        icon={ClockIcon}
        title="Nenhum horário cadastrado"
        description="Defina os horários semanais de atendimento deste médico."
        action={{ label: 'Novo Horário', onClick: onAdd }}
      />
    );
  }

  // Group schedules by weekday (0-6)
  const byWeekday: Record<number, DoctorSchedule[]> = {};
  for (let i = 0; i <= 6; i++) {
    byWeekday[i] = [];
  }
  for (const s of schedules) {
    byWeekday[s.weekday] = [...(byWeekday[s.weekday] ?? []), s];
  }

  return (
    <div className="space-y-3">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Grade Semanal
        </h3>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <PlusIcon className="h-4 w-4 mr-1.5" />
          Novo Horário
        </Button>
      </div>

      {/* 7-column grid */}
      <div className="grid grid-cols-7 gap-2 min-w-0">
        {WEEKDAY_NAMES.map((dayName, weekdayIndex) => {
          const daySchedules = byWeekday[weekdayIndex] ?? [];

          return (
            <div key={weekdayIndex} className="space-y-1.5 min-w-0">
              {/* Day header */}
              <div
                className={`rounded-md px-2 py-1.5 text-center text-xs font-semibold ${
                  daySchedules.length > 0
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {dayName}
                {daySchedules.length > 0 && (
                  <span className="ml-1 opacity-70">({daySchedules.length})</span>
                )}
              </div>

              {/* Schedule blocks */}
              {daySchedules.length > 0 ? (
                daySchedules.map((schedule) => (
                  <ScheduleBlock
                    key={schedule.id}
                    schedule={schedule}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))
              ) : (
                <div className="rounded-md border border-dashed border-muted-foreground/20 py-4 text-center text-xs text-muted-foreground/50">
                  —
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
