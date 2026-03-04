'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAdminConvenioByIdQueryKey,
  getPlatformSettingsQueryKey,
  listAdminConveniosQueryKey,
  useApproveConvenio,
  useCreateConvenio,
  useDeleteConvenio,
  useSuspendConvenio,
  useUpdatePlatformSettings,
} from '@api/hooks/useOwner';
import type { CreateConvenioMutationRequest } from '@api/types/ownerTypes/CreateConvenio';
import type { UpdatePlatformSettingsMutationRequest } from '@api/types/ownerTypes/UpdatePlatformSettings';
import { getFriendlyApiError } from '@/lib/error-messages';

export function useOwnerMutations() {
  const queryClient = useQueryClient();

  function invalidateConvenios() {
    void queryClient.invalidateQueries({ queryKey: listAdminConveniosQueryKey() });
  }

  function invalidateConvenioDetail(id: string) {
    void queryClient.invalidateQueries({ queryKey: getAdminConvenioByIdQueryKey(id) });
  }

  function invalidateSettings() {
    void queryClient.invalidateQueries({ queryKey: getPlatformSettingsQueryKey() });
  }

  const createConvenioMutation = useCreateConvenio({
    mutation: {
      onSuccess: () => {
        toast.success('Convênio criado com sucesso.');
        invalidateConvenios();
      },
      onError: (error) => {
        toast.error(getFriendlyApiError(error, 'Não foi possível criar o convênio.'));
      },
    },
  });

  const deleteConvenioMutation = useDeleteConvenio({
    mutation: {
      onSuccess: () => {
        toast.success('Convênio excluído com sucesso.');
        invalidateConvenios();
      },
      onError: (error) => {
        toast.error(getFriendlyApiError(error, 'Não foi possível excluir o convênio.'));
      },
    },
  });

  const approveConvenioMutation = useApproveConvenio({
    mutation: {
      onSuccess: (_data, variables) => {
        toast.success('Convênio aprovado com sucesso.');
        invalidateConvenios();
        invalidateConvenioDetail(variables.id);
      },
      onError: (error) => {
        toast.error(getFriendlyApiError(error, 'Não foi possível aprovar o convênio.'));
      },
    },
  });

  const suspendConvenioMutation = useSuspendConvenio({
    mutation: {
      onSuccess: (_data, variables) => {
        toast.success('Convênio suspenso com sucesso.');
        invalidateConvenios();
        invalidateConvenioDetail(variables.id);
      },
      onError: (error) => {
        toast.error(getFriendlyApiError(error, 'Não foi possível suspender o convênio.'));
      },
    },
  });

  const updateSettingsMutation = useUpdatePlatformSettings({
    mutation: {
      onSuccess: () => {
        toast.success('Configurações globais atualizadas com sucesso.');
        invalidateSettings();
      },
      onError: (error) => {
        toast.error(getFriendlyApiError(error, 'Não foi possível atualizar as configurações.'));
      },
    },
  });

  async function createConvenio(data: CreateConvenioMutationRequest) {
    return createConvenioMutation.mutateAsync({ data });
  }

  async function deleteConvenio(id: string) {
    return deleteConvenioMutation.mutateAsync({ id });
  }

  async function approveConvenio(id: string) {
    return approveConvenioMutation.mutateAsync({ id });
  }

  async function suspendConvenio(id: string) {
    return suspendConvenioMutation.mutateAsync({ id });
  }

  async function updateSettings(data: UpdatePlatformSettingsMutationRequest) {
    return updateSettingsMutation.mutateAsync({ data });
  }

  return {
    createConvenio,
    deleteConvenio,
    approveConvenio,
    suspendConvenio,
    updateSettings,
    isCreatingConvenio: createConvenioMutation.isPending,
    isDeletingConvenio: deleteConvenioMutation.isPending,
    isApprovingConvenio: approveConvenioMutation.isPending,
    isSuspendingConvenio: suspendConvenioMutation.isPending,
    isUpdatingSettings: updateSettingsMutation.isPending,
  };
}
