'use client';

import { useMemo, useState } from 'react';
import { format, startOfMonth } from 'date-fns';
import { useGetConvenioFinancialReport } from '@api/hooks/useConvenio';
import type { FinancialReport } from '@api/types/FinancialReport';
import { queryClient } from '@/lib/query-client';
import { unwrapEnvelope } from '@/hooks/owner/utils';
import { useResolvedConvenioId } from '@/hooks/convenio/use-resolved-convenio-id';

function getCurrentMonthWindow() {
  const now = new Date();

  return {
    from: format(startOfMonth(now), 'yyyy-MM-dd'),
    to: format(now, 'yyyy-MM-dd'),
  };
}

export function useConvenioFinancial() {
  const {
    convenioId,
    isLoading: isResolvingConvenio,
    isError: isConvenioResolutionError,
    refetch: refetchConvenioResolution,
  } = useResolvedConvenioId();
  const monthWindow = getCurrentMonthWindow();
  const [dateFrom, setDateFrom] = useState(monthWindow.from);
  const [dateTo, setDateTo] = useState(monthWindow.to);

  const query = useGetConvenioFinancialReport(
    {
      start_date: dateFrom,
      end_date: dateTo,
      ...(convenioId ? { convenio_id: convenioId } : {}),
    },
    {
      query: {
        client: queryClient,
        staleTime: 5 * 60_000,
        enabled:
          Boolean(dateFrom && dateTo && convenioId) &&
          !isResolvingConvenio &&
          !isConvenioResolutionError,
      },
    }
  );

  const report = useMemo<FinancialReport | undefined>(() => {
    return unwrapEnvelope<FinancialReport>(query.data);
  }, [query.data]);

  function handleResetDates() {
    const nextWindow = getCurrentMonthWindow();
    setDateFrom(nextWindow.from);
    setDateTo(nextWindow.to);
  }

  function handleDateFrom(value?: string) {
    if (!value) {
      handleResetDates();
      return;
    }
    setDateFrom(value);
  }

  function handleDateTo(value?: string) {
    if (!value) {
      handleResetDates();
      return;
    }
    setDateTo(value);
  }

  return {
    convenioId,
    report,
    isLoading: isResolvingConvenio || query.isLoading,
    isError: isConvenioResolutionError || query.isError,
    refetch: convenioId ? query.refetch : refetchConvenioResolution,
    dateFrom,
    dateTo,
    handleDateFrom,
    handleDateTo,
    handleResetDates,
  };
}
