'use client';

/**
 * @file features/appointments/appointments-table.tsx
 * @description Tabela de agendamentos com colunas, status e ações.
 */

import { memo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusPill } from '@/components/ds/status-pill';
import { AppointmentTypeBadge } from '@/components/ds/appointment-type-badge';
import { CurrencyText } from '@/components/ds/currency-text';
import { DateTimeText } from '@/components/ds/datetime-text';
import { SkeletonTable } from '@/components/patterns/skeleton-table';
import { EmptyStateBlock } from '@/components/patterns/empty-state-block';
import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import {
  MoreHorizontalIcon,
  EyeIcon,
  XCircleIcon,
  PlayCircleIcon,
  CircleCheckBigIcon,
  UserRoundXIcon,
  CalendarCheckIcon,
} from '@/lib/icons';
import type { AppointmentList } from '@api/types/AppointmentList';
import type { AppointmentStatusEnum } from '@api/types/AppointmentStatusEnum';

interface AppointmentsTableProps {
  appointments: AppointmentList[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onView: (appointment: AppointmentList) => void;
  onCancel: (appointment: AppointmentList) => void;
  onStart: (appointment: AppointmentList) => void;
  onComplete: (appointment: AppointmentList) => void;
  onNoShow: (appointment: AppointmentList) => void;
}

function canCancel(status?: AppointmentStatusEnum) {
  return status === 'pending' || status === 'confirmed';
}
function canStart(status?: AppointmentStatusEnum) {
  return status === 'confirmed';
}
function canComplete(status?: AppointmentStatusEnum) {
  return status === 'in_progress';
}
function canMarkNoShow(status?: AppointmentStatusEnum) {
  return status === 'in_progress';
}

export const AppointmentsTable = memo(function AppointmentsTable({
  appointments,
  isLoading,
  isError,
  onRetry,
  onView,
  onCancel,
  onStart,
  onComplete,
  onNoShow,
}: AppointmentsTableProps) {
  if (isLoading) return <SkeletonTable columns={7} rows={8} />;
  if (isError) return <ErrorStateBlock title="Erro ao carregar agendamentos" onRetry={onRetry} />;
  if (appointments.length === 0) {
    return (
      <EmptyStateBlock
        icon={CalendarCheckIcon}
        title="Nenhum agendamento encontrado"
        description="Ajuste os filtros ou aguarde novos atendimentos liberados após pagamento dos pacientes."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-card shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Médico</TableHead>
            <TableHead className="hidden md:table-cell">Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell text-right">Valor</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((apt) => (
            <TableRow key={apt.id} className="hover:bg-muted/50 transition-colors">
              <TableCell className="min-w-[150px]">
                <DateTimeText
                  value={`${apt.scheduled_date}T${apt.scheduled_time}`}
                  className="text-sm font-medium"
                />
              </TableCell>
              <TableCell className="min-w-[220px]">
                <div>
                  <p className="font-medium">{apt.doctor_name}</p>
                  <p className="text-xs text-muted-foreground">{apt.doctor_specialty}</p>
                  <div className="mt-2 md:hidden">
                    <AppointmentTypeBadge type={apt.appointment_type} />
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <AppointmentTypeBadge type={apt.appointment_type} />
              </TableCell>
              <TableCell>
                {apt.status && (
                  <StatusPill
                    status={apt.status}
                    label={apt.status === 'pending' ? 'Aguardando PIX' : undefined}
                  />
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-right">
                {apt.price ? <CurrencyText value={Number.parseFloat(apt.price)} /> : '—'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontalIcon className="h-4 w-4" />
                      <span className="sr-only">Ações</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(apt)}>
                      <EyeIcon className="mr-2 h-4 w-4" />
                      Ver detalhes
                    </DropdownMenuItem>
                    {canStart(apt.status) && (
                      <DropdownMenuItem onClick={() => onStart(apt)}>
                        <PlayCircleIcon className="mr-2 h-4 w-4 text-primary-600" />
                        Iniciar consulta
                      </DropdownMenuItem>
                    )}
                    {canComplete(apt.status) && (
                      <DropdownMenuItem onClick={() => onComplete(apt)}>
                        <CircleCheckBigIcon className="mr-2 h-4 w-4 text-success-600" />
                        Concluir
                      </DropdownMenuItem>
                    )}
                    {canMarkNoShow(apt.status) && (
                      <DropdownMenuItem onClick={() => onNoShow(apt)}>
                        <UserRoundXIcon className="mr-2 h-4 w-4 text-warning-600" />
                        Não compareceu
                      </DropdownMenuItem>
                    )}
                    {canCancel(apt.status) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onCancel(apt)}
                          className="text-destructive focus:text-destructive"
                        >
                          <XCircleIcon className="mr-2 h-4 w-4" />
                          Cancelar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
