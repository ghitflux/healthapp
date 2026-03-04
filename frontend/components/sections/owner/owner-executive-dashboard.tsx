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
  total_users?: {
    patients: number;
    doctors: number;
    convenio_admins: number;
    owners: number;
  };
  total_convenios?: {
    active: number;
    inactive: number;
    pending_approval: number;
  };
  total_appointments?: {
    current_month: number;
    previous_month: number;
    growth: number;
  };
  total_revenue?: {
    current_month: number;
    previous_month: number;
    growth: number;
  };
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

  const totalUsers =
    (data?.total_users?.patients ?? 0) +
    (data?.total_users?.doctors ?? 0) +
    (data?.total_users?.convenio_admins ?? 0) +
    (data?.total_users?.owners ?? 0);

  const kpis = [
    {
      title: 'Total de Usuários',
      value: totalUsers.toLocaleString('pt-BR'),
      icon: UsersIcon,
      iconColor: 'text-primary-600',
      description: 'Usuários cadastrados na plataforma',
    },
    {
      title: 'Convênios Ativos',
      value: data?.total_convenios?.active ?? 0,
      icon: Building2Icon,
      iconColor: 'text-success-600',
      description: 'Convênios com assinatura ativa',
    },
    {
      title: 'Agendamentos (Mês)',
      value: (data?.total_appointments?.current_month ?? 0).toLocaleString('pt-BR'),
      icon: CalendarCheckIcon,
      iconColor: 'text-warning-600',
      description: 'Agendamentos no mês atual',
    },
    {
      title: 'Receita (Mês)',
      value: formatCurrency(data?.total_revenue?.current_month ?? 0),
      icon: DollarSignIcon,
      iconColor: 'text-success-600',
      description: 'Receita do mês atual',
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
