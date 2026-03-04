'use client';

/**
 * @file hooks/schedules/use-schedule-mutations.ts
 * @description Mutations de horários e exceções de agenda com invalidação de cache.
 */

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useCreateDoctorSchedule,
  usePatchDoctorSchedule,
  useDeleteDoctorSchedule,
  listDoctorSchedulesQueryKey,
  useCreateScheduleException,
  useDeleteScheduleException,
  listScheduleExceptionsQueryKey,
} from '@api/hooks/useConvenio';
import type { CreateDoctorScheduleMutationRequest } from '@api/types/convenioTypes/CreateDoctorSchedule';
import type { PatchDoctorScheduleMutationRequest } from '@api/types/convenioTypes/PatchDoctorSchedule';
import type { CreateScheduleExceptionMutationRequest } from '@api/types/convenioTypes/CreateScheduleException';
import { getApiError } from '@/lib/utils';

export function useScheduleMutations() {
  const queryClient = useQueryClient();

  function invalidateSchedules() {
    queryClient.invalidateQueries({ queryKey: listDoctorSchedulesQueryKey() });
  }

  function invalidateExceptions() {
    queryClient.invalidateQueries({ queryKey: listScheduleExceptionsQueryKey() });
  }

  // --- Horários ---
  const createScheduleMutation = useCreateDoctorSchedule({
    mutation: {
      onSuccess: () => { toast.success('Horário criado!'); invalidateSchedules(); },
      onError: (e: unknown) => toast.error(getApiError(e, 'Erro ao criar horário.')),
    },
  });

  const patchScheduleMutation = usePatchDoctorSchedule({
    mutation: {
      onSuccess: () => { toast.success('Horário atualizado!'); invalidateSchedules(); },
      onError: (e: unknown) => toast.error(getApiError(e, 'Erro ao atualizar horário.')),
    },
  });

  const deleteScheduleMutation = useDeleteDoctorSchedule({
    mutation: {
      onSuccess: () => { toast.success('Horário removido!'); invalidateSchedules(); },
      onError: (e: unknown) => toast.error(getApiError(e, 'Erro ao remover horário.')),
    },
  });

  // --- Exceções ---
  const createExceptionMutation = useCreateScheduleException({
    mutation: {
      onSuccess: () => { toast.success('Exceção criada!'); invalidateExceptions(); },
      onError: (e: unknown) => toast.error(getApiError(e, 'Erro ao criar exceção.')),
    },
  });

  const deleteExceptionMutation = useDeleteScheduleException({
    mutation: {
      onSuccess: () => { toast.success('Exceção removida!'); invalidateExceptions(); },
      onError: (e: unknown) => toast.error(getApiError(e, 'Erro ao remover exceção.')),
    },
  });

  return {
    createSchedule: (data: CreateDoctorScheduleMutationRequest) =>
      createScheduleMutation.mutateAsync({ data }),
    patchSchedule: (id: string, data: PatchDoctorScheduleMutationRequest) =>
      patchScheduleMutation.mutateAsync({ id, data }),
    deleteSchedule: (id: string) =>
      deleteScheduleMutation.mutateAsync({ id }),
    createException: (data: CreateScheduleExceptionMutationRequest) =>
      createExceptionMutation.mutateAsync({ data }),
    deleteException: (id: string) =>
      deleteExceptionMutation.mutateAsync({ id }),
    isCreatingSchedule: createScheduleMutation.isPending,
    isPatchingSchedule: patchScheduleMutation.isPending,
    isDeletingSchedule: deleteScheduleMutation.isPending,
    isCreatingException: createExceptionMutation.isPending,
    isDeletingException: deleteExceptionMutation.isPending,
  };
}
