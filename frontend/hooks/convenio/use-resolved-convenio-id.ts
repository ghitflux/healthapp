'use client';

import { useEffect, useMemo } from 'react';
import { useListConvenios } from '@api/hooks/useConvenio';
import type { ConvenioList } from '@api/types/ConvenioList';
import { authService } from '@/lib/auth';
import { getAuthUserConvenioId } from '@/lib/auth-user';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth-store';

const RESOLUTION_STALE_TIME = 1000 * 60 * 5;

export function useResolvedConvenioId() {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const setUser = useAuthStore((state) => state.setUser);

  const storedConvenioId = getAuthUserConvenioId(user);
  const role = user?.role ?? authService.getUserRole();
  const shouldResolveFromList =
    !authLoading &&
    authService.isAuthenticated() &&
    role === 'convenio_admin' &&
    !storedConvenioId;

  const convenioQuery = useListConvenios(
    shouldResolveFromList
      ? {
          page: 1,
          page_size: 1,
        }
      : undefined,
    {
      query: {
        client: queryClient,
        enabled: shouldResolveFromList,
        staleTime: RESOLUTION_STALE_TIME,
        refetchOnWindowFocus: false,
      },
    }
  );

  const fallbackConvenio = useMemo<ConvenioList | undefined>(() => {
    return convenioQuery.data?.data?.[0];
  }, [convenioQuery.data]);

  const convenioId = storedConvenioId || fallbackConvenio?.id || '';
  const isResolving = shouldResolveFromList && !convenioId;
  const isError =
    !authLoading &&
    isResolving &&
    (convenioQuery.isError || (!convenioQuery.isLoading && !fallbackConvenio?.id));

  useEffect(() => {
    if (!user || storedConvenioId || !fallbackConvenio?.id) {
      return;
    }

    setUser({
      ...user,
      convenio: fallbackConvenio.id,
      convenio_id: fallbackConvenio.id,
    });
  }, [fallbackConvenio?.id, setUser, storedConvenioId, user]);

  return {
    convenioId,
    convenio: fallbackConvenio,
    isLoading: authLoading || isResolving,
    isError,
    refetch: convenioQuery.refetch,
  };
}
