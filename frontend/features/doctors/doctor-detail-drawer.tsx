'use client';

/**
 * @file features/doctors/doctor-detail-drawer.tsx
 * @description Drawer de detalhes do médico.
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RatingStars } from '@/components/ds/rating-stars';
import { CurrencyText } from '@/components/ds/currency-text';
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
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="font-semibold text-lg">{doctor.user_name}</h3>
            {doctor.convenio_name && (
              <p className="text-sm text-muted-foreground">{doctor.convenio_name}</p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Especialidade</p>
              <p className="font-medium">{doctor.specialty}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Preço consulta</p>
              {doctor.consultation_price ? (
                <CurrencyText value={parseFloat(doctor.consultation_price)} className="font-medium" />
              ) : (
                <p className="font-medium text-muted-foreground">—</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Avaliação</p>
              <div className="flex items-center gap-2">
                <RatingStars value={parseFloat(doctor.rating ?? '0')} size="sm" />
                <span className="text-xs text-muted-foreground">({doctor.total_ratings})</span>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Status</p>
              <Badge variant={doctor.is_available ? 'default' : 'secondary'}>
                {doctor.is_available ? 'Disponível' : 'Indisponível'}
              </Badge>
            </div>
            {doctor.next_available_date && (
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1">Próxima disponibilidade</p>
                <p className="font-medium text-sm">
                  {new Date(doctor.next_available_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  {doctor.next_available_time ? ` às ${doctor.next_available_time}` : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
