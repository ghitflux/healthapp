import { Text, type TextProps } from 'react-native';
import { formatCurrency } from '@/lib/formatters';

interface CurrencyTextProps extends TextProps {
  value: number | string | null | undefined;
}

export function CurrencyText({ value, ...props }: CurrencyTextProps) {
  return <Text {...props}>{formatCurrency(value)}</Text>;
}
