import type { Payment } from '@api/types/Payment';

export interface DoctorReviewMock {
  id: string;
  patient_name: string;
  score: number;
  comment: string;
  created_at: string;
  is_anonymous: boolean;
}

const REVIEW_TEMPLATES = [
  { score: 5, comment: 'Atendimento objetivo, consulta tranquila e explicacoes claras.' },
  { score: 5, comment: 'Pontual, atencioso e com orientacoes faceis de seguir.' },
  { score: 4, comment: 'Boa experiencia no consultorio e retorno rapido das duvidas.' },
] as const;

function buildMockId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMoney(value: string | null | undefined) {
  const parsed = Number.parseFloat(value ?? '0');
  return Number.isFinite(parsed) && parsed > 0 ? parsed.toFixed(2) : '150.00';
}

function toPixAmountFragment(amount: string) {
  return normalizeMoney(amount).replace('.', '');
}

function tlv(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

export function buildDoctorReviewSamples(doctorName: string, totalRatings: number) {
  const baseDate = new Date();
  const fallbackNames = ['Paciente A.', 'Paciente B.', 'Paciente C.'];

  return REVIEW_TEMPLATES.map((template, index) => ({
    id: `${doctorName}-${index + 1}`,
    patient_name: fallbackNames[index] ?? 'Paciente',
    score: Math.max(4, Math.min(5, template.score + (totalRatings > 20 ? 0 : -1))),
    comment: template.comment,
    created_at: new Date(baseDate.getTime() - index * 86400000 * 7).toISOString(),
    is_anonymous: index === 1,
  }));
}

export function createMockPixPayment(input: {
  amount?: string | null;
  appointmentId: string;
  doctorId?: string | null;
  doctorName?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
}) {
  const now = new Date();
  const expiration = new Date(now.getTime() + 30 * 60 * 1000);
  const amount = normalizeMoney(input.amount);
  const paymentId = buildMockId('mock_pix');
  const merchantAccountInfo = tlv('00', 'br.gov.bcb.pix') + tlv('25', `abasesaude.mock/p/${paymentId}`);
  const additionalData = tlv('05', input.appointmentId.slice(0, 10));
  const pixCode =
    tlv('00', '01') +
    tlv('01', '12') +
    tlv('26', merchantAccountInfo) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('54', toPixAmountFragment(amount)) +
    tlv('58', 'BR') +
    tlv('59', 'ABASE SAUDE') +
    tlv('60', 'SAOPAULO') +
    tlv('62', additionalData) +
    '6304ABCD';

  const payment: Payment = {
    id: paymentId,
    user: 'mock-user',
    amount,
    currency: 'BRL',
    payment_method: 'pix',
    status: 'pending',
    stripe_payment_intent_id: `mock_pi_${paymentId}`,
    pix_code: pixCode,
    pix_qr_code: paymentId,
    pix_expiration: expiration.toISOString(),
    paid_at: null,
    refunded_at: null,
    refund_amount: null,
    metadata: {
      mock: true,
      appointment_id: input.appointmentId,
      doctor_id: input.doctorId,
      doctor_name: input.doctorName,
      scheduled_date: input.scheduledDate,
      scheduled_time: input.scheduledTime,
    },
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  return payment;
}

export function updateMockPaymentStatus(payment: Payment, status: Payment['status']) {
  const now = new Date().toISOString();

  return {
    ...payment,
    status,
    paid_at: status === 'completed' ? now : payment.paid_at,
    updated_at: now,
  };
}
