import type { AppointmentList } from '@api/types/AppointmentList';
import { useListAppointments } from '@api/hooks/useAppointments';
import { unwrapPaginatedData } from '@/lib/api-envelope';

const UPCOMING_STATUSES = new Set(['pending', 'confirmed', 'in_progress']);
const PAST_STATUSES = new Set(['completed', 'cancelled', 'no_show']);

function byDateTimeDesc(a: AppointmentList, b: AppointmentList) {
  const left = `${a.scheduled_date}T${a.scheduled_time}`;
  const right = `${b.scheduled_date}T${b.scheduled_time}`;
  return right.localeCompare(left);
}

export function useAppointments() {
  const query = useListAppointments({
    page: 1,
    page_size: 100,
    ordering: '-scheduled_date',
  });

  const appointments = unwrapPaginatedData<AppointmentList>(query.data).sort(byDateTimeDesc);
  const upcomingAppointments = appointments.filter((item) => item.status && UPCOMING_STATUSES.has(item.status));
  const pastAppointments = appointments.filter((item) => item.status && PAST_STATUSES.has(item.status));

  return {
    appointments,
    upcomingAppointments,
    pastAppointments,
    refetch: query.refetch,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}
