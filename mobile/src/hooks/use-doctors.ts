import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ConvenioList } from '@api/types/ConvenioList';
import type { DoctorList } from '@api/types/DoctorList';
import type { ListDoctorsQueryParams } from '@api/types/doctorsTypes/ListDoctors';
import { useListConvenios } from '@api/hooks/useConvenio';
import { useListDoctors } from '@api/hooks/useDoctors';
import { unwrapPaginatedData } from '@/lib/api-envelope';

export interface DoctorFilters {
  search?: string;
  specialty?: string;
  convenio?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  onlyAvailable?: boolean;
}

function sortDoctorsByRating(doctors: DoctorList[]) {
  return [...doctors].sort((left, right) => {
    const leftRating = Number.parseFloat(left.rating ?? '0');
    const rightRating = Number.parseFloat(right.rating ?? '0');
    return rightRating - leftRating;
  });
}

function mergeDoctors(previous: DoctorList[], next: DoctorList[]) {
  const entries = new Map(previous.map((doctor) => [doctor.id, doctor]));

  next.forEach((doctor) => {
    entries.set(doctor.id, doctor);
  });

  return Array.from(entries.values());
}

export function useDoctorsSearch(initialFilters: DoctorFilters = {}) {
  const [filters, setFilters] = useState<DoctorFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [doctors, setDoctors] = useState<DoctorList[]>([]);

  const params: ListDoctorsQueryParams = useMemo(
    () => ({
      include_next_slot: true,
      page,
      page_size: 20,
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.specialty ? { specialty: filters.specialty } : {}),
      ...(filters.convenio ? { convenio: filters.convenio } : {}),
      ...(filters.city ? { city: filters.city } : {}),
      ...(typeof filters.minPrice === 'number' ? { min_price: filters.minPrice } : {}),
      ...(typeof filters.maxPrice === 'number' ? { max_price: filters.maxPrice } : {}),
      ...(filters.onlyAvailable ? { is_available: true } : {}),
    }),
    [filters, page]
  );

  const query = useListDoctors(params);
  const incomingDoctors = unwrapPaginatedData<DoctorList>(query.data);
  const meta = query.data?.meta;
  const hasMore = Boolean(meta?.total_pages && page < meta.total_pages);

  useEffect(() => {
    setDoctors((current) => {
      if (page === 1) {
        return incomingDoctors;
      }

      return mergeDoctors(current, incomingDoctors);
    });
  }, [incomingDoctors, page]);

  const updateFilter = useCallback(<Key extends keyof DoctorFilters>(key: Key, value: DoctorFilters[Key]) => {
    setPage(1);
    setDoctors([]);
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setPage(1);
    setDoctors([]);
    setFilters({});
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || query.isFetching) {
      return;
    }

    setPage((current) => current + 1);
  }, [hasMore, query.isFetching]);

  return {
    doctors,
    meta,
    filters,
    hasMore,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    loadMore,
    updateFilter,
    clearFilters,
    setFilters,
  };
}

export function useHomeDiscovery() {
  const doctorsQuery = useListDoctors({
    include_next_slot: true,
    is_available: true,
    page: 1,
    page_size: 6,
  });
  const clinicsQuery = useListConvenios({
    page: 1,
    page_size: 6,
  });

  const featuredDoctors = sortDoctorsByRating(unwrapPaginatedData<DoctorList>(doctorsQuery.data)).slice(0, 4);
  const clinics = unwrapPaginatedData<ConvenioList>(clinicsQuery.data);

  return {
    featuredDoctors,
    clinics,
    isLoading: doctorsQuery.isLoading || clinicsQuery.isLoading,
    isFetching: doctorsQuery.isFetching || clinicsQuery.isFetching,
    isError: doctorsQuery.isError || clinicsQuery.isError,
    refetch: async () => {
      await Promise.all([doctorsQuery.refetch(), clinicsQuery.refetch()]);
    },
  };
}
