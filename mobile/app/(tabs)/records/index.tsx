import { FlatList, Text, View } from 'react-native';
import { router } from 'expo-router';
import { RecordCard } from '@/components/domain/record-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingScreen } from '@/components/layout/loading-screen';
import { useRecords } from '@/hooks/use-records';

export default function RecordsScreen() {
  const { records, refetch, isLoading, isFetching, isError } = useRecords();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-background px-5 pt-4">
      <Text className="text-3xl font-bold text-foreground">Meu Prontuario</Text>

      <FlatList
        className="mt-5 flex-1"
        contentContainerStyle={{ gap: 14, paddingBottom: 60 }}
        data={records}
        keyExtractor={(item) => item.id}
        refreshing={isFetching}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <RecordCard appointment={item} onPress={() => router.push(`/(tabs)/records/${item.id}`)} />
        )}
        ListEmptyComponent={
          isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <EmptyState
              title="Nenhum registro concluido"
              description="Consultas e exames concluídos aparecerao nesta area."
            />
          )
        }
      />
    </View>
  );
}
