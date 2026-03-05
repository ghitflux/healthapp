'use client';

import { useMemo } from 'react';
import { useGetConvenioDashboard } from '@api/hooks/useConvenio';
import type { ConvenioDashboard } from '@api/types/ConvenioDashboard';
import { queryClient } from '@/lib/query-client';
import { unwrapEnvelope } from '@/hooks/owner/utils';

const DASHBOARD_STALE_TIME = 1000 * 60 * 5;

export function useConvenioDashboard() {
  const query = useGetConvenioDashboard(undefined, {
    query: {
      client: queryClient,
      staleTime: DASHBOARD_STALE_TIME,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  });

  const dashboard = useMemo<ConvenioDashboard | undefined>(() => {
    return unwrapEnvelope<ConvenioDashboard>(query.data);
  }, [query.data]);

  return {
    dashboard,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
