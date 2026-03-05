'use client';

/**
 * @file components/patterns/action-confirmation-dialog.tsx
 * @description Molecula — Dialog generico para confirmacao de acoes.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoaderIcon } from '@/lib/icons';
import { useState } from 'react';

export interface ActionConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: 'default' | 'destructive';
  children?: React.ReactNode;
}

export function ActionConfirmationDialog({
  open,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  description,
  confirmLabel = 'Confirmar',
  confirmVariant = 'default',
  children,
}: ActionConfirmationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBusy = isLoading || isSubmitting;

  async function handleConfirm() {
    if (isBusy) return;

    try {
      setIsSubmitting(true);
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !isBusy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children && <div className="py-2">{children}</div>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isBusy}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            disabled={isBusy}
            onClick={() => void handleConfirm()}
          >
            {isBusy && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
