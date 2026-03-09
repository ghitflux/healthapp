import { router } from 'expo-router';
import { EmptyState } from '@/components/feedback/empty-state';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';

export default function BookingConfirmScreen() {
  return (
    <ScreenWrapper>
      <EmptyState
        title="Confirmacao do agendamento"
        description="A tela de resumo do booking sera conectada aos slots e ao createAppointment na Semana 11."
        actionLabel="Ir para pagamento"
        onAction={() => router.push('/booking/payment')}
      />
    </ScreenWrapper>
  );
}
