import type { Payment } from '@api/types/Payment';
import { useGetPaymentStatus } from '@api/hooks/usePayments';
import { unwrapEnvelope } from '@/lib/api-envelope';
import { useBookingStore } from '@/stores/booking-store';

export function usePaymentPolling(paymentId: string | null) {
  const mockPixPayment = useBookingStore((state) => state.mockPixPayment);
  const isMockPayment = Boolean(paymentId && mockPixPayment?.id === paymentId);
  const query = useGetPaymentStatus(paymentId ?? '', {
    query: {
      enabled: Boolean(paymentId) && !isMockPayment,
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

  const payment = isMockPayment ? mockPixPayment : unwrapEnvelope<Payment>(query.data);

  return {
    ...query,
    payment,
    isMockPayment,
    isLoading: isMockPayment ? false : query.isLoading,
    isFetching: isMockPayment ? false : query.isFetching,
    isError: isMockPayment ? false : query.isError,
  };
}
