import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';
import { cn } from '@/lib/utils';

const variantClasses = {
  primary: 'bg-primary-600 border-primary-600',
  outline: 'bg-white border border-border',
  ghost: 'bg-transparent border-transparent',
  danger: 'bg-danger border-danger',
} as const;

const textVariantClasses = {
  primary: 'text-white',
  outline: 'text-foreground',
  ghost: 'text-primary-700',
  danger: 'text-white',
} as const;

const sizeClasses = {
  sm: 'min-h-[44px] px-4 py-2',
  md: 'min-h-[48px] px-5 py-3',
  lg: 'min-h-[54px] px-6 py-3.5',
} as const;

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  fullWidth?: boolean;
  isLoading?: boolean;
  label?: string;
  leftIcon?: React.ReactNode;
  children?: ReactNode;
  textClassName?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  isLoading = false,
  label,
  leftIcon,
  className,
  disabled,
  children,
  textClassName,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-2xl',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth ? 'w-full' : 'self-start',
        isDisabled && 'opacity-60',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#2563EB' : '#FFFFFF'} />
      ) : (
        leftIcon
      )}
      <Text className={cn('text-center text-[15px] font-semibold', textVariantClasses[variant], textClassName)}>
        {label ?? children}
      </Text>
    </Pressable>
  );
}
