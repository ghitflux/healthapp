import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Profile } from '@api/types/Profile';
import { useGetUserProfile } from '@api/hooks/useUsers';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingScreen } from '@/components/layout/loading-screen';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { ChevronRightIcon, EditIcon, FileTextIcon, LogOutIcon, PhoneIcon, ShieldIcon, UsersIcon, BellIcon, CreditCardIcon } from '@/lib/icons';
import { formatDate, formatPhone } from '@/lib/formatters';
import { getErrorMessage, unwrapEnvelope } from '@/lib/api-envelope';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { showErrorToast } from '@/components/feedback/toast';

function MenuRow({
  icon,
  title,
  description,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 rounded-2xl px-2 py-3">
      <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-50">{icon}</View>
      <View className="flex-1 gap-1">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        <Text className="text-xs text-muted">{description}</Text>
      </View>
      <ChevronRightIcon size={16} color="#64748B" />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const query = useGetUserProfile();
  const profile = unwrapEnvelope<Profile>(query.data);
  const setUser = useAuthStore((state) => state.setUser);
  const { logout } = useAuth();

  useEffect(() => {
    if (profile) {
      setUser(profile);
    }
  }, [profile, setUser]);

  async function handleLogout() {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      showErrorToast(getErrorMessage(error, 'Nao foi possivel sair da conta.'));
    }
  }

  if (query.isLoading) {
    return <LoadingScreen />;
  }

  const user = profile ?? useAuthStore.getState().user;

  return (
    <ScreenWrapper>
      <View className="gap-5">
        <Text className="text-3xl font-bold text-foreground">Meu Perfil</Text>

        <Card className="gap-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-row items-center gap-4">
              <Avatar uri={user?.avatar_url} name={user?.full_name} size="lg" />
              <View className="flex-1 gap-1">
                <Text className="text-xl font-semibold text-foreground">{user?.full_name ?? 'Paciente'}</Text>
                <Text className="text-sm text-muted">{user?.email ?? '-'}</Text>
                <Text className="text-sm text-muted">{formatPhone(user?.phone)}</Text>
                <Text className="text-sm text-muted">{user?.date_of_birth ? formatDate(user.date_of_birth) : '-'}</Text>
              </View>
            </View>

            <Pressable onPress={() => router.push('/(tabs)/profile/edit')}>
              <EditIcon color="#2563EB" size={18} />
            </Pressable>
          </View>
        </Card>

        <Card className="gap-2">
          <Text className="text-base font-semibold text-foreground">Conta</Text>
          <MenuRow
            icon={<UsersIcon color="#2563EB" size={18} />}
            title="Dependentes"
            description="Gerencie familiares e autorizacoes"
            onPress={() => router.push('/(tabs)/profile/dependents')}
          />
          <MenuRow
            icon={<CreditCardIcon color="#2563EB" size={18} />}
            title="Historico de pagamentos"
            description="Resumo de transacoes e comprovantes"
            onPress={() => router.push('/booking/payment')}
          />
        </Card>

        <Card className="gap-2">
          <Text className="text-base font-semibold text-foreground">Configuracoes</Text>
          <MenuRow
            icon={<BellIcon color="#2563EB" size={18} />}
            title="Notificacoes"
            description="Lembretes e alertas do app"
            onPress={() => router.push('/(tabs)/profile/notifications')}
          />
          <MenuRow
            icon={<FileTextIcon color="#2563EB" size={18} />}
            title="Historico medico"
            description="Seus registros de saude"
            onPress={() => router.push('/(tabs)/profile/medical-history')}
          />
        </Card>

        <Card className="gap-2">
          <Text className="text-base font-semibold text-foreground">Suporte</Text>
          <MenuRow
            icon={<ShieldIcon color="#2563EB" size={18} />}
            title="Termos e Privacidade"
            description="Politicas e direitos LGPD"
            onPress={() => router.push('/(tabs)/profile/terms')}
          />
          <MenuRow
            icon={<PhoneIcon color="#2563EB" size={18} />}
            title="Central de ajuda"
            description="Canal de suporte do SIS"
            onPress={() => router.push('/(tabs)/profile/notifications')}
          />
        </Card>

        <Button label="Sair da conta" variant="danger" leftIcon={<LogOutIcon color="#FFFFFF" size={18} />} onPress={handleLogout} />
      </View>
    </ScreenWrapper>
  );
}
