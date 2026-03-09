import { Pressable, Text, View } from 'react-native';
import type { AvailableSlot } from '@api/types/AvailableSlot';
import { Skeleton } from '@/components/ui/skeleton';
import { ClockIcon } from '@/lib/icons';

interface SlotGridProps {
  slots: AvailableSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  isLoading?: boolean;
}

export function SlotGrid({ slots, selectedTime, onSelectTime, isLoading = false }: SlotGridProps) {
  const availableSlots = slots.filter((slot) => slot.is_available);

  if (isLoading) {
    return (
      <View className="flex-row flex-wrap justify-between gap-y-3 px-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={`slot-skeleton-${index}`} className="h-16 w-[23%]" />
        ))}
      </View>
    );
  }

  if (!availableSlots.length) {
    return (
      <View className="items-center gap-2 px-5 py-10">
        <ClockIcon color="#94A3B8" size={28} />
        <Text className="text-center text-sm text-muted">
          Nenhum horario livre nesta data. Escolha outro dia para continuar.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap justify-between gap-y-3 px-5">
      {availableSlots.map((slot) => {
        const isSelected = selectedTime === slot.time;

        return (
          <Pressable
            key={slot.time}
            accessibilityRole="button"
            className={`h-16 w-[23%] items-center justify-center rounded-2xl border ${
              isSelected ? 'border-primary-600 bg-primary-600' : 'border-border bg-white'
            }`}
            onPress={() => onSelectTime(slot.time)}
          >
            <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-foreground'}`}>
              {slot.time.slice(0, 5)}
            </Text>
            <Text className={`text-[11px] ${isSelected ? 'text-primary-100' : 'text-muted'}`}>
              {slot.duration_minutes} min
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
