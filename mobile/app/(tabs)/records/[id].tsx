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
import { CalendarIcon, ChevronLeftIcon, DownloadIcon, PrinterIcon, UserIcon } from '@/lib/icons';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { unwrapEnvelope } from '@/lib/api-envelope';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';

export default function RecordDetailScreen() {
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
      <View className="gap-4 pb-8">
        <Button
          label="Voltar"
          variant="ghost"
          fullWidth={false}
          onPress={() => router.back()}
          leftIcon={<ChevronLeftIcon color="#2563EB" size={18} />}
        />

        <Text className="text-3xl font-bold text-foreground">Detalhes do prontuario</Text>

        <Card className="gap-4">
          <View className="flex-row flex-wrap gap-2">
            <StatusBadge type="payment" status={payment?.status ?? 'completed'} />
            <PaymentMethodBadge method={payment?.payment_method} />
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted">Numero</Text>
            <Text className="text-sm font-semibold text-foreground">#{appointment.id.slice(0, 8).toUpperCase()}</Text>
          </View>

          <Divider />

          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <UserIcon size={15} color="#64748B" />
              <Text className="text-sm text-muted">{appointment.patient_name}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <CalendarIcon size={15} color="#64748B" />
              <Text className="text-sm text-muted">
                {formatDateTime(appointment.scheduled_date, appointment.scheduled_time)}
              </Text>
            </View>
            <Text className="text-base font-semibold text-foreground">{appointment.convenio_name}</Text>
            <Text className="text-sm text-muted">{appointment.doctor_name}</Text>
            <Text className="text-base font-semibold text-primary-700">{formatCurrency(payment?.amount ?? appointment.price)}</Text>
          </View>

          <Divider />

          <View className="gap-2">
            <Text className="text-sm font-medium text-muted">Observacoes</Text>
            <Text className="text-sm leading-6 text-foreground">
              {appointment.notes?.trim() || 'Ainda nao ha observacoes ou laudos expostos nesta resposta da API.'}
            </Text>
          </View>
        </Card>

        <Card className="gap-3">
          <Text className="text-base font-semibold text-foreground">Documentos</Text>
          <EmptyState
            title="Sem anexos"
            description="Laudos e PDFs ainda nao fazem parte do contrato mobile desta fase."
          />
        </Card>

        <View className="gap-3">
          <Button label="Imprimir PDF" variant="outline" leftIcon={<PrinterIcon color="#0F172A" size={18} />} />
          <Button
            label="Baixar comprovante"
            variant="ghost"
            leftIcon={<DownloadIcon color="#2563EB" size={18} />}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}
