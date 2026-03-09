import { Text, View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

interface BadgeProps extends ViewProps {
  label: string;
  textClassName?: string;
}

export function Badge({ label, className, textClassName, ...props }: BadgeProps) {
  return (
    <View className={cn('self-start rounded-full border px-3 py-1.5', className)} {...props}>
      <Text className={cn('text-xs font-semibold', textClassName)}>{label}</Text>
    </View>
  );
}
