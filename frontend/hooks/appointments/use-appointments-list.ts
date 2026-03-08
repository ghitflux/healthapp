'use client';

/**
 * @file hooks/appointments/use-appointments-list.ts
 * @description Wrapper local sobre useListAppointments (Kubb gerado).
 * Gerencia estado de busca/filtros/paginacao de forma encapsulada.
 */

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useListAppointments, listAppointmentsQueryKey } from '@api/hooks/useAppointments';
import type { ListAppointmentsQueryParams } from '@api/types/appointmentsTypes/ListAppointments';
import type { AppointmentStatusEnum } from '@api/types/AppointmentStatusEnum';
import type { AppointmentTypeEnum } from '@api/types/AppointmentTypeEnum';
import type { AppointmentList } from '@api/types/AppointmentList';
import { queryClient } from '@/lib/query-client';

const LOCAL_PAGE_SIZE = 20;
const SERVER_PAGE_SIZE = 200;

function isWithinDateRange(appointment: AppointmentList, from?: string, to?: string) {
  if (!from && !to) return true;

  const appointmentDate = appointment.scheduled_date;
  if (from && appointmentDate < from) return false;
  if (to && appointmentDate > to) return false;
  return true;
}

export function useAppointmentsList(overrides?: Partial<ListAppointmentsQueryParams>) {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('-scheduled_date');
  const [status, setStatus] = useState<AppointmentStatusEnum | ''>(() => {
    const rawValue = searchParams.get('status');
    if (rawValue === 'pending') return '';
    return (rawValue as AppointmentStatusEnum | null) ?? '';
  });
  const [appointmentType, setAppointmentType] = useState<AppointmentTypeEnum | ''>(() => {
    const rawValue = searchParams.get('type');
    return (rawValue as AppointmentTypeEnum | null) ?? '';
  });
  const [dateFrom, setDateFrom] = useState<string | undefined>(() => searchParams.get('from') ?? undefined);
  const [dateTo, setDateTo] = useState<string | undefined>(() => searchParams.get('to') ?? undefined);

  const params: ListAppointmentsQueryParams = {
    page: 1,
    page_size: SERVER_PAGE_SIZE,
    ...(search ? { search } : {}),
    ordering,
    ...overrides,
  };

  const query = useListAppointments(params, {
    query: {
      client: queryClient,
    },
  });

  const operationalAppointments = useMemo(() => {
    const allAppointments = query.data?.data ?? [];
    return allAppointments.filter((appointment) => appointment.status !== 'pending');
  }, [query.data?.data]);

  const filteredAppointments = useMemo(() => {
    return operationalAppointments.filter((appointment) => {
      if (status && appointment.status !== status) return false;
      if (appointmentType && appointment.appointment_type !== appointmentType) return false;
      return isWithinDateRange(appointment, dateFrom, dateTo);
    });
  }, [appointmentType, dateFrom, dateTo, operationalAppointments, status]);

  const totalCount = filteredAppointments.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / LOCAL_PAGE_SIZE));
  const paginatedAppointments = useMemo(() => {
    const startIndex = (page - 1) * LOCAL_PAGE_SIZE;
    return filteredAppointments.slice(startIndex, startIndex + LOCAL_PAGE_SIZE);
  }, [filteredAppointments, page]);

  function resetPage() {
    setPage(1);
  }

  function handleSearch(value: string) {
    setSearch(value);
    resetPage();
  }

  function handleStatus(value: AppointmentStatusEnum | '') {
    setStatus(value);
    resetPage();
  }

  function handleType(value: AppointmentTypeEnum | '') {
    setAppointmentType(value);
    resetPage();
  }

  function handleDateFrom(value: string | undefined) {
    setDateFrom(value);
    resetPage();
  }

  function handleDateTo(value: string | undefined) {
    setDateTo(value);
    resetPage();
  }

  function handleOrdering(value: string) {
    setOrdering(value);
    resetPage();
  }

  function handleResetFilters() {
    setSearch('');
    setStatus('');
    setAppointmentType('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setOrdering('-scheduled_date');
    setPage(1);
  }

  const activeFilterCount = [
    Boolean(search),
    Boolean(status),
    Boolean(appointmentType),
    Boolean(dateFrom),
    Boolean(dateTo),
    ordering !== '-scheduled_date',
  ].filter(Boolean).length;

  return {
    appointments: paginatedAppointments,
    totalCount,
    totalPages,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    page,
    pageSize: LOCAL_PAGE_SIZE,
    search,
    ordering,
    status,
    appointmentType,
    dateFrom,
    dateTo,
    activeFilterCount,
    setPage,
    handleSearch,
    handleStatus,
    handleType,
    handleDateFrom,
    handleDateTo,
    handleOrdering,
    handleResetFilters,
    queryKey: listAppointmentsQueryKey(params),
  };
}
