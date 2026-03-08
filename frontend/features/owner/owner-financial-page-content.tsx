'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useGetOwnerDashboard, useGetOwnerFinancialReport } from '@api/hooks/useOwner';
import type { OwnerDashboard } from '@api/types/OwnerDashboard';
import type { OwnerFinancialReport } from '@api/types/OwnerFinancialReport';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DashboardTemplate } from '@/components/templates/dashboard-template';
import { EmptyStateBlock } from '@/components/patterns/empty-state-block';
import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { KpiCard, KpiCardSkeleton, KpiGrid } from '@/components/patterns/kpi-card';
import { exportRowsToCsv, printRowsAsPdf } from '@/lib/export-utils';
import { formatCurrency } from '@/lib/formatters';
import { DownloadIcon, DollarSignIcon, RefreshIcon, TrendingUpIcon, WalletIcon } from '@/lib/icons';
import { queryClient } from '@/lib/query-client';
import { asNumber, asInteger } from '@/hooks/owner/utils';

const METHOD_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];

interface RevenueByConvenioRow {
  convenio_name: string;
  total: number;
}

interface PaymentMethodRow {
  payment_method: string;
  count: number;
  total: number;
  percentage: number;
}

function unwrapFinancial(payload: unknown): OwnerFinancialReport | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const envelope = payload as { data?: OwnerFinancialReport };
  return envelope.data ?? (payload as OwnerFinancialReport);
}

function unwrapDashboard(payload: unknown): OwnerDashboard | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const envelope = payload as { data?: OwnerDashboard };
  return envelope.data ?? (payload as OwnerDashboard);
}

