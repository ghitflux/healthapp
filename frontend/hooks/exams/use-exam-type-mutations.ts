'use client';

/**
 * @file hooks/exams/use-exam-type-mutations.ts
 * @description Mutations de tipos de exame com invalidação de cache.
 */

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useCreateExamType,
  usePatchExamType,
  useDeleteExamType,
  listExamTypesQueryKey,
} from '@api/hooks/useConvenio';
import type { CreateExamTypeMutationRequest } from '@api/types/convenioTypes/CreateExamType';
import type { PatchExamTypeMutationRequest } from '@api/types/convenioTypes/PatchExamType';
import { getApiError } from '@/lib/utils';

export function useExamTypeMutations() {
  const queryClient = useQueryClient();

  function invalidateExamTypes() {
    queryClient.invalidateQueries({ queryKey: listExamTypesQueryKey() });
  }

  const createMutation = useCreateExamType({
    mutation: {
      onSuccess: () => { toast.success('Tipo de exame criado!'); invalidateExamTypes(); },
      onError: (e: unknown) => toast.error(getApiError(e, 'Erro ao criar tipo de exame.')),
    },
  });

  const patchMutation = usePatchExamType({
    mutation: {
      onSuccess: () => { toast.success('Tipo de exame atualizado!'); invalidateExamTypes(); },
      onError: (e: unknown) => toast.error(getApiError(e, 'Erro ao atualizar tipo de exame.')),
    },
  });

  const deleteMutation = useDeleteExamType({
    mutation: {
      onSuccess: () => { toast.success('Tipo de exame removido!'); invalidateExamTypes(); },
      onError: (e: unknown) => toast.error(getApiError(e, 'Erro ao remover tipo de exame.')),
    },
  });

  return {
    createExamType: (data: CreateExamTypeMutationRequest) =>
      createMutation.mutateAsync({ data }),
    patchExamType: (id: string, data: PatchExamTypeMutationRequest) =>
      patchMutation.mutateAsync({ id, data }),
    deleteExamType: (id: string) =>
      deleteMutation.mutateAsync({ id }),
    isCreating: createMutation.isPending,
    isPatching: patchMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
