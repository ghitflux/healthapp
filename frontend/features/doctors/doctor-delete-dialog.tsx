'use client';

/**
 * @file features/doctors/doctor-delete-dialog.tsx
 * @description Dialog de confirmação de exclusão de médico.
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
import type { DoctorList } from '@api/types/DoctorList';

interface DoctorDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  doctor: DoctorList | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DoctorDeleteDialog({
  open,
  onClose,
  doctor,
  onConfirm,
  isDeleting,
}: DoctorDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Médico</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir{' '}
            <strong>{doctor?.user_name}</strong>
            {doctor?.convenio_name ? ` (${doctor.convenio_name})` : ''}?
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
