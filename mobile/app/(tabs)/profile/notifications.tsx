import { router } from 'expo-router';
import { EmptyState } from '@/components/feedback/empty-state';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';

export default function ProfileNotificationsScreen() {
  return (
    <ScreenWrapper>
      <EmptyState
        title="Preferencias de notificacao"
        description="Os controles detalhados de push e lembretes entram na Semana 12. O wiring de device token ja esta preparado."
        actionLabel="Voltar"
        onAction={() => router.back()}
      />
    </ScreenWrapper>
  );
}
