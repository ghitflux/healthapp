'use client';

/**
 * @file hooks/doctors/use-doctors-list.ts
 * @description Wrapper local sobre useListDoctors (Kubb gerado).
 * Gerencia estado de busca/filtros/paginação de forma encapsulada.
 */

import { useState } from 'react';
import { useListDoctors, listDoctorsQueryKey } from '@api/hooks/useDoctors';
import type { ListDoctorsQueryParams } from '@api/types/doctorsTypes/ListDoctors';

const DEFAULT_PAGE_SIZE = 20;

export function useDoctorsList(overrides?: Partial<ListDoctorsQueryParams>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | undefined>(undefined);
  const [ordering, setOrdering] = useState('-created_at');

  const params: ListDoctorsQueryParams = {
    page,
    page_size: pageSize,
    ...(search ? { search } : {}),
    ...(specialty ? { specialty } : {}),
    ...(isAvailable !== undefined ? { is_available: isAvailable } : {}),
    ordering,
    ...overrides,
  };

  const query = useListDoctors(params);

  const totalCount = query.data?.meta?.total ?? 0;
  const totalPages = query.data?.meta?.total_pages ?? Math.ceil(totalCount / pageSize);
  const doctors = query.data?.data ?? [];

  function resetPage() {
    setPage(1);
  }

  function handleSearch(value: string) {
    setSearch(value);
    resetPage();
  }

  function handleSpecialty(value: string) {
    setSpecialty(value);
    resetPage();
  }

  function handleAvailability(value: boolean | undefined) {
    setIsAvailable(value);
    resetPage();
  }

  function handleOrdering(value: string) {
    setOrdering(value);
    resetPage();
  }

  return {
    // Dados
    doctors,
    totalCount,
    totalPages,
    // Estado de query
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    // Filtros
    page,
    pageSize,
    search,
    specialty,
    isAvailable,
    ordering,
    // Setters
    setPage,
    setPageSize,
    handleSearch,
    handleSpecialty,
    handleAvailability,
    handleOrdering,
    // Query key para invalidação
    queryKey: listDoctorsQueryKey(params),
  };
}
