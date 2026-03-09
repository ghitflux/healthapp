import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, router } from 'expo-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DoctorMiniCard } from '@/components/domain/doctor-mini-card';
import { PaymentMethodBadge } from '@/components/domain/payment-method-badge';
import { PixQrMock } from '@/components/domain/pix-qr-mock';
import { StatusBadge } from '@/components/domain/status-badge';
import { EmptyState } from '@/components/feedback/empty-state';
import { showSuccessToast } from '@/components/feedback/toast';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { MOCK_PIX_ENABLED } from '@/lib/constants';
import { formatCurrency, formatLongDate, formatTime } from '@/lib/formatters';
import { ChevronLeftIcon, CopyIcon, CreditCardIcon, QrCodeIcon } from '@/lib/icons';
import { usePaymentPolling } from '@/hooks/use-payment-polling';
import { useBookingStore } from '@/stores/booking-store';

function normalizeParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function formatRemainingTime(expiresAt: string | null | undefined, now: number) {
  if (!expiresAt) return '--:--';

  const remaining = new Date(expiresAt).getTime() - now;
  if (remaining <= 0) return '00:00';

  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function BookingPaymentScreen() {
  const params = useLocalSearchParams<{ paymentId?: string | string[]; appointmentId?: string | string[] }>();
  const incomingPaymentId = normalizeParam(params.paymentId) || null;
  const draft = useBookingStore((state) => state.draft);
  const mockPixPayment = useBookingStore((state) => state.mockPixPayment);
  const createMockPix = useBookingStore((state) => state.createMockPix);
  const clearMockPix = useBookingStore((state) => state.clearMockPix);
  const completeMockPix = useBookingStore((state) => state.completeMockPix);
  const failMockPix = useBookingStore((state) => state.failMockPix);
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'credit_card'>('pix');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!MOCK_PIX_ENABLED || incomingPaymentId || !draft.doctorId || mockPixPayment) {
      return;
    }

    createMockPix();
  }, [createMockPix, draft.doctorId, incomingPaymentId, mockPixPayment]);

  const activePaymentId = incomingPaymentId ?? mockPixPayment?.id ?? null;
  const { payment } = usePaymentPolling(activePaymentId);

  useEffect(() => {
    if (!payment?.pix_expiration || payment.status !== 'pending') {
      return;
    }

    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [payment?.id, payment?.pix_expiration, payment?.status]);

  const remainingTime = useMemo(() => formatRemainingTime(payment?.pix_expiration, now), [now, payment?.pix_expiration]);

  useEffect(() => {
    if (payment?.status === 'pending' && remainingTime === '00:00') {
      failMockPix();
    }
  }, [failMockPix, payment?.status, remainingTime]);

  if (!draft.doctorId && !incomingPaymentId) {
    return (
      <ScreenWrapper>
        <EmptyState
          title="Nenhuma simulacao ativa"
          description="Volte ao fluxo de agendamento para gerar um PIX de teste."
          actionLabel="Escolher horario"
          onAction={() => router.replace('/search')}
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
            onPress={() => router.back()}
          >
            <ChevronLeftIcon color="#0F172A" size={20} />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">Pagamento</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            {draft.doctorName && draft.specialty && draft.clinicName ? (
              <DoctorMiniCard
                clinicName={draft.clinicName}
                doctorName={draft.doctorName}
                specialty={draft.specialty}
              />
            ) : null}

            <Card className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-foreground">Resumo financeiro</Text>
                <Badge label="Mock Pix" className="border-primary-200 bg-primary-50" textClassName="text-primary-700" />
              </View>
              <Text className="text-3xl font-semibold text-foreground">
                {draft.price ? formatCurrency(draft.price) : 'Valor indisponivel'}
              </Text>
              <Text className="text-sm text-muted">
                {draft.date ? formatLongDate(draft.date) : 'Data pendente'} as {formatTime(draft.time)}
              </Text>
              <Text className="text-sm leading-6 text-muted">
                Checkout local de desenvolvimento. Nenhum webhook Stripe ou criacao real de pagamento sera disparado.
              </Text>
            </Card>

            <View className="flex-row gap-3">
              <Pressable
                className={`flex-1 rounded-2xl border px-4 py-4 ${selectedMethod === 'pix' ? 'border-primary-600 bg-primary-50' : 'border-border bg-white'}`}
                onPress={() => setSelectedMethod('pix')}
              >
                <View className="flex-row items-center gap-2">
                  <QrCodeIcon color="#2563EB" size={18} />
                  <Text className="text-base font-semibold text-foreground">PIX</Text>
                </View>
                <Text className="mt-2 text-sm text-muted">QR e copia-e-cola simulados para testar o fluxo.</Text>
              </Pressable>

              <Pressable
                className={`flex-1 rounded-2xl border px-4 py-4 ${selectedMethod === 'credit_card' ? 'border-primary-600 bg-primary-50' : 'border-border bg-white'}`}
                onPress={() => setSelectedMethod('credit_card')}
              >
                <View className="flex-row items-center gap-2">
                  <CreditCardIcon color="#2563EB" size={18} />
                  <Text className="text-base font-semibold text-foreground">Cartao</Text>
                </View>
                <Text className="mt-2 text-sm text-muted">Payment Sheet real continua planejado para a Semana 11.</Text>
              </Pressable>
            </View>

            {selectedMethod === 'credit_card' ? (
              <Card className="gap-3">
                <Text className="text-lg font-semibold text-foreground">Cartao ainda nao habilitado</Text>
                <Text className="text-sm leading-6 text-muted">
                  A fundacao do Stripe ja existe no app. O checkout nativo com Payment Sheet sera conectado quando o
                  fluxo real de criacao de appointment for habilitado.
                </Text>
                <Button label="Voltar para PIX mock" onPress={() => setSelectedMethod('pix')} variant="outline" />
              </Card>
            ) : payment ? (
              <>
                <Card className="gap-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <PaymentMethodBadge method={payment.payment_method} />
                      <StatusBadge status={payment.status} type="payment" />
                    </View>
                    <Text className="text-sm text-muted">Expira em {remainingTime}</Text>
                  </View>

                  <PixQrMock value={payment.id} />

                  <View className="gap-2 rounded-2xl bg-background p-4">
                    <Text className="text-sm font-semibold text-foreground">Codigo copia e cola</Text>
                    <Text className="text-xs leading-6 text-muted">{payment.pix_code}</Text>
                  </View>

                  <Button
                    label="Copiar codigo PIX"
                    leftIcon={<CopyIcon color="#FFFFFF" size={16} />}
                    onPress={async () => {
                      await Clipboard.setStringAsync(payment.pix_code);
                      showSuccessToast('Codigo PIX copiado para a area de transferencia.');
                    }}
                  />
                </Card>

                {payment.status === 'completed' ? (
                  <Card className="gap-3 border-emerald-200 bg-emerald-50">
                    <Text className="text-base font-semibold text-emerald-700">Pagamento simulado com sucesso</Text>
                    <Text className="text-sm leading-6 text-emerald-700">
                      O mock foi aprovado localmente. Abra o comprovante para revisar o recibo desta simulacao.
                    </Text>
                    <Button
                      label="Ver comprovante"
                      onPress={() => router.replace({ pathname: '/booking/success', params: { paymentId: payment.id } })}
                    />
                  </Card>
                ) : payment.status === 'failed' ? (
                  <Card className="gap-3 border-rose-200 bg-rose-50">
                    <Text className="text-base font-semibold text-rose-700">PIX expirado ou marcado como falho</Text>
                    <Text className="text-sm leading-6 text-rose-700">
                      Gere um novo codigo para repetir a simulacao de pagamento dentro do app.
                    </Text>
                    <Button
                      label="Gerar novo PIX"
                      onPress={() => {
                        clearMockPix();
                        createMockPix();
                      }}
                    />
                  </Card>
                ) : (
                  <View className="gap-3">
                    <Button
                      label="Simular pagamento aprovado"
                      onPress={() => {
                        completeMockPix();
                        router.replace({ pathname: '/booking/success', params: { paymentId: payment.id } });
                      }}
                    />
                    <Button
                      label="Simular expiracao"
                      onPress={() => failMockPix()}
                      variant="outline"
                    />
                  </View>
                )}
              </>
            ) : (
              <Card className="gap-3">
                <Text className="text-lg font-semibold text-foreground">Gerando PIX de teste</Text>
                <Text className="text-sm text-muted">A simulacao local prepara o QR mock e o codigo copia-e-cola.</Text>
              </Card>
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}
