'use client';

/**
 * @file features/appointments/appointment-noshow-dialog.tsx
 * @description Dialog de confirmação para marcar não comparecimento.
 */

import { useState } from 'react';
import { ActionConfirmationDialog } from '@/components/patterns/action-confirmation-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AppointmentNoShowDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
  isLoading: boolean;
}

export function AppointmentNoShowDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
}: AppointmentNoShowDialogProps) {
  const [reason, setReason] = useState('');

  async function handleConfirm() {
    await onConfirm(reason.trim() || undefined);
    setReason('');
  }

  function handleClose() {
    setReason('');
    onClose();
  }

  return (
    <ActionConfirmationDialog
      open={open}
      onClose={handleClose}
      title="Marcar Não Comparecimento"
      description="O paciente não compareceu a consulta? Esta ação será registrada."
      confirmLabel="Confirmar Não Comparecimento"
      confirmVariant="destructive"
      onConfirm={handleConfirm}
      isLoading={isLoading}
    >
      <div className="space-y-2">
        <Label htmlFor="noshow-reason">Observações (opcional)</Label>
        <Textarea
          id="noshow-reason"
          placeholder="Alguma observação sobre o não comparecimento..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </div>
    </ActionConfirmationDialog>
  );
}
