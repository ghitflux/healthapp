'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { StatusPill } from '@/components/ds/status-pill';
import type { AppointmentStatus } from '@/components/ds/status-pill';
import { DateTimeText } from '@/components/ds/datetime-text';

interface RecentAppointment {
  id: string;
  patient_name: string;
  doctor_name: string;
  scheduled_at: string;
  status: string;
}


export function RecentAppointments() {
  const { data, isLoading } = useQuery<RecentAppointment[]>({
    queryKey: ['recent-appointments'],
    queryFn: async () => {
      const response = await api.get('/v1/convenios/dashboard/');
      const raw = response.data.data ?? response.data;
      return raw.recent_appointments ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
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

  const appointments = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agendamentos Recentes</CardTitle>
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
                  <p className="text-sm font-medium">{apt.patient_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Dr(a). {apt.doctor_name} ·{' '}
                    <DateTimeText value={apt.scheduled_at} variant="datetime" />
                  </p>
                </div>
                <StatusPill status={apt.status as AppointmentStatus} />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
