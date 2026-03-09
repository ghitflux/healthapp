import { Pressable, Text } from 'react-native';
import { cn } from '@/lib/utils';

interface SpecialtyChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function SpecialtyChip({ label, active = false, onPress }: SpecialtyChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'mr-2 rounded-full border px-4 py-2.5',
        active ? 'border-primary-600 bg-primary-600' : 'border-border bg-white'
      )}
    >
      <Text className={cn('text-sm font-medium', active ? 'text-white' : 'text-foreground')}>{label}</Text>
    </Pressable>
  );
}
