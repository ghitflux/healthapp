import { router } from 'expo-router';
import { EmptyState } from '@/components/feedback/empty-state';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';

export default function ClinicDetailScreen() {
  return (
    <ScreenWrapper>
      <EmptyState
        title="Detalhe da clinica"
        description="A API do paciente ainda nao expõe um diretório publico de clinicas. A tela fica preparada para a Semana 10."
        actionLabel="Voltar"
        onAction={() => router.back()}
      />
    </ScreenWrapper>
  );
}
