import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ClinicCard, ClinicCardSkeleton } from '@/components/domain/clinic-card';
import { DoctorCard, DoctorCardSkeleton } from '@/components/domain/doctor-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { SectionHeader } from '@/components/layout/section-header';
import { IconButton } from '@/components/ui/icon-button';
import { SpecialtyChip } from '@/components/domain/specialty-chip';
import { useHomeDiscovery } from '@/hooks/use-doctors';
import { useNotifications } from '@/hooks/use-notifications';
import { getFirstName } from '@/lib/formatters';
import { BellIcon, SearchIcon, SettingsIcon } from '@/lib/icons';
import { SPECIALTIES } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';
import { Card } from '@/components/ui/card';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const { unreadCount } = useNotifications();
  const { featuredDoctors, clinics, refetch, isLoading, isFetching, isError } = useHomeDiscovery();

  return (
    <View className="flex-1 bg-background">
      <FlatList
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 16, paddingBottom: 32 }}
        data={featuredDoctors}
        keyExtractor={(item) => item.id}
        refreshing={isFetching}
        onRefresh={() => {
          void refetch();
        }}
        renderItem={({ item }) => (
          <DoctorCard
            doctor={item}
            onPress={() => router.push({ pathname: '/doctor/[id]', params: { id: item.id } })}
          />
        )}
        ListHeaderComponent={
          <View className="mb-5 gap-5">
            <SectionHeader
              title={`Ola, ${getFirstName(user?.full_name)}`}
              subtitle="Explore medicos, clinicas e horarios livres."
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

            <Card className="gap-4 bg-primary-600">
              <View className="gap-2">
                <Text className="text-2xl font-semibold text-white">Agendamento rapido e pagamento seguro</Text>
                <Text className="text-sm leading-6 text-primary-100">
                  Descubra especialistas, compare horarios e siga ate o checkout em poucos toques.
                </Text>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 rounded-2xl bg-white/10 px-4 py-3">
                  <Text className="text-xs uppercase tracking-[0.2px] text-primary-100">Especialistas</Text>
                  <Text className="mt-1 text-xl font-semibold text-white">{featuredDoctors.length}</Text>
                </View>
                <View className="flex-1 rounded-2xl bg-white/10 px-4 py-3">
                  <Text className="text-xs uppercase tracking-[0.2px] text-primary-100">Clinicas</Text>
                  <Text className="mt-1 text-xl font-semibold text-white">{clinics.length}</Text>
                </View>
              </View>
            </Card>

            <Pressable
              className="min-h-[52px] flex-row items-center gap-3 rounded-2xl border border-border bg-white px-4"
              onPress={() => router.push('/search')}
            >
              <SearchIcon color="#64748B" size={18} />
              <Text className="text-base text-muted">Buscar medico, especialidade ou clinica</Text>
            </Pressable>

            <FlatList
              data={SPECIALTIES}
              horizontal
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <SpecialtyChip
                  key={item}
                  label={item}
                  onPress={() =>
                    router.push({ pathname: '/search', params: { specialty: item } })
                  }
                />
              )}
              showsHorizontalScrollIndicator={false}
            />

            <SectionHeader
              title="Medicos em destaque"
              subtitle="Perfis com agenda publica e melhor avaliacao."
            />
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <DoctorCardSkeleton key={`doctor-skeleton-${index}`} />
              ))}
            </View>
          ) : isError && !featuredDoctors.length && !clinics.length ? (
            <ErrorState
              description="Nao foi possivel carregar os destaques do paciente."
              onRetry={() => {
                void refetch();
              }}
            />
          ) : !featuredDoctors.length ? (
            <EmptyState
              title="Nenhum medico em destaque"
              description="Use a busca para encontrar um profissional ou ver as clinicas parceiras."
              actionLabel="Abrir busca"
              onAction={() => router.push('/search')}
            />
          ) : null
        }
        ListFooterComponent={
          <View className="gap-4 pt-5">
            <SectionHeader title="Clinicas parceiras" subtitle="Explore convenios e equipes disponiveis." />
            {isLoading && !clinics.length ? (
              <View className="gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <ClinicCardSkeleton key={`clinic-skeleton-${index}`} />
                ))}
              </View>
            ) : clinics.length ? (
              <FlatList
                data={clinics}
                horizontal
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ClinicCard
                    clinic={item}
                    onPress={() => router.push({ pathname: '/clinic/[id]', params: { id: item.id } })}
                  />
                )}
                showsHorizontalScrollIndicator={false}
              />
            ) : (
              <EmptyState
                title="Clinicas em atualizacao"
                description="Nenhuma clinica parceira foi publicada para o paciente neste momento."
              />
            )}
          </View>
        }
      />
    </View>
  );
}
