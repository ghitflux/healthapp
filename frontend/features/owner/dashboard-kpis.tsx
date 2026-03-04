'use client';

import { useQuery } from '@tanstack/react-query';
import { UsersIcon, Building2Icon, CalendarCheckIcon, DollarSignIcon, TrendingUpIcon, CheckCircleIcon } from '@/lib/icons';
import { KpiCard as KPICard, KpiCardSkeleton as KPICardSkeleton } from '@/components/patterns/kpi-card';
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
  const { data, isLoading } = useQuery<OwnerDashboardData>({
    queryKey: ['owner-dashboard'],
    queryFn: async () => {
      const response = await api.get('/v1/admin-panel/dashboard/');
      return response.data.data ?? response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
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
    },
    {
      title: 'Convênios Ativos',
      value: data?.total_convenios?.active ?? 0,
      icon: Building2Icon,
      iconColor: 'text-success-600',
    },
    {
      title: 'Agendamentos (Mês)',
      value: (data?.total_appointments?.current_month ?? 0).toLocaleString('pt-BR'),
      icon: CalendarCheckIcon,
      iconColor: 'text-warning-600',
    },
    {
      title: 'Receita (Mês)',
      value: formatCurrency(data?.total_revenue?.current_month ?? 0),
      icon: DollarSignIcon,
      iconColor: 'text-primary-600',
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(data?.average_ticket ?? 0),
      icon: TrendingUpIcon,
      iconColor: 'text-success-600',
    },
    {
      title: 'Taxa de Sucesso',
      value: `${(data?.payment_success_rate ?? 0).toFixed(1)}%`,
      icon: CheckCircleIcon,
      iconColor: 'text-success-600',
      description: 'Pagamentos bem-sucedidos',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((kpi) => (
        <KPICard key={kpi.title} {...kpi} />
      ))}
    </div>
  );
}
