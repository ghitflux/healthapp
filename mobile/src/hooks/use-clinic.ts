import type { Convenio } from '@api/types/Convenio';
import type { DoctorList } from '@api/types/DoctorList';
import { useGetConvenioById } from '@api/hooks/useConvenio';
import { useListDoctors } from '@api/hooks/useDoctors';
import { unwrapEnvelope, unwrapPaginatedData } from '@/lib/api-envelope';

function sortDoctorsByRating(doctors: DoctorList[]) {
  return [...doctors].sort((left, right) => {
    const leftRating = Number.parseFloat(left.rating ?? '0');
    const rightRating = Number.parseFloat(right.rating ?? '0');
    return rightRating - leftRating;
  });
}

export function useClinic(convenioId: string) {
  const clinicQuery = useGetConvenioById(convenioId, {
    query: {
      enabled: Boolean(convenioId),
    },
  });

  const doctorsQuery = useListDoctors(
    {
      convenio: convenioId,
      include_next_slot: true,
      page: 1,
      page_size: 50,
    },
    {
      query: {
        enabled: Boolean(convenioId),
      },
    }
  );

  return {
    clinic: unwrapEnvelope<Convenio>(clinicQuery.data) ?? null,
    doctors: sortDoctorsByRating(unwrapPaginatedData<DoctorList>(doctorsQuery.data)),
    isLoading: clinicQuery.isLoading || doctorsQuery.isLoading,
    isFetching: clinicQuery.isFetching || doctorsQuery.isFetching,
    isError: clinicQuery.isError || doctorsQuery.isError,
    refetch: async () => {
      await Promise.all([clinicQuery.refetch(), doctorsQuery.refetch()]);
    },
  };
}
