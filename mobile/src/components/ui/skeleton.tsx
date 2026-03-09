import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: ViewProps) {
  return <View className={cn('animate-pulse rounded-2xl bg-slate-200', className)} {...props} />;
}
