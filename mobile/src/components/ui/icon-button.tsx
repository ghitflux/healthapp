import { Pressable, type PressableProps } from 'react-native';
import { cn } from '@/lib/utils';

export function IconButton({ className, children, ...props }: PressableProps) {
  return (
    <Pressable
      className={cn(
        'h-11 w-11 items-center justify-center rounded-full border border-border bg-white',
        className
      )}
      {...props}
    >
      {children}
    </Pressable>
  );
}
