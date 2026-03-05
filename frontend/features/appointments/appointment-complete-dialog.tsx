'use client';

/**
 * @file features/appointments/appointment-complete-dialog.tsx
 * @description Dialog de confirmacao para concluir agendamento.
 */

import { useState } from 'react';
import { ActionConfirmationDialog } from '@/components/patterns/action-confirmation-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AppointmentCompleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => Promise<void>;
  isLoading: boolean;
}

export function AppointmentCompleteDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
}: AppointmentCompleteDialogProps) {
  const [notes, setNotes] = useState('');

  async function handleConfirm() {
    await onConfirm(notes.trim() || undefined);
    setNotes('');
  }

  function handleClose() {
    setNotes('');
    onClose();
  }

  return (
    <ActionConfirmationDialog
      open={open}
      onClose={handleClose}
      title="Concluir Consulta"
      description="Confirme a conclusao da consulta. Voce pode adicionar observacoes."
      confirmLabel="Concluir"
      onConfirm={handleConfirm}
      isLoading={isLoading}
    >
      <div className="space-y-2">
        <Label htmlFor="complete-notes">Observacoes (opcional)</Label>
        <Textarea
          id="complete-notes"
          placeholder="Adicione observacoes sobre a consulta..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
    </ActionConfirmationDialog>
  );
}
