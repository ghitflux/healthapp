'use client';

/**
 * @file features/doctors/doctor-detail-drawer.tsx
 * @description Drawer de detalhes do médico.
 */

import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RatingStars } from '@/components/ds/rating-stars';
import { CurrencyText } from '@/components/ds/currency-text';
import { DetailInfoRow } from '@/components/patterns/detail-info-row';
import {
  CalendarCheckIcon,
  CalendarIcon,
  DollarSignIcon,
  StethoscopeIcon,
  TrendingUpIcon,
} from '@/lib/icons';
import type { DoctorList } from '@api/types/DoctorList';

interface DoctorDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  doctor: DoctorList | null;
}

export function DoctorDetailDrawer({ open, onClose, doctor }: DoctorDetailDrawerProps) {
  if (!doctor) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do Médico</SheetTitle>
          <SheetDescription>
            Consulte disponibilidade, desempenho e o vínculo operacional do médico com a clínica.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={doctor.is_available ? 'default' : 'secondary'}>
                {doctor.is_available ? 'Disponível' : 'Indisponível'}
              </Badge>
              {doctor.convenio_name && (
                <span className="text-sm text-muted-foreground">{doctor.convenio_name}</span>
              )}
            </div>

            <div className="mt-3 space-y-1">
              <h3 className="text-lg font-semibold">{doctor.user_name}</h3>
              <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
              Visão operacional
            </h4>
            <DetailInfoRow label="Especialidade" icon={StethoscopeIcon} value={doctor.specialty} />
            <DetailInfoRow label="Clínica" value={doctor.convenio_name ?? 'Clínica atual'} />
            <DetailInfoRow
              label="Preço de consulta"
              icon={DollarSignIcon}
              value={
                doctor.consultation_price ? (
                  <CurrencyText value={parseFloat(doctor.consultation_price)} />
                ) : (
                  'Não informado'
                )
              }
            />
            <DetailInfoRow
              label="Avaliação"
              icon={TrendingUpIcon}
              value={
                <div className="flex items-center gap-2">
                  <RatingStars value={parseFloat(doctor.rating ?? '0')} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    ({doctor.total_ratings ?? 0})
                  </span>
                </div>
              }
            />
            <DetailInfoRow
              label="Próxima disponibilidade"
              icon={CalendarIcon}
              value={
                doctor.next_available_date
                  ? `${new Date(`${doctor.next_available_date}T00:00:00`).toLocaleDateString('pt-BR')}${doctor.next_available_time ? ` as ${doctor.next_available_time}` : ''}`
                  : 'Sem horários futuros'
              }
            />
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/convenio/schedules">Ver agendas</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/convenio/appointments?search=${encodeURIComponent(doctor.user_name)}`}>
                <CalendarCheckIcon className="mr-2 h-4 w-4" />
                Ver atendimentos
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
