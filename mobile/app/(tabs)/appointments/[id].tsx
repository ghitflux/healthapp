import { Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import type { Appointment } from '@api/types/Appointment';
import type { Payment } from '@api/types/Payment';
import { useGetAppointmentById } from '@api/hooks/useAppointments';
import { useGetPaymentStatus } from '@api/hooks/usePayments';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingScreen } from '@/components/layout/loading-screen';
import { PaymentMethodBadge } from '@/components/domain/payment-method-badge';
import { StatusBadge } from '@/components/domain/status-badge';
import { CalendarIcon, ChevronLeftIcon, ClockIcon, MapPinIcon, UserIcon } from '@/lib/icons';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { unwrapEnvelope } from '@/lib/api-envelope';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';

export default function AppointmentDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const appointmentQuery = useGetAppointmentById(params.id ?? '', {
    query: { enabled: Boolean(params.id) },
  });

  const appointment = unwrapEnvelope<Appointment>(appointmentQuery.data);

  const paymentQuery = useGetPaymentStatus(appointment?.payment ?? '', {
    query: { enabled: Boolean(appointment?.payment) },
  });
  const payment = unwrapEnvelope<Payment>(paymentQuery.data);

  if (appointmentQuery.isLoading) {
    return <LoadingScreen />;
  }

  if (appointmentQuery.isError || !appointment) {
    return (
      <ScreenWrapper>
        <ErrorState onRetry={() => appointmentQuery.refetch()} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View className="gap-4">
        <Button
          label="Voltar"
          variant="ghost"
          fullWidth={false}
          onPress={() => router.back()}
          leftIcon={<ChevronLeftIcon color="#2563EB" size={18} />}
        />

        <Text className="text-3xl font-bold text-foreground">Detalhes do agendamento</Text>

        <Card className="gap-4">
          <View className="flex-row flex-wrap gap-2">
            <StatusBadge type="appointment" status={appointment.status} />
            {payment ? <StatusBadge type="payment" status={payment.status} /> : null}
          </View>

          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">{appointment.convenio_name}</Text>
            <View className="flex-row items-center gap-2">
              <UserIcon size={15} color="#64748B" />
              <Text className="text-sm text-muted">{appointment.doctor_name}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <CalendarIcon size={15} color="#64748B" />
              <Text className="text-sm text-muted">
                {formatDateTime(appointment.scheduled_date, appointment.scheduled_time)}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <ClockIcon size={15} color="#64748B" />
              <Text className="text-sm text-muted">{appointment.duration_minutes ?? 30} minutos</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <MapPinIcon size={15} color="#64748B" />
              <Text className="text-sm text-muted">Endereco detalhado sera exibido na Semana 10.</Text>
            </View>
          </View>

          <Divider />

          <View className="gap-2">
            <Text className="text-sm font-medium text-muted">Valor</Text>
            <Text className="text-base font-semibold text-primary-700">{formatCurrency(appointment.price)}</Text>
          </View>
        </Card>

        {payment ? (
          <Card className="gap-3">
            <Text className="text-base font-semibold text-foreground">Pagamento</Text>
            <View className="flex-row items-center gap-2">
              <PaymentMethodBadge method={payment.payment_method} />
              <StatusBadge type="payment" status={payment.status} />
            </View>
            <Text className="text-sm text-muted">Pago em: {payment.paid_at ? formatDateTime(payment.paid_at) : 'Aguardando confirmacao'}</Text>
          </Card>
        ) : (
          <EmptyState
            title="Pagamento ainda nao vinculado"
            description="O backend ainda nao expôs detalhes adicionais nesta consulta."
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
