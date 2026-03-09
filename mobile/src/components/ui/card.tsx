import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn('rounded-[24px] border border-border bg-card p-4 shadow-sm shadow-black/5', className)}
      {...props}
    />
  );
}
