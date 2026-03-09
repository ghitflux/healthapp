import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { DoctorCard, DoctorCardSkeleton } from '@/components/domain/doctor-card';
import { SearchFilters } from '@/components/domain/search-filters';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { SearchHeader } from '@/components/layout/search-header';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { useDebounce } from '@/hooks/use-debounce';
import { useDoctorsSearch } from '@/hooks/use-doctors';

function normalizeParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{ search?: string | string[]; specialty?: string | string[] }>();
  const initialSearch = normalizeParam(params.search);
  const initialSpecialty = normalizeParam(params.specialty);
  const [searchText, setSearchText] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchText, 300);
  const { doctors, meta, filters, hasMore, isLoading, isFetching, isError, refetch, loadMore, updateFilter, clearFilters } =
    useDoctorsSearch({
      search: initialSearch || undefined,
      specialty: initialSpecialty || undefined,
    });

  useEffect(() => {
    updateFilter('search', debouncedSearch || undefined);
  }, [debouncedSearch, updateFilter]);

  const totalResults = meta?.total ?? doctors.length;

  return (
    <ScreenWrapper className="bg-background" scroll={false}>
      <View className="flex-1">
        <SearchHeader autoFocus onBack={() => router.back()} onChangeText={setSearchText} value={searchText} />

        <SearchFilters
          onlyAvailable={Boolean(filters.onlyAvailable)}
          onMaxPriceChange={(value) => updateFilter('maxPrice', value)}
          onSpecialtyChange={(value) => updateFilter('specialty', value)}
          onToggleAvailability={() => updateFilter('onlyAvailable', !filters.onlyAvailable)}
          selectedMaxPrice={filters.maxPrice}
          selectedSpecialty={filters.specialty}
        />

        {isError && !doctors.length ? (
          <View className="px-5 py-5">
            <ErrorState
              description="Nao foi possivel consultar os medicos agora."
              onRetry={() => {
                void refetch();
              }}
            />
          </View>
        ) : isLoading && !doctors.length ? (
          <FlatList
            contentContainerStyle={{ padding: 20, gap: 16 }}
            data={Array.from({ length: 4 }, (_, index) => index)}
            keyExtractor={(item) => `doctor-skeleton-${item}`}
            renderItem={() => <DoctorCardSkeleton />}
          />
        ) : (
          <FlatList
            contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 32 }}
            data={doctors}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              <Text className="mb-2 text-sm text-muted">
                {totalResults} medico{totalResults === 1 ? '' : 's'} encontrado{totalResults === 1 ? '' : 's'}
              </Text>
            }
            ListEmptyComponent={
              <EmptyState
                title="Nenhum medico encontrado"
                description="Ajuste os filtros ou tente outro termo na busca."
                actionLabel="Limpar filtros"
                onAction={() => {
                  setSearchText('');
                  clearFilters();
                }}
              />
            }
            ListFooterComponent={
              isFetching && hasMore ? (
                <View className="mt-4 gap-4">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <DoctorCardSkeleton key={`doctor-footer-skeleton-${index}`} />
                  ))}
                </View>
              ) : null
            }
            onEndReached={() => {
              if (hasMore) {
                loadMore();
              }
            }}
            onEndReachedThreshold={0.4}
            onRefresh={() => {
              void refetch();
            }}
            refreshing={isFetching && !isLoading}
            renderItem={({ item }) => (
              <DoctorCard
                doctor={item}
                onPress={() => router.push({ pathname: '/doctor/[id]', params: { id: item.id } })}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
