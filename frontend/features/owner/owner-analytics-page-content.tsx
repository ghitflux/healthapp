'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardTemplate } from '@/components/templates/dashboard-template';
import { EmptyStateBlock } from '@/components/patterns/empty-state-block';
import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { mergeSeriesByDate, useOwnerDashboard } from '@/hooks/owner';
import { formatCurrency } from '@/lib/formatters';

function formatAxisDate(dateValue: string) {
  return dateValue.slice(5);
}

export function OwnerAnalyticsPageContent() {
  const dashboard = useOwnerDashboard();

  const chartData = useMemo(
    () =>
      mergeSeriesByDate({
        users: dashboard.usersSeries,
        appointments: dashboard.appointmentsSeries,
        revenue: dashboard.revenueSeries,
    }),
    [dashboard.appointmentsSeries, dashboard.revenueSeries, dashboard.usersSeries]
  );

  if (dashboard.dashboardQuery.isError) {
    return (
      <ErrorStateBlock
        title="Erro ao carregar analytics"
        message="Não foi possível carregar as análises globais da plataforma."
        onRetry={() => void dashboard.dashboardQuery.refetch()}
      />
    );
  }

  return (
    <DashboardTemplate
      title="Analytics"
      description="Tendências de crescimento e comportamento operacional da plataforma."
      headerActions={
        <div className="flex items-center gap-1 rounded-md border bg-card p-1 shadow-xs">
          <Button
            type="button"
            size="sm"
            variant={dashboard.period === '7d' ? 'default' : 'ghost'}
            className="h-7 px-2 text-xs"
            onClick={() => dashboard.setPeriod('7d')}
          >
            7 dias
          </Button>
          <Button
            type="button"
            size="sm"
            variant={dashboard.period === '30d' ? 'default' : 'ghost'}
            className="h-7 px-2 text-xs"
            onClick={() => dashboard.setPeriod('30d')}
          >
            30 dias
          </Button>
          <Button
            type="button"
            size="sm"
            variant={dashboard.period === '90d' ? 'default' : 'ghost'}
            className="h-7 px-2 text-xs"
            onClick={() => dashboard.setPeriod('90d')}
          >
            90 dias
          </Button>
        </div>
      }
      charts={
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usuários e agendamentos por dia</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard.dashboardQuery.isLoading ? (
                <div className="h-56 w-full animate-pulse rounded bg-muted" />
              ) : chartData.length === 0 ? (
                <EmptyStateBlock
                  title="Sem dados no período"
                  description="Ajuste o filtro de período para visualizar a série histórica."
                />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatAxisDate} />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="users" stackId="1" stroke="#2563eb" fill="#93c5fd" />
                    <Area type="monotone" dataKey="appointments" stackId="1" stroke="#f59e0b" fill="#fde68a" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receita acumulada no período</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard.dashboardQuery.isLoading ? (
                <div className="h-56 w-full animate-pulse rounded bg-muted" />
              ) : chartData.length === 0 ? (
                <EmptyStateBlock
                  title="Sem dados de receita"
                  description="Não há movimentação financeira para o período selecionado."
                />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatAxisDate} />
                    <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="revenue" stroke="#16a34a" fill="#86efac" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      }
      tables={
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leituras analíticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-md border bg-card p-3 shadow-xs">
              Usuários no período: <strong>{dashboard.kpis.newUsers.toLocaleString('pt-BR')}</strong>
            </div>
            <div className="rounded-md border bg-card p-3 shadow-xs">
              Agendamentos no período: <strong>{dashboard.kpis.appointments.toLocaleString('pt-BR')}</strong>
            </div>
            <div className="rounded-md border bg-card p-3 shadow-xs">
              Receita no período: <strong>{formatCurrency(dashboard.kpis.revenue)}</strong>
            </div>
          </CardContent>
        </Card>
      }
    />
  );
}
