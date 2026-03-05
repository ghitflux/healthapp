'use client';

import { useQuery } from '@tanstack/react-query';
import { RatingStars } from '@/components/ds/rating-stars';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';

interface TopDoctor {
  id: string;
  name: string;
  specialty: string;
  avatar_url?: string;
  total_appointments: number;
  rating: number;
}

function toText(value: unknown, fallback: string) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function mapTopDoctor(raw: unknown, index: number): TopDoctor {
  const row = (raw ?? {}) as {
    id?: string | number;
    name?: string;
    user_name?: string;
    doctor_name?: string;
    specialty?: string;
    avatar_url?: string;
    total_appointments?: number | string;
    rating?: number | string;
  };

  const name = toText(row.name ?? row.user_name ?? row.doctor_name, 'Sem nome');

  return {
    id: toText(row.id, `doctor-${index}`),
    name,
    specialty: toText(row.specialty, 'Sem especialidade'),
    avatar_url: typeof row.avatar_url === 'string' ? row.avatar_url : undefined,
    total_appointments: toNumber(row.total_appointments),
    rating: toNumber(row.rating),
  };
}

export function TopDoctorsTable() {
  const { data, isLoading } = useQuery<TopDoctor[]>({
    queryKey: ['top-doctors'],
    queryFn: async () => {
      const response = await api.get('/v1/convenios/dashboard/');
      const raw = response.data.data ?? response.data;
      const doctors = Array.isArray(raw?.top_doctors) ? raw.top_doctors : [];
      return doctors.map(mapTopDoctor);
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Médicos</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const doctors = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Médicos</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {doctors.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Nenhum dado disponível
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Médico</TableHead>
                <TableHead className="text-right">Agend.</TableHead>
                <TableHead className="text-right">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.slice(0, 5).map((doctor) => {
                const initials = doctor.name
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('');
                return (
                  <TableRow key={doctor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={doctor.avatar_url} />
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{doctor.name}</p>
                          <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">{doctor.total_appointments}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <RatingStars value={doctor.rating} size="sm" showValue />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
