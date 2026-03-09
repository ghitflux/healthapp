import { Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { PaymentMethodBadge } from '@/components/domain/payment-method-badge';
import { StatusBadge } from '@/components/domain/status-badge';
import { usePaymentPolling } from '@/hooks/use-payment-polling';

export default function BookingPaymentScreen() {
  const params = useLocalSearchParams<{ paymentId?: string }>();
  const { payment } = usePaymentPolling(params.paymentId ?? null);

  return (
    <ScreenWrapper>
      <View className="gap-4">
        <Text className="text-3xl font-bold text-foreground">Pagamento</Text>

        <Card className="gap-3">
          <Text className="text-base font-semibold text-foreground">Fundacao pronta</Text>
          <Text className="text-sm leading-6 text-muted">
            StripeProvider, rotas, hook de polling e badge de status ja estao prontos nesta semana. O checkout nativo
            completo fica para a Semana 11.
          </Text>
          <View className="flex-row gap-2">
            <PaymentMethodBadge method="pix" />
            <PaymentMethodBadge method="credit_card" />
          </View>
          {payment ? (
            <View className="gap-2">
              <StatusBadge type="payment" status={payment.status} />
              <Text className="text-sm text-muted">Pagamento acompanhado via polling.</Text>
            </View>
          ) : null}
        </Card>

        <Button label="Ver comprovante placeholder" onPress={() => router.push('/booking/success')} />
      </View>
    </ScreenWrapper>
  );
}
