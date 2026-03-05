'use client';

import type { ConvenioDashboard } from '@api/types/ConvenioDashboard';
import { StethoscopeIcon, CalendarCheckIcon, DollarSignIcon, XCircleIcon } from '@/lib/icons';
import { KpiCard as KPICard, KpiCardSkeleton as KPICardSkeleton } from '@/components/patterns/kpi-card';
import { formatCurrency } from '@/lib/formatters';
import { asNumber } from '@/hooks/owner/utils';

interface ConvenioDashboardKPIsProps {
  dashboard?: ConvenioDashboard;
  isLoading: boolean;
}

export function ConvenioDashboardKPIs({
  dashboard,
  isLoading,
}: ConvenioDashboardKPIsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: 'Médicos Ativos',
      value: dashboard?.total_doctors ?? 0,
      icon: StethoscopeIcon,
      iconColor: 'text-primary-600',
      description: 'Total de médicos no convênio',
    },
    {
      title: 'Agendamentos (Mês)',
      value: dashboard?.total_appointments_month ?? 0,
      icon: CalendarCheckIcon,
      iconColor: 'text-success-600',
      description: 'Agendamentos no mês atual',
    },
    {
      title: 'Receita (Mês)',
      value: formatCurrency(asNumber(dashboard?.total_revenue_month)),
      icon: DollarSignIcon,
      iconColor: 'text-warning-600',
      description: 'Faturamento do mês atual',
    },
    {
      title: 'Taxa de Cancelamento',
      value: `${(dashboard?.cancellation_rate ?? 0).toFixed(1)}%`,
      icon: XCircleIcon,
      iconColor: 'text-danger-600',
      description: 'Percentual de cancelamentos',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <KPICard key={kpi.title} {...kpi} />
      ))}
    </div>
  );
}
