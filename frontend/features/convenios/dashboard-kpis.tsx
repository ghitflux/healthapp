'use client';

import { useQuery } from '@tanstack/react-query';
import { StethoscopeIcon, CalendarCheckIcon, DollarSignIcon, XCircleIcon } from '@/lib/icons';
import { KpiCard as KPICard, KpiCardSkeleton as KPICardSkeleton } from '@/components/patterns/kpi-card';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';

interface ConvenioDashboardData {
  total_doctors?: number;
  total_appointments_month?: number;
  total_revenue_month?: number;
  cancellation_rate?: number;
}

export function ConvenioDashboardKPIs() {
  const { data, isLoading } = useQuery<ConvenioDashboardData>({
    queryKey: ['convenio-dashboard'],
    queryFn: async () => {
      const response = await api.get('/v1/convenios/dashboard/');
      return response.data.data ?? response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

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
      value: data?.total_doctors ?? 0,
      icon: StethoscopeIcon,
      iconColor: 'text-primary-600',
      description: 'Total de médicos no convênio',
    },
    {
      title: 'Agendamentos (Mês)',
      value: data?.total_appointments_month ?? 0,
      icon: CalendarCheckIcon,
      iconColor: 'text-success-600',
      description: 'Agendamentos no mês atual',
    },
    {
      title: 'Receita (Mês)',
      value: formatCurrency(data?.total_revenue_month ?? 0),
      icon: DollarSignIcon,
      iconColor: 'text-warning-600',
      description: 'Faturamento do mês atual',
    },
    {
      title: 'Taxa de Cancelamento',
      value: `${(data?.cancellation_rate ?? 0).toFixed(1)}%`,
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
