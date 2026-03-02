'use client';

import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
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

export function TopDoctorsTable() {
  const { data, isLoading } = useQuery<TopDoctor[]>({
    queryKey: ['top-doctors'],
    queryFn: async () => {
      const response = await api.get('/v1/convenios/dashboard/');
      const raw = response.data.data ?? response.data;
      return raw.top_doctors ?? [];
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
                  .split(' ')
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
                      <div className="flex items-center justify-end gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{doctor.rating.toFixed(1)}</span>
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