export function OwnerFinancialPageContent() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const financialQuery = useGetOwnerFinancialReport({
    query: {
      client: queryClient,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  });

  const dashboardQuery = useGetOwnerDashboard({
    query: {
      client: queryClient,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  });

  const financial = useMemo(() => unwrapFinancial(financialQuery.data), [financialQuery.data]);
  const dashboard = useMemo(() => unwrapDashboard(dashboardQuery.data), [dashboardQuery.data]);

  const revenueByConvenio = useMemo<RevenueByConvenioRow[]>(() => {
    if (!Array.isArray(financial?.revenue_by_convenio)) return [];

    return financial.revenue_by_convenio.map((item) => {
      const row = item as { convenio_name?: string; total?: string | number };
      return {
        convenio_name: row.convenio_name ?? 'Sem nome',
        total: asNumber(row.total),
      };
    });
  }, [financial?.revenue_by_convenio]);

  const paymentMethods = useMemo<PaymentMethodRow[]>(() => {
    if (!Array.isArray(financial?.payment_method_breakdown)) return [];

    return financial.payment_method_breakdown.map((item) => {
      const row = item as {
        payment_method?: string;
        count?: string | number;
        total?: string | number;
        percentage?: string | number;
      };
      return {
        payment_method: row.payment_method ?? 'unknown',
        count: asInteger(row.count),
        total: asNumber(row.total),
        percentage: asNumber(row.percentage),
      };
    });
  }, [financial?.payment_method_breakdown]);

  const reconciliation = useMemo(() => {
    const source = (financial?.reconciliation ?? {}) as {
      internal_completed?: unknown;
      stripe_completed?: unknown;
      difference?: unknown;
    };

    return {
      internalCompleted: asInteger(source.internal_completed),
      stripeCompleted: asInteger(source.stripe_completed),
      difference: asInteger(source.difference),
    };
  }, [financial?.reconciliation]);

  const isLoading = financialQuery.isLoading || dashboardQuery.isLoading;
  const isError = financialQuery.isError;

  const exportColumns = [
    { key: 'convênio', label: 'Convênio' },
    { key: 'revenue', label: 'Receita total' },
  ];

  const exportRows = revenueByConvenio.map((item) => ({
    convenio: item.convenio_name,
    revenue: formatCurrency(item.total),
  }));

  const kpis = isLoading ? (
    <KpiGrid columns={4}>
      {Array.from({ length: 4 }).map((_, index) => (
        <KpiCardSkeleton key={index} />
      ))}
    </KpiGrid>
  ) : isError ? (
    <ErrorStateBlock
      title="Erro ao carregar KPIs financeiros"
      message="Não foi possível carregar os indicadores financeiros globais."
      onRetry={() => void financialQuery.refetch()}
    />
  ) : (
    <KpiGrid columns={4}>
      <KpiCard
        title="Receita total"
        value={formatCurrency(asNumber(financial?.total_revenue_platform))}
        icon={WalletIcon}
        iconColor="text-success-600"
      />
      <KpiCard
        title="Ticket médio"
        value={formatCurrency(asNumber(dashboard?.average_ticket))}
        icon={DollarSignIcon}
        iconColor="text-primary-600"
      />
      <KpiCard
        title="Taxa de sucesso"
        value={`${asNumber(dashboard?.payment_success_rate).toFixed(1)}%`}
        icon={TrendingUpIcon}
        iconColor="text-success-600"
      />
      <KpiCard
        title="Taxa de estorno"
        value={`${asNumber(financial?.refund_rate).toFixed(2)}%`}
        icon={TrendingUpIcon}
        iconColor="text-warning-600"
      />
    </KpiGrid>
  );

  const charts = isError ? (
    <ErrorStateBlock
      title="Erro ao carregar análises financeiras"
      message="Não foi possível carregar os gráficos de receita e método de pagamento."
      onRetry={() => void financialQuery.refetch()}
    />
  ) : (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top convênios por receita</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueByConvenio.length === 0 ? (
            <EmptyStateBlock
              title="Sem dados de receita por convênio"
              description="O relatório atual não retornou distribuição por convênio."
            />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueByConvenio.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="convenio_name" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={70} />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição por método de pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <EmptyStateBlock
              title="Sem dados por método"
              description="O relatório atual não retornou breakdown de métodos de pagamento."
            />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  dataKey="count"
                  nameKey="payment_method"
                  innerRadius={56}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={entry.payment_method} fill={METHOD_COLORS[index % METHOD_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} pagamentos`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </>
  );

  const tables = (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Reconciliação</CardTitle>
          <Badge variant={reconciliation.difference === 0 ? 'default' : 'secondary'}>
            {reconciliation.difference === 0 ? 'Sem divergência' : 'Com divergência'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!financial?.reconciliation ? (
            <div className="rounded-md border border-warning-500/40 bg-warning-50 p-3 text-warning-700">
              Campo de reconciliação não retornado no payload atual.
            </div>
          ) : (
            <>
              <div className="rounded-md border bg-card p-3 shadow-xs">
                Interno concluído: <strong>{reconciliation.internalCompleted}</strong>
              </div>
              <div className="rounded-md border bg-card p-3 shadow-xs">
                Provedor concluído: <strong>{reconciliation.stripeCompleted}</strong>
              </div>
              <div className="rounded-md border bg-card p-3 shadow-xs">
                Diferença: <strong>{reconciliation.difference}</strong>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Breakdown por método/status</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {paymentMethods.length === 0 ? (
            <EmptyStateBlock
              title="Sem dados de breakdown"
              description="Nenhuma informação de método/status para exibir."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Percentual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentMethods.map((method) => (
                  <TableRow key={method.payment_method}>
                    <TableCell>{method.payment_method}</TableCell>
                    <TableCell className="text-right">{method.count}</TableCell>
                    <TableCell className="text-right">{formatCurrency(method.total)}</TableCell>
                    <TableCell className="text-right">{method.percentage.toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );

  return (
    <DashboardTemplate
      title="Financeiro Global"
      description="Controle financeiro global, reconciliação e distribuição de receitas."
      headerActions={
        <div className="flex flex-wrap items-center gap-2">
          <DatePicker
            className="w-[160px]"
            value={startDate}
            onChange={(value) => setStartDate(value ?? '')}
            aria-label="Data inicial"
          />
          <DatePicker
            className="w-[160px]"
            value={endDate}
            min={startDate || undefined}
            onChange={(value) => setEndDate(value ?? '')}
            aria-label="Data final"
          />
          <Badge variant="secondary">Filtro de período depende de endpoint dedicado</Badge>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => exportRowsToCsv('owner_financial', exportColumns, exportRows)}
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              printRowsAsPdf(
                'owner_financial',
                'Relatório Financeiro Global',
                'Exportação filtrada da visualização atual.',
                exportColumns,
                exportRows
              )
            }
          >
            PDF
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              void financialQuery.refetch();
              void dashboardQuery.refetch();
            }}
          >
            <RefreshIcon className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      }
      kpis={kpis}
      charts={charts}
      tables={tables}
    />
  );
}
