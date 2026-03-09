import { addDays, format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import type { AvailableDate } from '@api/types/AvailableDate';
import type { AvailableSlot } from '@api/types/AvailableSlot';
import { useGetDoctorAvailableDates, useGetDoctorSlots } from '@api/hooks/useDoctors';

export function useDoctorSlots(doctorId: string) {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(format(today, 'yyyy-MM-dd'));

  const datesQuery = useGetDoctorAvailableDates(
    doctorId,
    {
      start_date: format(today, 'yyyy-MM-dd'),
      end_date: format(addDays(today, 30), 'yyyy-MM-dd'),
      page: 1,
      page_size: 31,
    },
    {
      query: {
        enabled: Boolean(doctorId),
      },
    }
  );

  const availableDates = (datesQuery.data?.data ?? []) as AvailableDate[];

  useEffect(() => {
    if (!availableDates.length) {
      return;
    }

    const hasSelectedDate = availableDates.some((item) => item.date === selectedDate);
    if (!hasSelectedDate) {
      setSelectedDate(availableDates[0]?.date ?? format(today, 'yyyy-MM-dd'));
    }
  }, [availableDates, selectedDate, today]);

  const slotsQuery = useGetDoctorSlots(
    doctorId,
    { date: selectedDate, page: 1, page_size: 100 },
    {
      query: {
        enabled: Boolean(doctorId && selectedDate),
      },
    }
  );

  const slots = (slotsQuery.data?.data ?? []) as AvailableSlot[];
  const availableSlots = slots.filter((slot) => slot.is_available);

  return {
    selectedDate,
    setSelectedDate,
    availableDates,
    slots,
    availableSlots,
    isLoadingDates: datesQuery.isLoading,
    isLoadingSlots: slotsQuery.isLoading,
    isFetchingSlots: slotsQuery.isFetching,
    isError: datesQuery.isError || slotsQuery.isError,
    refetch: async () => {
      await Promise.all([datesQuery.refetch(), slotsQuery.refetch()]);
    },
  };
}
