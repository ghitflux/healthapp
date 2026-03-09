import type { Payment } from '@api/types/Payment';
import { useGetPaymentStatus } from '@api/hooks/usePayments';
import { unwrapEnvelope } from '@/lib/api-envelope';

export function usePaymentPolling(paymentId: string | null) {
  const query = useGetPaymentStatus(paymentId ?? '', {
    query: {
      enabled: Boolean(paymentId),
      refetchInterval: (currentQuery) => {
        const payment = unwrapEnvelope<Payment>(currentQuery.state.data);
        if (!payment) return 5000;
        if (payment.status === 'completed' || payment.status === 'failed' || payment.status === 'refunded') {
          return false;
        }
        return 5000;
      },
    },
  });

  return {
    ...query,
    payment: unwrapEnvelope<Payment>(query.data),
  };
}
