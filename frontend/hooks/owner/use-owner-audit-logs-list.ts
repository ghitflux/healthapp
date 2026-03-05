'use client';

import { useMemo, useState } from 'react';
import { listAuditLogsQueryKey, useListAuditLogs } from '@api/hooks/useOwner';
import type { AuditLog } from '@api/types/AuditLog';
import type { ListAuditLogsQueryParams } from '@api/types/ownerTypes/ListAuditLogs';
import { listAuditLogsQueryParamsSchema } from '@api/zod/ownerSchemas/listAuditLogsSchema';
import { queryClient } from '@/lib/query-client';
import { normalizeActionFilter } from './utils';

const DEFAULT_PAGE_SIZE = 20;

export function useOwnerAuditLogsList() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [modelName, setModelName] = useState('');
  const [user, setUser] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ordering, setOrdering] = useState('-timestamp');

  const params = useMemo<ListAuditLogsQueryParams>(() => {
    const candidate = {
      page,
      page_size: pageSize,
      ordering,
      ...(search ? { search } : {}),
      ...(normalizeActionFilter(action) ? { action: normalizeActionFilter(action) } : {}),
      ...(modelName ? { model_name: modelName } : {}),
      ...(user ? { user } : {}),
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
    };

    return listAuditLogsQueryParamsSchema.parse(candidate) ?? {};
  }, [action, dateFrom, dateTo, modelName, ordering, page, pageSize, search, user]);

  const query = useListAuditLogs(params, {
    query: {
      client: queryClient,
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      placeholderData: (prev) => prev,
    },
  });

  const logs: AuditLog[] = query.data?.data ?? [];
  const totalPages = query.data?.meta?.total_pages ?? 1;
  const total = query.data?.meta?.total ?? logs.length;

  function resetPage() {
    setPage(1);
  }

  function handleSearch(value: string) {
    setSearch(value);
    resetPage();
  }

  function handleAction(value: string) {
    setAction(value);
    resetPage();
  }

  function handleModel(value: string) {
    setModelName(value);
    resetPage();
  }

  function handleUser(value: string) {
    setUser(value);
    resetPage();
  }

  function handleDateFrom(value: string) {
    setDateFrom(value);
    resetPage();
  }

  function handleDateTo(value: string) {
    setDateTo(value);
    resetPage();
  }

  function handleOrdering(value: string) {
    setOrdering(value);
    resetPage();
  }

  return {
    page,
    setPage,
    pageSize,
    search,
    action,
    modelName,
    user,
    dateFrom,
    dateTo,
    ordering,
    logs,
    total,
    totalPages,
    params,
    queryKey: listAuditLogsQueryKey(params),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    handleSearch,
    handleAction,
    handleModel,
    handleUser,
    handleDateFrom,
    handleDateTo,
    handleOrdering,
  };
}
