import { router } from 'expo-router';
import { EmptyState } from '@/components/feedback/empty-state';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';

export default function MedicalHistoryScreen() {
  return (
    <ScreenWrapper>
      <EmptyState
        title="Historico medico"
        description="O detalhamento clinico avancado permanece dependente de evolucao de contrato e UI da Semana 12."
        actionLabel="Voltar"
        onAction={() => router.back()}
      />
    </ScreenWrapper>
  );
}
