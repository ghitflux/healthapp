'use client';

/**
 * @file hooks/doctors/use-doctor-mutations.ts
 * @description Mutations de médico: create, patch, delete com invalidação de cache.
 */

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useCreateDoctor,
  useDeleteDoctor,
  usePatchDoctor,
  listDoctorsQueryKey,
} from '@api/hooks/useDoctors';
import type { CreateDoctorMutationRequest } from '@api/types/doctorsTypes/CreateDoctor';
import type { PatchDoctorMutationRequest } from '@api/types/doctorsTypes/PatchDoctor';
import { getApiError } from '@/lib/utils';

export function useDoctorMutations() {
  const queryClient = useQueryClient();

  function invalidateDoctors() {
    queryClient.invalidateQueries({ queryKey: listDoctorsQueryKey() });
  }

  const createMutation = useCreateDoctor({
    mutation: {
      client: queryClient,
      onSuccess: () => {
        toast.success('Médico criado com sucesso!');
        invalidateDoctors();
      },
      onError: (error: unknown) => {
        toast.error(getApiError(error, 'Erro ao criar médico.'));
      },
    },
  });

  const patchMutation = usePatchDoctor({
    mutation: {
      client: queryClient,
      onSuccess: () => {
        toast.success('Médico atualizado com sucesso!');
        invalidateDoctors();
      },
      onError: (error: unknown) => {
        toast.error(getApiError(error, 'Erro ao atualizar médico.'));
      },
    },
  });

  const deleteMutation = useDeleteDoctor({
    mutation: {
      client: queryClient,
      onSuccess: () => {
        toast.success('Médico removido com sucesso!');
        invalidateDoctors();
      },
      onError: (error: unknown) => {
        toast.error(getApiError(error, 'Erro ao remover médico.'));
      },
    },
  });

  async function createDoctor(data: CreateDoctorMutationRequest) {
    return createMutation.mutateAsync({ data });
  }

  async function patchDoctor(id: string, data: PatchDoctorMutationRequest) {
    return patchMutation.mutateAsync({ id, data });
  }

  async function deleteDoctor(id: string) {
    return deleteMutation.mutateAsync({ id });
  }

  return {
    createDoctor,
    patchDoctor,
    deleteDoctor,
    isCreating: createMutation.isPending,
    isPatching: patchMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
