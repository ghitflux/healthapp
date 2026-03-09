import { router } from 'expo-router';
import { EmptyState } from '@/components/feedback/empty-state';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';

export default function DependentsScreen() {
  return (
    <ScreenWrapper>
      <EmptyState
        title="Dependentes em breve"
        description="O fluxo de familiares e autorizacoes entra nas proximas semanas do roadmap mobile."
        actionLabel="Voltar"
        onAction={() => router.back()}
      />
    </ScreenWrapper>
  );
}
