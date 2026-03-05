'use client';

/**
 * @file features/appointments/appointment-cancel-dialog.tsx
 * @description Dialog de confirmacao para cancelamento de agendamento.
 */

import { useState } from 'react';
import { ActionConfirmationDialog } from '@/components/patterns/action-confirmation-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AppointmentCancelDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isLoading: boolean;
}

export function AppointmentCancelDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
}: AppointmentCancelDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 10) {
      setError('Informe um motivo com pelo menos 10 caracteres.');
      return;
    }

    await onConfirm(normalizedReason);
    setReason('');
    setError(null);
  }

  function handleClose() {
    setReason('');
    setError(null);
    onClose();
  }

  return (
    <ActionConfirmationDialog
      open={open}
      onClose={handleClose}
      title="Cancelar Agendamento"
      description="Tem certeza que deseja cancelar este agendamento? O paciente sera notificado."
      confirmLabel="Cancelar Agendamento"
      confirmVariant="destructive"
      onConfirm={handleConfirm}
      isLoading={isLoading}
    >
      <div className="space-y-2">
        <Label htmlFor="cancel-reason">Motivo</Label>
        <Textarea
          id="cancel-reason"
          placeholder="Informe o motivo do cancelamento..."
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            if (error) setError(null);
          }}
          rows={3}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </ActionConfirmationDialog>
  );
}
