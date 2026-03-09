import { FlatList, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { DoctorCard } from '@/components/domain/doctor-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { SearchBar } from '@/components/layout/search-bar';
import { SectionHeader } from '@/components/layout/section-header';
import { IconButton } from '@/components/ui/icon-button';
import { LoadingScreen } from '@/components/layout/loading-screen';
import { SpecialtyChip } from '@/components/domain/specialty-chip';
import { useDoctors } from '@/hooks/use-doctors';
import { useNotifications } from '@/hooks/use-notifications';
import { getFirstName } from '@/lib/formatters';
import { BellIcon, SettingsIcon } from '@/lib/icons';
import { SPECIALTIES } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const { unreadCount } = useNotifications();
  const {
    doctors,
    search,
    setSearch,
    specialty,
    setSpecialty,
    refetch,
    isLoading,
    isFetching,
    isError,
  } = useDoctors();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 16 }}
        data={doctors}
        keyExtractor={(item) => item.id}
        refreshing={isFetching}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <DoctorCard doctor={item} onPress={() => router.push(`/doctor/${item.id}`)} />
        )}
        ListHeaderComponent={
          <View className="mb-5 gap-5">
            <SectionHeader
              title={`Ola, ${getFirstName(user?.full_name)}`}
              subtitle="Como podemos cuidar da sua saude hoje?"
              rightSlot={
                <View className="flex-row gap-3">
                  <View>
                    <IconButton onPress={() => router.push('/(tabs)/profile/notifications')}>
                      <BellIcon color="#0F172A" size={18} />
                    </IconButton>
                    {unreadCount > 0 ? (
                      <View className="absolute -right-1 -top-1 min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1">
                        <Text className="text-[10px] font-bold text-white">{unreadCount}</Text>
                      </View>
                    ) : null}
                  </View>
                  <IconButton onPress={() => router.push('/(tabs)/profile')}>
                    <SettingsIcon color="#0F172A" size={18} />
                  </IconButton>
                </View>
              }
            />

            <SearchBar value={search} onChangeText={setSearch} />

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {SPECIALTIES.map((item) => (
                <SpecialtyChip
                  key={item}
                  label={item}
                  active={specialty === item}
                  onPress={() => setSpecialty(specialty === item ? '' : item)}
                />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <EmptyState
              title="Nenhum medico encontrado"
              description="Ajuste a busca ou troque o filtro de especialidade."
            />
          )
        }
      />
    </View>
  );
}
