import { formatCNPJ, formatPhone } from '@/lib/formatters';

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function normalizeIntegerInput(value: string, maxDigits = 9) {
  return onlyDigits(value).slice(0, maxDigits);
}

export function formatDecimalInput(
  value: string | number | null | undefined,
  fractionDigits = 2
) {
  if (value === null || value === undefined || value === '') return '';

  const numericValue =
    typeof value === 'number' ? value : Number.parseFloat(String(value).replace(',', '.'));

  if (!Number.isFinite(numericValue)) return '';

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(numericValue);
}

export function normalizeDecimalInput(
  value: string,
  fractionDigits = 2,
  maxIntegerDigits = 9
) {
  const digits = onlyDigits(value);
  if (!digits) return '';

  const limitedDigits = digits.slice(0, maxIntegerDigits + fractionDigits);
  const paddedDigits = limitedDigits.padStart(fractionDigits + 1, '0');
  const integerDigits = paddedDigits.slice(0, -fractionDigits) || '0';
  const decimalDigits = paddedDigits.slice(-fractionDigits);

  return `${Number.parseInt(integerDigits, 10)}.${decimalDigits}`;
}

export function maskPhoneInput(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return '';

  if (digits.length < 3) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length < 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return formatPhone(digits);
}

export function maskCnpjInput(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  if (!digits) return '';
  if (digits.length < 3) return digits;
  if (digits.length < 6) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length < 9) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length < 13) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }

  return formatCNPJ(digits);
}

export function maskZipCodeInput(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
