import { useEffect, useState } from 'react';
import type { DoctorList } from '@api/types/DoctorList';
import { useListDoctors } from '@api/hooks/useDoctors';
import type { ListDoctorsQueryParams } from '@api/types/doctorsTypes/ListDoctors';
import { unwrapPaginatedData } from '@/lib/api-envelope';

export function useDoctors() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [specialty, setSpecialty] = useState<string>('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const params: ListDoctorsQueryParams = {
    page: 1,
    page_size: 20,
    include_next_slot: true,
    is_available: true,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(specialty ? { specialty } : {}),
  };

  const query = useListDoctors(params);
  const doctors = unwrapPaginatedData<DoctorList>(query.data);

  return {
    doctors,
    search,
    setSearch,
    specialty,
    setSpecialty,
    refetch: query.refetch,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}
