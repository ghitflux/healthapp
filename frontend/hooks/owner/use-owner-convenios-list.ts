'use client';

import { useMemo, useState } from 'react';
import {
  listAdminConveniosQueryKey,
  useListAdminConvenios,
} from '@api/hooks/useOwner';
import type { AdminConvenioList } from '@api/types/AdminConvenioList';
import type { ListAdminConveniosQueryParams } from '@api/types/ownerTypes/ListAdminConvenios';
import { listAdminConveniosQueryParamsSchema } from '@api/zod/ownerSchemas/listAdminConveniosSchema';
import { queryClient } from '@/lib/query-client';

const DEFAULT_PAGE_SIZE = 20;

export type ConvenioStatusFilter = 'all' | 'active' | 'inactive' | 'approved' | 'pending';

function mapStatusFilter(status: ConvenioStatusFilter): Pick<ListAdminConveniosQueryParams, 'is_active' | 'is_approved'> {
  switch (status) {
    case 'active':
      return { is_active: true };
    case 'inactive':
      return { is_active: false };
    case 'approved':
      return { is_approved: true };
    case 'pending':
      return { is_approved: false };
    default:
      return {};
  }
}

export function useOwnerConveniosList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ConvenioStatusFilter>('all');
  const [ordering, setOrdering] = useState('name');

  const params = useMemo<ListAdminConveniosQueryParams>(() => {
    const candidate = {
      page,
      page_size: pageSize,
      ordering,
      ...(search ? { name: search } : {}),
      ...mapStatusFilter(status),
    };

    return listAdminConveniosQueryParamsSchema.parse(candidate) ?? {};
  }, [page, pageSize, ordering, search, status]);

  const query = useListAdminConvenios(params, {
    query: {
      client: queryClient,
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      placeholderData: (prev) => prev,
    },
  });

  const convenios: AdminConvenioList[] = query.data?.data ?? [];
  const totalPages = query.data?.meta?.total_pages ?? 1;
  const total = query.data?.meta?.total ?? convenios.length;

  function resetPage() {
    setPage(1);
  }

  function handleSearch(value: string) {
    setSearch(value);
    resetPage();
  }

  function handleStatus(value: ConvenioStatusFilter) {
    setStatus(value);
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
    setPageSize,
    search,
    status,
    ordering,
    convenios,
    total,
    totalPages,
    params,
    queryKey: listAdminConveniosQueryKey(params),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    handleSearch,
    handleStatus,
    handleOrdering,
  };
}
