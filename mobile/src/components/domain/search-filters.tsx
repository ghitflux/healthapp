import { ScrollView, Text, View } from 'react-native';
import { SEARCH_PRICE_OPTIONS, SPECIALTIES } from '@/lib/constants';
import { FilterChip } from '@/components/domain/filter-chip';

interface SearchFiltersProps {
  selectedSpecialty?: string;
  selectedMaxPrice?: number;
  onlyAvailable: boolean;
  onSpecialtyChange: (specialty?: string) => void;
  onMaxPriceChange: (maxPrice?: number) => void;
  onToggleAvailability: () => void;
}

export function SearchFilters({
  selectedSpecialty,
  selectedMaxPrice,
  onlyAvailable,
  onSpecialtyChange,
  onMaxPriceChange,
  onToggleAvailability,
}: SearchFiltersProps) {
  return (
    <View className="gap-3 border-b border-border bg-background px-5 py-4">
      <View className="gap-2">
        <Text className="text-xs font-semibold uppercase tracking-[0.24px] text-muted">Disponibilidade e preco</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip active={onlyAvailable} label="So com horario" onPress={onToggleAvailability} />
          {SEARCH_PRICE_OPTIONS.map((option) => (
            <FilterChip
              key={option.label}
              active={selectedMaxPrice === option.value}
              label={option.label}
              onPress={() => onMaxPriceChange(option.value)}
            />
          ))}
        </ScrollView>
      </View>

      <View className="gap-2">
        <Text className="text-xs font-semibold uppercase tracking-[0.24px] text-muted">Especialidades</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip active={!selectedSpecialty} label="Todas" onPress={() => onSpecialtyChange(undefined)} />
          {SPECIALTIES.map((specialty) => (
            <FilterChip
              key={specialty}
              active={selectedSpecialty === specialty}
              label={specialty}
              onPress={() => onSpecialtyChange(selectedSpecialty === specialty ? undefined : specialty)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
