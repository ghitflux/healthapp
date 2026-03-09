export const SPECIALTIES = [
  'Cardiologia',
  'Neurologia',
  'Pediatria',
  'Dermatologia',
  'Ginecologia',
  'Ortopedia',
  'Oftalmologia',
  'Urologia',
] as const;

export const SEARCH_PRICE_OPTIONS = [
  { label: 'Sem limite', value: undefined },
  { label: 'Ate R$ 150', value: 150 },
  { label: 'Ate R$ 250', value: 250 },
  { label: 'Ate R$ 400', value: 400 },
] as const;

export const APPOINTMENT_STATUS_META = {
  pending: {
    label: 'Pendente',
    containerClassName: 'bg-amber-100 border-amber-200',
    textClassName: 'text-amber-800',
  },
  confirmed: {
    label: 'Confirmado',
    containerClassName: 'bg-blue-100 border-blue-200',
    textClassName: 'text-blue-800',
  },
  in_progress: {
    label: 'Em andamento',
    containerClassName: 'bg-sky-100 border-sky-200',
    textClassName: 'text-sky-800',
  },
  completed: {
    label: 'Concluido',
    containerClassName: 'bg-emerald-100 border-emerald-200',
    textClassName: 'text-emerald-800',
  },
  cancelled: {
    label: 'Cancelado',
    containerClassName: 'bg-rose-100 border-rose-200',
    textClassName: 'text-rose-800',
  },
  no_show: {
    label: 'Nao compareceu',
    containerClassName: 'bg-slate-200 border-slate-300',
    textClassName: 'text-slate-700',
  },
} as const;

export const PAYMENT_STATUS_META = {
  pending: {
    label: 'Pendente',
    containerClassName: 'bg-amber-100 border-amber-200',
    textClassName: 'text-amber-800',
  },
  processing: {
    label: 'Processando',
    containerClassName: 'bg-blue-100 border-blue-200',
    textClassName: 'text-blue-800',
  },
  completed: {
    label: 'Pago',
    containerClassName: 'bg-emerald-100 border-emerald-200',
    textClassName: 'text-emerald-800',
  },
  failed: {
    label: 'Falhou',
    containerClassName: 'bg-rose-100 border-rose-200',
    textClassName: 'text-rose-800',
  },
  refunded: {
    label: 'Reembolsado',
    containerClassName: 'bg-slate-200 border-slate-300',
    textClassName: 'text-slate-700',
  },
} as const;

export const PAYMENT_METHOD_LABELS = {
  pix: 'PIX',
  credit_card: 'Cartao',
  debit_card: 'Debito',
} as const;

export const PLACEHOLDER_STRIPE_KEY = 'pk_test_placeholder';
export const MOCK_PIX_ENABLED = process.env.EXPO_PUBLIC_ENABLE_PIX_MOCKS !== 'false';
