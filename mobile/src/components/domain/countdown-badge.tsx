import { Text, View } from 'react-native';
import { ClockIcon } from '@/lib/icons';
import { formatCountdown } from '@/lib/formatters';

interface CountdownBadgeProps {
  date: string;
  time?: string | null;
}

export function CountdownBadge({ date, time }: CountdownBadgeProps) {
  return (
    <View className="self-start flex-row items-center gap-2 rounded-full bg-primary-50 px-3 py-2">
      <ClockIcon size={14} color="#2563EB" />
      <Text className="text-xs font-semibold text-primary-700">Em {formatCountdown(date, time)}</Text>
    </View>
  );
}
