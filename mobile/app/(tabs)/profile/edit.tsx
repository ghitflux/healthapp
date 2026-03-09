import { Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Profile } from '@api/types/Profile';
import { useGetUserProfile } from '@api/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingScreen } from '@/components/layout/loading-screen';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { ChevronLeftIcon } from '@/lib/icons';
import { formatDate, formatPhone } from '@/lib/formatters';
import { unwrapEnvelope } from '@/lib/api-envelope';

export default function EditProfileScreen() {
  const query = useGetUserProfile();
  const profile = unwrapEnvelope<Profile>(query.data);

  if (query.isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ScreenWrapper>
      <View className="gap-4">
        <Button
          label="Voltar"
          variant="ghost"
          fullWidth={false}
          onPress={() => router.back()}
          leftIcon={<ChevronLeftIcon color="#2563EB" size={18} />}
        />

        <Text className="text-3xl font-bold text-foreground">Editar perfil</Text>

        <Card className="gap-3">
          <Text className="text-sm text-muted">
            A tela de edicao completa entra no refinamento da fase mobile. Os dados atuais ja estao conectados a API.
          </Text>
          <Text className="text-base font-semibold text-foreground">{profile?.full_name}</Text>
          <Text className="text-sm text-muted">{profile?.email}</Text>
          <Text className="text-sm text-muted">{formatPhone(profile?.phone)}</Text>
          <Text className="text-sm text-muted">{profile?.date_of_birth ? formatDate(profile.date_of_birth) : '-'}</Text>
        </Card>
      </View>
    </ScreenWrapper>
  );
}
