import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DoctorMiniCard } from '@/components/domain/doctor-mini-card';
import { PaymentMethodBadge } from '@/components/domain/payment-method-badge';
import { StatusBadge } from '@/components/domain/status-badge';
import { EmptyState } from '@/components/feedback/empty-state';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { usePaymentPolling } from '@/hooks/use-payment-polling';
import { formatCurrency, formatLongDate, formatTime } from '@/lib/formatters';
import { CheckIcon, ChevronLeftIcon } from '@/lib/icons';
import { useBookingStore } from '@/stores/booking-store';

function normalizeParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function BookingSuccessScreen() {
  const params = useLocalSearchParams<{ paymentId?: string | string[] }>();
  const incomingPaymentId = normalizeParam(params.paymentId) || null;
  const draft = useBookingStore((state) => state.draft);
  const mockPixPayment = useBookingStore((state) => state.mockPixPayment);
  const resetBooking = useBookingStore((state) => state.resetBooking);
  const { payment } = usePaymentPolling(incomingPaymentId ?? mockPixPayment?.id ?? null);

  if (!payment) {
    return (
      <ScreenWrapper>
        <EmptyState
          title="Comprovante indisponivel"
          description="Nenhum pagamento mock foi encontrado para exibir nesta tela."
          actionLabel="Voltar ao inicio"
          onAction={() => router.replace('/(tabs)')}
        />
      </ScreenWrapper>
    );
  }

  if (payment.status !== 'completed') {
    return (
      <ScreenWrapper>
        <EmptyState
          title="Pagamento ainda nao concluido"
          description="Finalize a simulacao de PIX antes de abrir o comprovante."
          actionLabel="Voltar para pagamento"
          onAction={() => router.replace({ pathname: '/booking/payment', params: { paymentId: payment.id } })}
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper className="bg-background" scroll={false}>
      <View className="flex-1">
        <View className="flex-row items-center gap-3 border-b border-border bg-white px-5 py-4">
          <Pressable
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full border border-border bg-background"
            onPress={() => router.replace('/(tabs)')}
          >
            <ChevronLeftIcon color="#0F172A" size={20} />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">Comprovante mock</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            <Card className="items-center gap-4 border-emerald-200 bg-emerald-50 px-5 py-8">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-600">
                <CheckIcon color="#FFFFFF" size={28} />
              </View>
              <View className="items-center gap-1">
                <Text className="text-2xl font-semibold text-emerald-700">Pagamento simulado aprovado</Text>
                <Text className="text-center text-sm leading-6 text-emerald-700">
                  O fluxo local de PIX foi concluido com sucesso para validar a experiencia do paciente.
                </Text>
              </View>
            </Card>

            {draft.doctorName && draft.specialty && draft.clinicName ? (
              <DoctorMiniCard
                clinicName={draft.clinicName}
                doctorName={draft.doctorName}
                specialty={draft.specialty}
              />
            ) : null}

            <Card className="gap-4">
              <Text className="text-lg font-semibold text-foreground">Resumo da simulacao</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">Valor</Text>
                <Text className="text-sm font-semibold text-foreground">{formatCurrency(payment.amount)}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">Metodo</Text>
                <PaymentMethodBadge method={payment.payment_method} />
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">Status</Text>
                <StatusBadge status={payment.status} type="payment" />
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">Data da consulta</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {draft.date ? formatLongDate(draft.date) : '-'}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">Horario</Text>
                <Text className="text-sm font-semibold text-foreground">{formatTime(draft.time)}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">Referencia</Text>
                <Text className="text-sm font-semibold text-foreground">{payment.metadata?.appointment_id ?? payment.id}</Text>
              </View>
            </Card>

            <Card className="gap-3">
              <Text className="text-base font-semibold text-foreground">Observacao</Text>
              <Text className="text-sm leading-6 text-muted">
                Este comprovante pertence ao mock local do app mobile. Ele nao cria appointment real e nao aparece em
                "Meus agendamentos". Serve para validar UX, texto e navegacao do checkout Pix antes da integracao final.
              </Text>
            </Card>

            <Button
              label="Voltar para inicio"
              onPress={() => {
                resetBooking();
                router.replace('/(tabs)');
              }}
            />
            <Button
              label="Buscar outro medico"
              onPress={() => {
                resetBooking();
                router.replace('/search');
              }}
              variant="outline"
            />
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}
