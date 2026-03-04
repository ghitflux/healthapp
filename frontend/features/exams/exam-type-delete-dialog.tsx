'use client';

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
import type { ExamType } from '@api/types/ExamType';

interface ExamTypeDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  examType: ExamType | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function ExamTypeDeleteDialog({
  open,
  onClose,
  examType,
  onConfirm,
  isDeleting,
}: ExamTypeDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Tipo de Exame</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir <strong>{examType?.name}</strong>?
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
