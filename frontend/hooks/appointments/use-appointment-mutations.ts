'use client';

/**
 * @file hooks/appointments/use-appointment-mutations.ts
 * @description Mutations de agendamento: confirmar, cancelar, iniciar, concluir, no-show.
 */

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAppointmentByIdQueryKey,
  useConfirmAppointment,
  useCancelAppointment,
  useStartAppointment,
  useCompleteAppointment,
  useMarkNoShow,
  listAppointmentsQueryKey,
} from '@api/hooks/useAppointments';
import type { ConfirmAppointmentMutationRequest } from '@api/types/appointmentsTypes/ConfirmAppointment';
import { getApiError } from '@/lib/utils';

export function useAppointmentMutations() {
  const queryClient = useQueryClient();

  function invalidateAppointments(appointmentId?: string) {
    void queryClient.invalidateQueries({ queryKey: listAppointmentsQueryKey() });
    if (appointmentId) {
      void queryClient.invalidateQueries({ queryKey: getAppointmentByIdQueryKey(appointmentId) });
    }
  }

  const confirmMutation = useConfirmAppointment({
    mutation: {
      client: queryClient,
      onSuccess: (_data, variables) => {
        toast.success('Agendamento confirmado com sucesso!');
        invalidateAppointments(variables.id);
      },
      onError: (error: unknown) => {
        toast.error(getApiError(error, 'Erro ao confirmar agendamento.'));
      },
    },
  });

  const cancelMutation = useCancelAppointment({
    mutation: {
      client: queryClient,
      onSuccess: (_data, variables) => {
        toast.success('Agendamento cancelado.');
        invalidateAppointments(variables.id);
      },
      onError: (error: unknown) => {
        toast.error(getApiError(error, 'Erro ao cancelar agendamento.'));
      },
    },
  });

  const startMutation = useStartAppointment({
    mutation: {
      client: queryClient,
      onSuccess: (_data, variables) => {
        toast.success('Consulta iniciada!');
        invalidateAppointments(variables.id);
      },
      onError: (error: unknown) => {
        toast.error(getApiError(error, 'Erro ao iniciar consulta.'));
      },
    },
  });

  const completeMutation = useCompleteAppointment({
    mutation: {
      client: queryClient,
      onSuccess: (_data, variables) => {
        toast.success('Consulta concluida com sucesso!');
        invalidateAppointments(variables.id);
      },
      onError: (error: unknown) => {
        toast.error(getApiError(error, 'Erro ao concluir consulta.'));
      },
    },
  });

  const noShowMutation = useMarkNoShow({
    mutation: {
      client: queryClient,
      onSuccess: (_data, variables) => {
        toast.success('Marcado como nao compareceu.');
        invalidateAppointments(variables.id);
      },
      onError: (error: unknown) => {
        toast.error(getApiError(error, 'Erro ao marcar nao comparecimento.'));
      },
    },
  });

  async function confirmAppointment(id: string) {
    // The backend action does not require a body, but the generated schema currently
    // models it as AppointmentRequest. Sending an empty object preserves runtime behavior.
    return confirmMutation.mutateAsync({ id, data: {} as ConfirmAppointmentMutationRequest });
  }

  async function cancelAppointment(id: string, reason?: string) {
    return cancelMutation.mutateAsync({ id, data: reason ? { reason } : undefined });
  }

  async function startAppointment(id: string) {
    return startMutation.mutateAsync({ id });
  }

  async function completeAppointment(id: string, notes?: string) {
    return completeMutation.mutateAsync({ id, data: notes ? { notes } : undefined });
  }

  async function markNoShow(id: string, reason?: string) {
    return noShowMutation.mutateAsync({ id, data: reason ? { reason } : undefined });
  }

  return {
    confirmAppointment,
    cancelAppointment,
    startAppointment,
    completeAppointment,
    markNoShow,
    isConfirming: confirmMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isStarting: startMutation.isPending,
    isCompleting: completeMutation.isPending,
    isMarkingNoShow: noShowMutation.isPending,
  };
}
