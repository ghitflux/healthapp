import { router } from 'expo-router';
import { EmptyState } from '@/components/feedback/empty-state';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';

export default function BookingSuccessScreen() {
  return (
    <ScreenWrapper>
      <EmptyState
        title="Agendamento confirmado"
        description="Tela de sucesso placeholder com a base visual pronta para animacao e comprovante na Semana 11."
        actionLabel="Ir para meus agendamentos"
        onAction={() => router.replace('/(tabs)/appointments')}
      />
    </ScreenWrapper>
  );
}
