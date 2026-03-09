import { Text, View } from 'react-native';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, rightSlot, className }: SectionHeaderProps) {
  return (
    <View className={cn('flex-row items-center justify-between gap-4', className)}>
      <View className="flex-1 gap-1">
        <Text className="text-xl font-semibold text-foreground">{title}</Text>
        {subtitle ? <Text className="text-sm text-muted">{subtitle}</Text> : null}
      </View>
      {rightSlot}
    </View>
  );
}
