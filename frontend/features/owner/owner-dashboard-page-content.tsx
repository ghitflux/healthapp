'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DashboardTemplate } from '@/components/templates/dashboard-template';
import { EmptyStateBlock } from '@/components/patterns/empty-state-block';
import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { KpiCard, KpiCardSkeleton, KpiGrid } from '@/components/patterns/kpi-card';
import {
  Building2Icon,
  CalendarCheckIcon,
  DollarSignIcon,
  RefreshIcon,
  TrendingUpIcon,
  UsersIcon,
} from '@/lib/icons';
import { formatCurrency } from '@/lib/formatters';
import { mergeSeriesByDate, useOwnerDashboard } from '@/hooks/owner';

const STATUS_COLORS = ['#22c55e', '#6b7280', '#f59e0b'];

function formatAxisDate(dateValue: string) {
  return dateValue.slice(5);
}

export function OwnerDashboardPageContent() {
  const dashboard = useOwnerDashboard();
  const growthSeries = useMemo(
    () =>
      mergeSeriesByDate({
        users: dashboard.usersSeries,
        appointments: dashboard.appointmentsSeries,
      }),
    [dashboard.appointmentsSeries, dashboard.usersSeries]
  );

  const dashboardLoading = dashboard.dashboardQuery.isLoading;
  const dashboardError = dashboard.dashboardQuery.isError;
  const financialError = dashboard.financialPreviewQuery.isError;

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-md border p-1">
        <Button
          type="button"
          size="sm"
          variant={dashboard.period === '7d' ? 'default' : 'ghost'}
          onClick={() => dashboard.setPeriod('7d')}
        >
          7 dias
        </Button>
        <Button
          type="button"
          size="sm"
          variant={dashboard.period === '30d' ? 'default' : 'ghost'}
          onClick={() => dashboard.setPeriod('30d')}
        >
          30 dias
        </Button>
        <Button
          type="button"
          size="sm"
          variant={dashboard.period === '90d' ? 'default' : 'ghost'}
          onClick={() => dashboard.setPeriod('90d')}
        >
          90 dias
        </Button>
        <Button
          type="button"
          size="sm"
          variant={dashboard.period === 'custom' ? 'default' : 'ghost'}
          onClick={() => dashboard.setPeriod('custom')}
        >
          Custom
        </Button>
      </div>

      {dashboard.period === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="h-9 rounded-md border px-2 text-sm"
            aria-label="Data inicial do filtro"
            value={dashboard.customStart}
            onChange={(event) => dashboard.setCustomStart(event.target.value)}
          />
          <input
            type="date"
            className="h-9 rounded-md border px-2 text-sm"
            aria-label="Data final do filtro"
            value={dashboard.customEnd}
            onChange={(event) => dashboard.setCustomEnd(event.target.value)}
          />
          <Button type="button" size="sm" variant="outline" onClick={dashboard.resetCustomRange}>
            Limpar
          </Button>
        </div>
      )}

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          void dashboard.dashboardQuery.refetch();
          void dashboard.financialPreviewQuery.refetch();
        }}
      >
        <RefreshIcon className="mr-2 h-4 w-4" />
        Atualizar
      </Button>
    </div>
  );

  const kpis = dashboardLoading ? (
    <KpiGrid columns={3}>
      {Array.from({ length: 6 }).map((_, index) => (
        <KpiCardSkeleton key={index} />
      ))}
    </KpiGrid>
  ) : dashboardError ? (
    <ErrorStateBlock
      title="Erro ao carregar indicadores"
      message="Não foi possível carregar os indicadores executivos do owner."
      onRetry={() => void dashboard.dashboardQuery.refetch()}
    />
  ) : (
    <KpiGrid columns={3}>
      <KpiCard
        title="Usuários totais"
        value={dashboard.kpis.totalUsers.toLocaleString('pt-BR')}
        icon={UsersIcon}
        iconColor="text-primary-600"
        description={`+${dashboard.kpis.newUsers.toLocaleString('pt-BR')} no período`}
      />
      <KpiCard
        title="Convênios ativos"
        value={dashboard.kpis.activeConvenios.toLocaleString('pt-BR')}
        icon={Building2Icon}
        iconColor="text-success-600"
        description="Operação habilitada"
      />
      <KpiCard
        title="Agendamentos no período"
        value={dashboard.kpis.appointments.toLocaleString('pt-BR')}
        icon={CalendarCheckIcon}
        iconColor="text-warning-600"
        description="Volume operacional"
      />
      <KpiCard
        title="Receita no período"
        value={formatCurrency(dashboard.kpis.revenue)}
        icon={DollarSignIcon}
        iconColor="text-success-600"
        description="Recebimentos confirmados"
      />
      <KpiCard
        title="Ticket médio"
        value={formatCurrency(dashboard.kpis.averageTicket)}
        icon={TrendingUpIcon}
        iconColor="text-primary-600"
        description="Média por pagamento aprovado"
      />
      <KpiCard
        title="Taxa de sucesso"
        value={`${dashboard.kpis.paymentSuccessRate.toFixed(1)}%`}
        icon={TrendingUpIcon}
        iconColor="text-success-600"
        description="Pagamentos aprovados"
      />
    </KpiGrid>
  );

  const charts = dashboardError ? (
    <ErrorStateBlock
      title="Erro ao carregar gráficos"
      message="Não foi possível carregar as séries analíticas do dashboard."
      onRetry={() => void dashboard.dashboardQuery.refetch()}
    />
  ) : (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receita global por dia</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardLoading ? (
            <div className="h-56 w-full animate-pulse rounded-md bg-muted" />
          ) : dashboard.revenueSeries.length === 0 ? (
            <EmptyStateBlock
              title="Sem dados de receita no período"
              description="Ajuste o filtro para visualizar séries históricas."
            />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dashboard.revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatAxisDate} />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label: string) => `Data: ${label}`}
                />
                <Area type="monotone" dataKey="value" stroke="#2563eb" fill="#93c5fd" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crescimento de usuários e agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardLoading ? (
            <div className="h-56 w-full animate-pulse rounded-md bg-muted" />
          ) : growthSeries.length === 0 ? (
            <EmptyStateBlock
              title="Sem dados de crescimento"
              description="Nenhuma movimentação encontrada para o período selecionado."
            />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={growthSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatAxisDate} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" name="Usuários" stroke="#2563eb" strokeWidth={2} />
                <Line
                  type="monotone"
                  dataKey="appointments"
                  name="Agendamentos"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição de convênios por status</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardLoading ? (
            <div className="h-56 w-full animate-pulse rounded-md bg-muted" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={dashboard.conveniosByStatus}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {dashboard.conveniosByStatus.map((entry, index) => (
                    <Cell key={entry.label} fill={STATUS_COLORS[index] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview financeiro global</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dashboard.financialPreviewQuery.isLoading ? (
            <div className="space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          ) : financialError ? (
            <ErrorStateBlock
              title="Falha no preview financeiro"
              message="Não foi possível carregar a prévia financeira global."
              onRetry={() => void dashboard.financialPreviewQuery.refetch()}
            />
          ) : (
            <>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Receita total da plataforma</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(dashboard.financialInsights.totalRevenuePlatform)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Taxa de estorno</p>
                <p className="text-lg font-semibold">{dashboard.financialInsights.refundRate.toFixed(2)}%</p>
              </div>
              <div
                className={`rounded-md border p-3 ${
                  dashboard.financialInsights.difference === 0 ? 'border-success-500/40' : 'border-warning-500/40'
                }`}
              >
                <p className="text-xs text-muted-foreground">Reconciliação (interno vs provedor)</p>
                <p className="text-sm">
                  Interno: <strong>{dashboard.financialInsights.internalCompleted}</strong> | Provedor:{' '}
                  <strong>{dashboard.financialInsights.stripeCompleted}</strong>
                </p>
                <p className="text-sm">
                  Diferença: <strong>{dashboard.financialInsights.difference}</strong>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );

  const tables = dashboardError ? (
    <ErrorStateBlock
      title="Erro ao carregar detalhamento"
      message="Não foi possível carregar o detalhamento de convênios."
      onRetry={() => void dashboard.dashboardQuery.refetch()}
    />
  ) : (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top convênios por receita</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {dashboardLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : dashboard.topConvenios.length === 0 ? (
          <EmptyStateBlock
            title="Sem convênios ranqueados"
            description="Nenhum convênio com receita no período selecionado."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Convênio</TableHead>
                <TableHead className="text-right">Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.topConvenios.map((convenio) => (
                <TableRow key={convenio.id}>
                  <TableCell>{convenio.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(convenio.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardTemplate
      title="Dashboard Executivo"
      description="Visão global de operação, crescimento e saúde financeira da plataforma."
      headerActions={headerActions}
      kpis={kpis}
      charts={charts}
      tables={tables}
    />
  );
}
