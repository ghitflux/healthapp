import { router } from 'expo-router';
import { EmptyState } from '@/components/feedback/empty-state';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';

export default function SelectTimeScreen() {
  return (
    <ScreenWrapper>
      <EmptyState
        title="Selecao de horario"
        description="A navegacao do fluxo de booking ja existe, mas a experiencia completa entra na Semana 10."
        actionLabel="Ir para confirmacao"
        onAction={() => router.push('/booking/confirm')}
      />
    </ScreenWrapper>
  );
}
