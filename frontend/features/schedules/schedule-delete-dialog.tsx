'use client';

/**
 * @file features/schedules/schedule-delete-dialog.tsx
 * @description AlertDialog de confirmação de exclusão de DoctorSchedule.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LoaderIcon } from '@/lib/icons';
import type { DoctorSchedule } from '@api/types/DoctorSchedule';

const WEEKDAY_NAMES = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

interface ScheduleDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  schedule: DoctorSchedule | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function ScheduleDeleteDialog({
  open,
  onClose,
  schedule,
  onConfirm,
  isDeleting,
}: ScheduleDeleteDialogProps) {
  const weekdayName =
    schedule != null ? (WEEKDAY_NAMES[schedule.weekday] ?? `Dia ${schedule.weekday}`) : '';

  const timeRange =
    schedule != null ? `${schedule.start_time} – ${schedule.end_time}` : '';

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Horário</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o horário de{' '}
            <strong>{weekdayName}</strong> ({timeRange})?
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={async (e) => {
              e.preventDefault();
              await onConfirm();
              onClose();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
