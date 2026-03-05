'use client';

import { Input, type InputProps } from '@/components/ui/input';
import { formatDecimalInput, normalizeDecimalInput } from '@/lib/input-masks';

interface DecimalInputProps extends Omit<InputProps, 'type' | 'value' | 'onChange'> {
  value?: string | number | null;
  onValueChange: (value: string) => void;
  fractionDigits?: number;
  maxIntegerDigits?: number;
}

export function DecimalInput({
  value,
  onValueChange,
  fractionDigits = 2,
  maxIntegerDigits = 9,
  inputMode = 'decimal',
  ...props
}: DecimalInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode={inputMode}
      autoComplete="off"
      value={formatDecimalInput(value, fractionDigits)}
      onChange={(event) =>
        onValueChange(normalizeDecimalInput(event.target.value, fractionDigits, maxIntegerDigits))
      }
    />
  );
}
