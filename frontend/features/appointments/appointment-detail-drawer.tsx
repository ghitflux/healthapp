'use client';

/**
 * @file features/appointments/appointment-detail-drawer.tsx
 * @description Side panel com detalhes completos de um agendamento.
 */

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatusPill } from '@/components/ds/status-pill';
import { AppointmentTypeBadge } from '@/components/ds/appointment-type-badge';
import { CurrencyText } from '@/components/ds/currency-text';
import { DateTimeText } from '@/components/ds/datetime-text';
import { PaymentMethodBadge } from '@/components/ds/payment-method-badge';
import { DetailInfoRow } from '@/components/patterns/detail-info-row';
import { SkeletonTable } from '@/components/patterns/skeleton-table';
import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { useGetAppointmentById } from '@api/hooks/useAppointments';
import { useGetPaymentStatus } from '@api/hooks/usePayments';
import { queryClient } from '@/lib/query-client';
import {
  UserIcon,
  StethoscopeIcon,
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  FileTextIcon,
  XCircleIcon,
  PlayCircleIcon,
  CircleCheckBigIcon,
  UserRoundXIcon,
  InfoIcon,
} from '@/lib/icons';
import type { AppointmentStatusEnum } from '@api/types/AppointmentStatusEnum';
import Link from 'next/link';

interface AppointmentDetailDrawerProps {
  appointmentId: string | null;
  open: boolean;
  onClose: () => void;
  onCancel?: (id: string) => void;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onNoShow?: (id: string) => void;
}

export function AppointmentDetailDrawer({
  appointmentId,
  open,
  onClose,
  onCancel,
  onStart,
  onComplete,
  onNoShow,
}: AppointmentDetailDrawerProps) {
  const { data, isLoading } = useGetAppointmentById(appointmentId ?? '', {
    query: {
      client: queryClient,
      enabled: !!appointmentId && open,
    },
  });

  const paymentQuery = useGetPaymentStatus(data?.payment ?? '', {
    query: {
      client: queryClient,
      enabled: !!data?.payment && open,
    },
  });

  const apt = data;
  const payment = (() => {
    if (!paymentQuery.data || typeof paymentQuery.data !== 'object') return undefined;
    const payload = paymentQuery.data as { data?: typeof paymentQuery.data };
    return payload.data ?? paymentQuery.data;
  })();
  const status = apt?.status as AppointmentStatusEnum | undefined;
  const scheduledAt = apt ? `${apt.scheduled_date}T${apt.scheduled_time}` : '';

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Detalhes do Agendamento</SheetTitle>
          <SheetDescription>
            Consulte o contexto do atendimento e execute a próxima ação disponível.
          </SheetDescription>
        </SheetHeader>

        {isLoading && <SkeletonTable columns={2} rows={6} />}

        {!isLoading && !apt && (
          <div className="mt-4">
            <ErrorStateBlock title="Agendamento indisponível" message="Não foi possível carregar os detalhes deste agendamento." />
          </div>
        )}

        {apt && (
          <div className="mt-4 space-y-4">
            <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center gap-3">
                {status && <StatusPill status={status} className="text-sm" />}
                <AppointmentTypeBadge type={apt.appointment_type} />
              </div>
              <div className="space-y-1">
                <DateTimeText value={scheduledAt} className="text-base font-semibold" />
                <p className="text-sm text-muted-foreground">
                  Atendimento da clínica {apt.convenio_name}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Informações gerais</h4>
              <DetailInfoRow label="Paciente" icon={UserIcon} value={apt.patient_name} />
              <DetailInfoRow label="Médico" icon={StethoscopeIcon} value={apt.doctor_name} />
              <DetailInfoRow label="Clínica" value={apt.convenio_name} />
              <DetailInfoRow
                label="Data e hora"
                icon={CalendarIcon}
                value={<DateTimeText value={scheduledAt} />}
              />
              <DetailInfoRow
                label="Duração"
                icon={ClockIcon}
                value={apt.duration_minutes ? `${apt.duration_minutes} min` : 'Não informada'}
              />
              <DetailInfoRow label="Tipo de atendimento" value={<AppointmentTypeBadge type={apt.appointment_type} />} />
              {apt.exam_type && <DetailInfoRow label="Exame" value={apt.exam_type} />}
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Pagamento</h4>
              <DetailInfoRow
                label="Valor"
                icon={DollarSignIcon}
                value={apt.price ? <CurrencyText value={Number.parseFloat(apt.price)} /> : 'Não informado'}
              />
              <DetailInfoRow
                label="Status do pagamento"
                value={
                  payment?.status ? (
                    <StatusPill
                      status={payment.status}
                      label={
                        payment.status === 'pending' || payment.status === 'processing'
                          ? 'Aguardando PIX'
                          : undefined
                      }
                    />
                  ) : apt.payment ? (
                    'Carregando pagamento...'
                  ) : (
                    'Sem pagamento vinculado'
                  )
                }
              />
              <DetailInfoRow
                label="Método"
                value={
                  payment?.payment_method ? (
                    <PaymentMethodBadge method={payment.payment_method} />
                  ) : (
                    'Não informado'
                  )
                }
              />
            </div>

            {status === 'pending' && (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Aguardando confirmação do pagamento</AlertTitle>
                <AlertDescription>
                  Este agendamento só entra na operação da clínica após o PIX ser confirmado pelo backend.
                </AlertDescription>
              </Alert>
            )}

            {apt.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Notas</h4>
                  <DetailInfoRow label="Observações" icon={FileTextIcon} value={apt.notes} />
                </div>
              </>
            )}

            {apt.cancellation_reason && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Cancelamento</h4>
                  <DetailInfoRow
                    label="Motivo"
                    icon={XCircleIcon}
                    value={apt.cancellation_reason}
                  />
                </div>
              </>
            )}

            <Separator />

            <div>
              <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Timeline</h4>
              <div className="space-y-1">
                <DetailInfoRow label="Agendamento criado" value={<DateTimeText value={apt.created_at} />} />
                {apt.started_at && (
                  <DetailInfoRow label="Consulta iniciada" value={<DateTimeText value={apt.started_at} />} />
                )}
                {apt.completed_at && (
                  <DetailInfoRow label="Consulta concluida" value={<DateTimeText value={apt.completed_at} />} />
                )}
                {apt.no_show_at && (
                  <DetailInfoRow label="No-show registrado" value={<DateTimeText value={apt.no_show_at} />} />
                )}
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button type="button" size="sm" variant="outline" asChild>
                <Link href="/convenio/schedules">Ver agenda do médico</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {status === 'confirmed' && onStart && (
                <Button size="sm" onClick={() => onStart(apt.id)}>
                  <PlayCircleIcon className="mr-2 h-4 w-4" />
                  Iniciar
                </Button>
              )}
              {status === 'in_progress' && onComplete && (
                <Button size="sm" onClick={() => onComplete(apt.id)}>
                  <CircleCheckBigIcon className="mr-2 h-4 w-4" />
                  Concluir
                </Button>
              )}
              {status === 'in_progress' && onNoShow && (
                <Button size="sm" variant="outline" onClick={() => onNoShow(apt.id)}>
                  <UserRoundXIcon className="mr-2 h-4 w-4" />
                  Não compareceu
                </Button>
              )}
              {(status === 'pending' || status === 'confirmed') && onCancel && (
                <Button size="sm" variant="destructive" onClick={() => onCancel(apt.id)}>
                  <XCircleIcon className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
