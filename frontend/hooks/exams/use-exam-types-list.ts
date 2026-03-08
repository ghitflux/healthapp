'use client';

/**
 * @file hooks/exams/use-exam-types-list.ts
 * @description Wrapper local sobre useListExamTypes (Kubb gerado).
 */

import { useState } from 'react';
import { useListExamTypes, listExamTypesQueryKey } from '@api/hooks/useConvenio';
import { queryClient } from '@/lib/query-client';

const DEFAULT_PAGE_SIZE = 20;

export function useExamTypesList(convenioId: string) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);

  const params = {
    page,
    page_size: pageSize,
    ...(search ? { search } : {}),
    ...(isActive !== undefined ? { is_active: isActive } : {}),
    ...(convenioId ? { convenio: convenioId } : {}),
  };

  const query = useListExamTypes(params, {
    query: {
      client: queryClient,
      enabled: Boolean(convenioId),
    },
  });

  const totalCount = query.data?.meta?.total ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const examTypes = query.data?.data ?? [];

  return {
    examTypes,
    totalCount,
    totalPages,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    page,
    pageSize,
    search,
    isActive,
    setPage,
    handleSearch: (v: string) => { setSearch(v); setPage(1); },
    handleIsActive: (v: boolean | undefined) => { setIsActive(v); setPage(1); },
    queryKey: listExamTypesQueryKey(params),
  };
}
