'use client';

import type { FinancialReport } from '@api/types/FinancialReport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyText } from '@/components/ds/currency-text';
import { PaymentMethodBadge } from '@/components/ds/payment-method-badge';
import { EmptyStateBlock } from '@/components/patterns/empty-state-block';
import { asNumber } from '@/hooks/owner/utils';

interface PaymentMethodBreakdownProps {
  data: FinancialReport['revenue_by_payment_method'];
  isLoading: boolean;
}

function normalizeMethod(method: unknown): 'pix' | 'credit_card' | 'debit_card' | null {
  return method === 'pix' || method === 'credit_card' || method === 'debit_card' ? method : null;
}

export function PaymentMethodBreakdown({
  data,
  isLoading,
}: PaymentMethodBreakdownProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metodos de pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const rows = (data ?? [])
    .map((item) => {
      const method = normalizeMethod(item.payment_method);

      return method
        ? {
            method,
            total: asNumber(item.total),
            count: asNumber(item.count),
          }
        : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const totalAmount = rows.reduce((acc, item) => acc + item.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Metodos de pagamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <EmptyStateBlock
            title="Sem breakdown por metodo"
            description="Nao houve pagamentos suficientes para distribuir por metodo."
          />
        ) : (
          rows.map((item) => {
            const percentage = totalAmount > 0 ? (item.total / totalAmount) * 100 : 0;

            return (
              <div
                key={item.method}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <PaymentMethodBadge method={item.method} />
                  <p className="text-xs text-muted-foreground">{item.count} transacoes</p>
                </div>

                <div className="text-right">
                  <CurrencyText value={item.total} className="font-semibold" />
                  <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
