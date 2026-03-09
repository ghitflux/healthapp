import { FlatList, Pressable, Text, View } from 'react-native';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AvailableDate } from '@api/types/AvailableDate';

interface DateSelectorProps {
  availableDates: AvailableDate[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  daysToShow?: number;
}

export function DateSelector({
  availableDates,
  selectedDate,
  onSelectDate,
  daysToShow = 30,
}: DateSelectorProps) {
  const availableMap = new Map(availableDates.map((item) => [item.date, item.slots_count]));
  const dates = Array.from({ length: daysToShow }, (_, index) => {
    const date = addDays(new Date(), index);
    const isoDate = format(date, 'yyyy-MM-dd');
    const slotsCount = availableMap.get(isoDate) ?? 0;
    return {
      isoDate,
      date,
      slotsCount,
      isSelected: isoDate === selectedDate,
      isAvailable: slotsCount > 0,
    };
  });

  return (
    <FlatList
      contentContainerStyle={{ paddingHorizontal: 20 }}
      data={dates}
      horizontal
      keyExtractor={(item) => item.isoDate}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          className={`mr-3 h-24 w-20 items-center justify-center rounded-[24px] border px-2 ${
            item.isSelected
              ? 'border-primary-600 bg-primary-600'
              : item.isAvailable
                ? 'border-border bg-white'
                : 'border-border bg-slate-100'
          }`}
          disabled={!item.isAvailable}
          onPress={() => onSelectDate(item.isoDate)}
        >
          <Text
            className={`text-[11px] font-semibold uppercase ${
              item.isSelected ? 'text-primary-100' : item.isAvailable ? 'text-muted' : 'text-slate-400'
            }`}
          >
            {format(item.date, 'EEE', { locale: ptBR })}
          </Text>
          <Text
            className={`mt-1 text-2xl font-bold ${
              item.isSelected ? 'text-white' : item.isAvailable ? 'text-foreground' : 'text-slate-400'
            }`}
          >
            {format(item.date, 'dd')}
          </Text>
          <Text
            className={`text-xs ${
              item.isSelected ? 'text-primary-100' : item.isAvailable ? 'text-muted' : 'text-slate-400'
            }`}
          >
            {format(item.date, 'MMM', { locale: ptBR })}
          </Text>
          {item.isAvailable && !item.isSelected ? <View className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500" /> : null}
          {item.isAvailable ? (
            <Text className={`mt-1 text-[10px] ${item.isSelected ? 'text-primary-100' : 'text-muted'}`}>
              {item.slotsCount} vaga{item.slotsCount > 1 ? 's' : ''}
            </Text>
          ) : null}
        </Pressable>
      )}
      showsHorizontalScrollIndicator={false}
    />
  );
}
