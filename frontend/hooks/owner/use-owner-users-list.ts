'use client';

import { useMemo, useState } from 'react';
import { listAdminUsersQueryKey, useListAdminUsers } from '@api/hooks/useOwner';
import type { AdminUserList } from '@api/types/AdminUserList';
import type { RoleEnum } from '@api/types/RoleEnum';
import type { ListAdminUsersQueryParams } from '@api/types/ownerTypes/ListAdminUsers';
import { listAdminUsersQueryParamsSchema } from '@api/zod/ownerSchemas/listAdminUsersSchema';
import { queryClient } from '@/lib/query-client';

const DEFAULT_PAGE_SIZE = 20;

export type UserStatusFilter = 'all' | 'active' | 'inactive';

export function useOwnerUsersList() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleEnum | 'all'>('all');
  const [status, setStatus] = useState<UserStatusFilter>('all');
  const [ordering, setOrdering] = useState('-date_joined');

  const params = useMemo<ListAdminUsersQueryParams>(() => {
    const normalizedSearch = search.trim();
    const searchScope = normalizedSearch
      ? normalizedSearch.includes('@')
        ? { email: normalizedSearch }
        : { full_name: normalizedSearch }
      : {};

    const candidate = {
      page,
      page_size: pageSize,
      ordering,
      ...(normalizedSearch ? { search: normalizedSearch } : {}),
      ...searchScope,
      ...(role !== 'all' ? { role } : {}),
      ...(status === 'active' ? { is_active: true } : {}),
      ...(status === 'inactive' ? { is_active: false } : {}),
    };

    return listAdminUsersQueryParamsSchema.parse(candidate) ?? {};
  }, [ordering, page, pageSize, role, search, status]);

  const query = useListAdminUsers(params, {
    query: {
      client: queryClient,
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      placeholderData: (prev) => prev,
    },
  });

  const users: AdminUserList[] = query.data?.data ?? [];
  const totalPages = query.data?.meta?.total_pages ?? 1;
  const total = query.data?.meta?.total ?? users.length;

  function resetPage() {
    setPage(1);
  }

  function handleSearch(value: string) {
    setSearch(value);
    resetPage();
  }

  function handleRole(value: RoleEnum | 'all') {
    setRole(value);
    resetPage();
  }

  function handleStatus(value: UserStatusFilter) {
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
    search,
    role,
    status,
    ordering,
    users,
    total,
    totalPages,
    params,
    queryKey: listAdminUsersQueryKey(params),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    handleSearch,
    handleRole,
    handleStatus,
    handleOrdering,
  };
}
