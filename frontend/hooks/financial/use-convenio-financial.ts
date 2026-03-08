'use client';

import { useMemo, useState } from 'react';
import { format, startOfMonth } from 'date-fns';
import { useGetConvenioFinancialReport } from '@api/hooks/useConvenio';
import type { FinancialReport } from '@api/types/FinancialReport';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth-store';
import { unwrapEnvelope } from '@/hooks/owner/utils';
import { getAuthUserConvenioId } from '@/lib/auth-user';

function getCurrentMonthWindow() {
  const now = new Date();

  return {
    from: format(startOfMonth(now), 'yyyy-MM-dd'),
    to: format(now, 'yyyy-MM-dd'),
  };
}

export function useConvenioFinancial() {
  const convenioId = useAuthStore((state) => getAuthUserConvenioId(state.user));
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
        enabled: Boolean(dateFrom && dateTo && convenioId),
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
    report,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    dateFrom,
    dateTo,
    handleDateFrom,
    handleDateTo,
    handleResetDates,
  };
}
