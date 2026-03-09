import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { cn } from '@/lib/utils';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  helperText,
  icon,
  rightAccessory,
  className,
  containerClassName,
  ...props
}: InputProps) {
  return (
    <View className={cn('gap-2', containerClassName)}>
      {label ? <Text className="text-sm font-medium text-foreground">{label}</Text> : null}
      <View
        className={cn(
          'min-h-[52px] flex-row items-center gap-3 rounded-2xl border bg-white px-4',
          error ? 'border-danger' : 'border-border'
        )}
      >
        {icon}
        <TextInput
          className={cn('flex-1 py-3 text-base text-foreground', className)}
          placeholderTextColor="#94A3B8"
          {...props}
        />
        {rightAccessory}
      </View>
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
      {!error && helperText ? <Text className="text-sm text-muted">{helperText}</Text> : null}
    </View>
  );
}
