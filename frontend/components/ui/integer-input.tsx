'use client';

import { Input, type InputProps } from '@/components/ui/input';
import { normalizeIntegerInput } from '@/lib/input-masks';

interface IntegerInputProps extends Omit<InputProps, 'type' | 'value' | 'onChange'> {
  value?: number | string | null;
  onValueChange: (value: number | undefined) => void;
  maxDigits?: number;
}

export function IntegerInput({
  value,
  onValueChange,
  maxDigits = 9,
  inputMode = 'numeric',
  ...props
}: IntegerInputProps) {
  const displayValue =
    typeof value === 'number' ? String(value) : value === null || value === undefined ? '' : value;

  return (
    <Input
      {...props}
      type="text"
      inputMode={inputMode}
      autoComplete="off"
      value={displayValue}
      onChange={(event) => {
        const normalized = normalizeIntegerInput(event.target.value, maxDigits);
        onValueChange(normalized ? Number(normalized) : undefined);
      }}
    />
  );
}
