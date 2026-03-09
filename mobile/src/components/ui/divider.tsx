import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export function Divider({ className, ...props }: ViewProps) {
  return <View className={cn('h-px bg-border', className)} {...props} />;
}
