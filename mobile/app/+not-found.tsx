import { router } from 'expo-router';
import { EmptyState } from '@/components/feedback/empty-state';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';

export default function NotFoundScreen() {
  return (
    <ScreenWrapper>
      <EmptyState
        title="Tela nao encontrada"
        description="O caminho solicitado nao existe neste app."
        actionLabel="Voltar ao inicio"
        onAction={() => router.replace('/')}
      />
    </ScreenWrapper>
  );
}
