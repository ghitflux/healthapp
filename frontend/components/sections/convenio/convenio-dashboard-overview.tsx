'use client';

/**
 * @file components/sections/convenio/convenio-dashboard-overview.tsx
 * @description Organismo — Overview completo do dashboard do convênio.
 * Compõe KPIs + gráficos + tabelas em layout unificado.
 */

import { useQuery } from '@tanstack/react-query';
import {
  StethoscopeIcon,
  CalendarCheckIcon,
  DollarSignIcon,
  XCircleIcon,
} from '@/lib/icons';
import { KpiCard, KpiCardSkeleton, KpiGrid } from '@/components/patterns/kpi-card';
import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';

interface ConvenioDashboardData {
  total_doctors?: number;
  total_appointments_month?: number;
  total_revenue_month?: number;
  cancellation_rate?: number;
}

export function ConvenioDashboardKPIs() {
  const { data, isLoading, isError, refetch } = useQuery<ConvenioDashboardData>({
    queryKey: ['convenio-dashboard'],
    queryFn: async () => {
      const response = await api.get('/v1/convenios/dashboard/');
      return response.data.data ?? response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isError) {
    return (
      <ErrorStateBlock
        title="Erro ao carregar KPIs"
        message="Não foi possível buscar os dados do dashboard. Verifique a conexão com o servidor."
        onRetry={() => void refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <KpiGrid columns={4}>
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </KpiGrid>
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
    <KpiGrid columns={4}>
      {kpis.map((kpi) => (
        <KpiCard key={kpi.title} {...kpi} />
      ))}
    </KpiGrid>
  );
}
