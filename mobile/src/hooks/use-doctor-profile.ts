import type { Doctor } from '@api/types/Doctor';
import { useGetDoctorById } from '@api/hooks/useDoctors';
import { unwrapEnvelope } from '@/lib/api-envelope';

export function useDoctorProfile(doctorId: string) {
  const query = useGetDoctorById(doctorId, {
    query: {
      enabled: Boolean(doctorId),
    },
  });

  return {
    doctor: unwrapEnvelope<Doctor>(query.data) ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
