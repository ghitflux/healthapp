import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppointmentCard } from '@/components/domain/appointment-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { IconButton } from '@/components/ui/icon-button';
import { LoadingScreen } from '@/components/layout/loading-screen';
import { CalendarIcon, PlusIcon } from '@/lib/icons';
import { useAppointments } from '@/hooks/use-appointments';
import { cn } from '@/lib/utils';

export default function AppointmentsScreen() {
  const [segment, setSegment] = useState<'upcoming' | 'past'>('upcoming');
  const { upcomingAppointments, pastAppointments, refetch, isLoading, isFetching, isError } = useAppointments();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const items = segment === 'upcoming' ? upcomingAppointments : pastAppointments;

  return (
    <View className="flex-1 bg-background px-5 pt-4">
      <View className="gap-5">
        <Text className="text-3xl font-bold text-foreground">Meus Agendamentos</Text>

        <View className="flex-row gap-3">
          <Pressable
            className={cn(
              'flex-1 rounded-2xl px-4 py-3',
              segment === 'upcoming' ? 'bg-primary-600' : 'bg-white'
            )}
            onPress={() => setSegment('upcoming')}
          >
            <Text className={cn('text-center font-semibold', segment === 'upcoming' ? 'text-white' : 'text-foreground')}>
              Proximos ({upcomingAppointments.length})
            </Text>
          </Pressable>
          <Pressable
            className={cn(
              'flex-1 rounded-2xl px-4 py-3',
              segment === 'past' ? 'bg-primary-600' : 'bg-white'
            )}
            onPress={() => setSegment('past')}
          >
            <Text className={cn('text-center font-semibold', segment === 'past' ? 'text-white' : 'text-foreground')}>
              Passados ({pastAppointments.length})
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        className="mt-5 flex-1"
        contentContainerStyle={{ gap: 14, paddingBottom: 120 }}
        data={items}
        keyExtractor={(item) => item.id}
        refreshing={isFetching}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            onViewDetails={() => router.push(`/(tabs)/appointments/${item.id}`)}
            onSecondaryAction={() => router.push('/booking/select-time')}
          />
        )}
        ListEmptyComponent={
          isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <EmptyState
              title="Sem agendamentos nesta aba"
              description="Novos agendamentos confirmados aparecerao aqui."
            />
          )
        }
      />

      <View className="absolute bottom-8 right-6">
        <IconButton className="h-14 w-14 rounded-full border-primary-600 bg-primary-600" onPress={() => router.push('/booking/select-time')}>
          <View className="flex-row items-center justify-center">
            <CalendarIcon color="#FFFFFF" size={18} />
            <PlusIcon color="#FFFFFF" size={16} />
          </View>
        </IconButton>
      </View>
    </View>
  );
}
