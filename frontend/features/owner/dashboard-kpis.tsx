'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Building2, CalendarCheck, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import { KPICard, KPICardSkeleton } from '@/components/data-display/kpi-card';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';

interface OwnerDashboardData {
  total_users?: number;
  total_convenios?: number;
  total_appointments?: number;
  total_revenue?: number;
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

  const kpis = [
    {
      title: 'Total de Usuários',
      value: (data?.total_users ?? 0).toLocaleString('pt-BR'),
      icon: Users,
      iconColor: 'text-primary-600',
    },
    {
      title: 'Convênios Ativos',
      value: data?.total_convenios ?? 0,
      icon: Building2,
      iconColor: 'text-success-600',
    },
    {
      title: 'Agendamentos Total',
      value: (data?.total_appointments ?? 0).toLocaleString('pt-BR'),
      icon: CalendarCheck,
      iconColor: 'text-warning-600',
    },
    {
      title: 'Receita Total',
      value: formatCurrency(data?.total_revenue ?? 0),
      icon: DollarSign,
      iconColor: 'text-primary-600',
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(data?.average_ticket ?? 0),
      icon: TrendingUp,
      iconColor: 'text-success-600',
    },
    {
      title: 'Taxa de Sucesso',
      value: `${(data?.payment_success_rate ?? 0).toFixed(1)}%`,
      icon: CheckCircle,
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
