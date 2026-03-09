import { router } from 'expo-router';
import { EmptyState } from '@/components/feedback/empty-state';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';

export default function RegisterClinicScreen() {
  return (
    <ScreenWrapper>
      <EmptyState
        title="Cadastro de clinica"
        description="O onboarding B2B continua pelo painel web. Nesta fase o app mobile atende apenas pacientes."
        actionLabel="Voltar ao login"
        onAction={() => router.replace('/(auth)/login')}
      />
    </ScreenWrapper>
  );
}
