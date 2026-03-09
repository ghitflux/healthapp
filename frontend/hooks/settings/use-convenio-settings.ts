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
import { getFriendlyApiError } from '@/lib/error-messages';
import { unwrapEnvelope } from '@/hooks/owner/utils';
import { useResolvedConvenioId } from '@/hooks/convenio/use-resolved-convenio-id';

export function useConvenioSettings() {
  const reactQueryClient = useQueryClient();
  const {
    convenioId,
    isLoading: isResolvingConvenio,
    isError: isConvenioResolutionError,
    refetch: refetchConvenioResolution,
  } = useResolvedConvenioId();
  const isQueryEnabled = Boolean(convenioId) && !isResolvingConvenio && !isConvenioResolutionError;

  const convenioQuery = useGetConvenioById(convenioId, {
    query: {
      client: queryClient,
      enabled: isQueryEnabled,
    },
  });

  const convenio = useMemo<Convenio | undefined>(() => {
    return unwrapEnvelope<Convenio>(convenioQuery.data);
  }, [convenioQuery.data]);

  const patchMutation = usePatchConvenioSettings({
    mutation: {
      client: reactQueryClient,
      onSuccess: (_data, variables) => {
        toast.success('Configurações salvas!');
        void reactQueryClient.invalidateQueries({
          queryKey: getConvenioByIdQueryKey(variables.id),
        });
      },
      onError: (error) => {
        toast.error(getFriendlyApiError(error, 'Erro ao salvar configurações.'));
      },
    },
  });

  async function patchSettings(data: PatchedConvenioRequest) {
    if (!convenioId) return;
    await patchMutation.mutateAsync({ id: convenioId, data });
  }

  return {
    convenio,
    convenioId,
    isLoading: isResolvingConvenio || convenioQuery.isLoading,
    isError: isConvenioResolutionError || Boolean(convenioId && convenioQuery.isError),
    refetch: convenioId ? convenioQuery.refetch : refetchConvenioResolution,
    patchSettings,
    isPatching: patchMutation.isPending,
  };
}
