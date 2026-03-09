import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export function formatCurrency(value: number | string | null | undefined) {
  const amount = typeof value === 'string' ? Number.parseFloat(value) : value ?? 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return format(parseISO(value), "dd MMM yyyy", { locale: ptBR });
}

export function formatTime(value: string | null | undefined) {
  if (!value) return '-';
  return value.slice(0, 5);
}

export function formatLongDate(value: string | null | undefined) {
  if (!value) return '-';
  return format(parseISO(value), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatDateTime(date: string | null | undefined, time?: string | null) {
  if (!date) return '-';
  if (time) {
    return `${formatDate(date)} - ${formatTime(time)}`;
  }
  return format(parseISO(date), "dd MMM yyyy - HH:mm", { locale: ptBR });
}

export function formatCountdown(date: string, time?: string | null) {
  const isoValue = time ? `${date}T${time}` : `${date}T12:00:00`;
  return formatDistanceToNow(parseISO(isoValue), {
    addSuffix: false,
    locale: ptBR,
  });
}

export function formatPhone(value: string | null | undefined) {
  if (!value) return '-';
  const digits = digitsOnly(value);
  if (digits.length >= 13 && digits.startsWith('55')) {
    const local = digits.slice(2);
    return local.length === 11
      ? `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
      : value;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return value;
}

export function formatCpf(value: string | null | undefined) {
  if (!value) return '-';
  const digits = digitsOnly(value);
  if (digits.length !== 11) return value;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function normalizePhoneForApi(value: string) {
  const digits = digitsOnly(value);
  if (digits.length === 11) return `+55${digits}`;
  if (digits.length === 13 && digits.startsWith('55')) return `+${digits}`;
  return value;
}

export function normalizeCpfForApi(value: string) {
  const digits = digitsOnly(value);
  if (digits.length !== 11) return value;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function getFirstName(value: string | null | undefined) {
  if (!value) return 'Paciente';
  return value.split(' ')[0] ?? 'Paciente';
}
