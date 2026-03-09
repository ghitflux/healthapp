import type { AppointmentList } from '@api/types/AppointmentList';
import { useAppointments } from '@/hooks/use-appointments';

export function useRecords() {
  const appointmentsQuery = useAppointments();
  const records = appointmentsQuery.appointments.filter(
    (appointment: AppointmentList) => appointment.status === 'completed'
  );

  return {
    records,
    refetch: appointmentsQuery.refetch,
    isLoading: appointmentsQuery.isLoading,
    isFetching: appointmentsQuery.isFetching,
    isError: appointmentsQuery.isError,
    error: appointmentsQuery.error,
  };
}
