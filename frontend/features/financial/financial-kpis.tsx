'use client';

import type { FinancialReport } from '@api/types/FinancialReport';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiCard } from '@/components/patterns/kpi-card';
import {
  CreditCardIcon,
  DollarSignIcon,
  ReceiptIcon,
  TrendingUpIcon,
  WalletIcon,
} from '@/lib/icons';
import { asNumber } from '@/hooks/owner/utils';
import { formatCurrency } from '@/lib/formatters';

interface FinancialKpisProps {
  report: FinancialReport | undefined;
  isLoading: boolean;
}

export function FinancialKpis({ report, isLoading }: FinancialKpisProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <KpiCard
        title="Receita Bruta"
        value={formatCurrency(asNumber(report?.total_revenue))}
        icon={WalletIcon}
        iconColor="text-success-600"
      />
      <KpiCard
        title="Reembolsos"
        value={formatCurrency(asNumber(report?.total_refunds))}
        icon={ReceiptIcon}
        iconColor={asNumber(report?.total_refunds) > 0 ? 'text-danger-600' : 'text-muted-foreground'}
      />
      <KpiCard
        title="Receita Liquida"
        value={formatCurrency(asNumber(report?.net_revenue))}
        icon={DollarSignIcon}
        iconColor="text-primary-600"
      />
      <KpiCard
        title="Transações"
        value={report?.transaction_count ?? 0}
        icon={CreditCardIcon}
        iconColor="text-warning-600"
      />
      <KpiCard
        title="Ticket Médio"
        value={formatCurrency(asNumber(report?.average_ticket))}
        icon={TrendingUpIcon}
        iconColor="text-primary-600"
      />
    </div>
  );
}
