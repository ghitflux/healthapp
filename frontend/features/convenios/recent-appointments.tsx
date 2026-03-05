'use client';

import Link from 'next/link';
import { useListAppointments } from '@api/hooks/useAppointments';
import type { AppointmentList } from '@api/types/AppointmentList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ds/status-pill';
import { DateTimeText } from '@/components/ds/datetime-text';
import { Button } from '@/components/ui/button';
import { queryClient } from '@/lib/query-client';

export function RecentAppointments() {
  const query = useListAppointments(
    { page: 1, page_size: 5, ordering: '-scheduled_date' },
    {
      query: {
        client: queryClient,
        staleTime: 1000 * 60 * 5,
      },
    }
  );

  if (query.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agendamentos Recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const appointments: AppointmentList[] = query.data?.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-base">Agendamentos Recentes</CardTitle>
        <Button asChild variant="ghost" size="sm" className="h-8 px-2">
          <Link href="/convenio/appointments">Ver todos</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum agendamento recente
          </p>
        ) : (
          appointments.slice(0, 5).map((apt) => {
            return (
              <div
                key={apt.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{apt.doctor_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {apt.doctor_specialty} ·{' '}
                    <DateTimeText
                      value={`${apt.scheduled_date}T${apt.scheduled_time}`}
                      variant="datetime"
                    />
                  </p>
                </div>
                {apt.status && <StatusPill status={apt.status} />}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
