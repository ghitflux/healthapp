'use client';

/**
 * @file components/sections/owner/owner-executive-dashboard.tsx
 * @description Organismo — Dashboard executivo do Owner com KPIs globais.
 */

import { useQuery } from '@tanstack/react-query';
import {
  UsersIcon,
  Building2Icon,
  CalendarCheckIcon,
  DollarSignIcon,
  TrendingUpIcon,
  CheckCircleIcon,
} from '@/lib/icons';
import { KpiCard, KpiCardSkeleton, KpiGrid } from '@/components/patterns/kpi-card';
import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';

interface OwnerDashboardData {
  total_users?: number;
  active_convenios?: number;
  total_appointments?: number;
  total_revenue?: number;
  average_ticket?: number;
  payment_success_rate?: number;
}

export function OwnerDashboardKPIs() {
  const { data, isLoading, isError, refetch } = useQuery<OwnerDashboardData>({
    queryKey: ['owner-dashboard'],
    queryFn: async () => {
      const response = await api.get('/v1/admin-panel/dashboard/');
      return response.data.data ?? response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isError) {
    return (
      <ErrorStateBlock
        title="Erro ao carregar KPIs"
        message="Não foi possível buscar os dados do dashboard executivo."
        onRetry={() => void refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <KpiGrid columns={3}>
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </KpiGrid>
    );
  }

  const kpis = [
    {
      title: 'Total de Usuários',
      value: (data?.total_users ?? 0).toLocaleString('pt-BR'),
      icon: UsersIcon,
      iconColor: 'text-primary-600',
      description: 'Usuários cadastrados na plataforma',
    },
    {
      title: 'Convênios Ativos',
      value: data?.active_convenios ?? 0,
      icon: Building2Icon,
      iconColor: 'text-success-600',
      description: 'Convênios com assinatura ativa',
    },
    {
      title: 'Agendamentos Total',
      value: (data?.total_appointments ?? 0).toLocaleString('pt-BR'),
      icon: CalendarCheckIcon,
      iconColor: 'text-warning-600',
      description: 'Total de agendamentos realizados',
    },
    {
      title: 'Receita Total',
      value: formatCurrency(data?.total_revenue ?? 0),
      icon: DollarSignIcon,
      iconColor: 'text-success-600',
      description: 'Receita acumulada da plataforma',
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(data?.average_ticket ?? 0),
      icon: TrendingUpIcon,
      iconColor: 'text-primary-600',
      description: 'Valor médio por agendamento',
    },
    {
      title: 'Taxa de Sucesso',
      value: `${(data?.payment_success_rate ?? 0).toFixed(1)}%`,
      icon: CheckCircleIcon,
      iconColor: 'text-success-600',
      description: 'Pagamentos processados com sucesso',
    },
  ];

  return (
    <KpiGrid columns={3}>
      {kpis.map((kpi) => (
        <KpiCard key={kpi.title} {...kpi} />
      ))}
    </KpiGrid>
  );
}
