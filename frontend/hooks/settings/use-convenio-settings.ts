'use client';

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getConvenioByIdQueryKey,
  useGetConvenioById,
  usePatchConvenioSettings,
} from '@api/hooks/useConvenio';
import type { Convenio } from '@api/types/Convenio';
import type { PatchedConvenioRequest } from '@api/types/PatchedConvenioRequest';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth-store';
import { getFriendlyApiError } from '@/lib/error-messages';
import { unwrapEnvelope } from '@/hooks/owner/utils';

export function useConvenioSettings() {
  const reactQueryClient = useQueryClient();
  const convenioId = useAuthStore((state) => state.user?.convenio_id ?? '');

  const convenioQuery = useGetConvenioById(convenioId, {
    query: {
      client: queryClient,
      enabled: Boolean(convenioId),
    },
  });

  const convenio = useMemo<Convenio | undefined>(() => {
    return unwrapEnvelope<Convenio>(convenioQuery.data);
  }, [convenioQuery.data]);

  const patchMutation = usePatchConvenioSettings({
    mutation: {
      client: reactQueryClient,
      onSuccess: (_data, variables) => {
        toast.success('Configuracoes salvas!');
        void reactQueryClient.invalidateQueries({
          queryKey: getConvenioByIdQueryKey(variables.id),
        });
      },
      onError: (error) => {
        toast.error(getFriendlyApiError(error, 'Erro ao salvar configuracoes.'));
      },
    },
  });

  async function patchSettings(data: PatchedConvenioRequest) {
    if (!convenioId) return;
    await patchMutation.mutateAsync({ id: convenioId, data });
  }

  return {
    convenio,
    isLoading: convenioQuery.isLoading,
    isError: convenioQuery.isError,
    refetch: convenioQuery.refetch,
    patchSettings,
    isPatching: patchMutation.isPending,
  };
}
