import { Pressable, Text } from 'react-native';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        'mr-2 rounded-full border px-4 py-2.5',
        active ? 'border-primary-600 bg-primary-600' : 'border-border bg-white'
      )}
      onPress={onPress}
    >
      <Text className={cn('text-sm font-medium', active ? 'text-white' : 'text-foreground')}>{label}</Text>
    </Pressable>
  );
}
