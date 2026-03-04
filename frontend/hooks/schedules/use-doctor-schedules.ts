'use client';

/**
 * @file hooks/schedules/use-doctor-schedules.ts
 * @description Wrapper hook sobre useListDoctorSchedules para encapsular
 * a lógica de habilitação/desabilitação da query por doctorId.
 */

import {
  useListDoctorSchedules,
  listDoctorSchedulesQueryKey,
} from '@api/hooks/useConvenio';
import type { ListDoctorSchedulesQueryParams } from '@api/types/convenioTypes/ListDoctorSchedules';
import type { DoctorSchedule } from '@api/types/DoctorSchedule';

export function useDoctorSchedules(doctorId: string | null) {
  const params: ListDoctorSchedulesQueryParams | undefined = doctorId
    ? { page_size: 100 }
    : undefined;

  const query = useListDoctorSchedules(params, {
    query: { enabled: !!doctorId },
  });

  const allSchedules: DoctorSchedule[] = query.data?.data ?? [];

  // Filter client-side since the generated API params don't include a doctor filter
  const schedules = doctorId
    ? allSchedules.filter((s) => s.doctor === doctorId)
    : [];

  return {
    schedules,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    queryKey: listDoctorSchedulesQueryKey(params ?? {}),
  };
}
