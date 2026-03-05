'use client';

import { PageBreadcrumb } from '@/components/patterns/page-breadcrumb';
import { DateRangeFilter } from '@/components/patterns/date-range-filter';
import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { EmptyStateBlock } from '@/components/patterns/empty-state-block';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConvenioFinancial } from '@/hooks/financial/use-convenio-financial';
import { useAuthStore } from '@/stores/auth-store';
import { CurrencyText } from '@/components/ds/currency-text';
import { FinancialKpis } from './financial-kpis';
import { RevenueByPeriodChart } from './revenue-by-period-chart';
import { PaymentMethodBreakdown } from './payment-method-breakdown';
import { FinancialExportButton } from './financial-export-button';
import { asNumber } from '@/hooks/owner/utils';

export function FinancialPageContent() {
  const convenioId = useAuthStore((state) => state.user?.convenio_id ?? '');
  const {
    report,
    isLoading,
    isError,
    refetch,
    dateFrom,
    dateTo,
    handleDateFrom,
    handleDateTo,
    handleResetDates,
  } = useConvenioFinancial();

  if (isError) {
    return (
      <ErrorStateBlock
        title="Erro ao carregar financeiro"
        message="Nao foi possivel carregar o relatorio financeiro do convenio."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe receita, reembolsos e principais servicos do convenio.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 xl:max-w-2xl">
          <DateRangeFilter
            from={dateFrom}
            to={dateTo}
            onFromChange={handleDateFrom}
            onToChange={handleDateTo}
          />
          <div className="flex justify-end gap-2">
            <FinancialExportButton
              dateFrom={dateFrom}
              dateTo={dateTo}
              convenioId={convenioId}
            />
          </div>
        </div>
      </div>

      <FinancialKpis report={report} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <RevenueByPeriodChart data={report?.revenue_by_period ?? []} isLoading={isLoading} />
        <PaymentMethodBreakdown
          data={report?.revenue_by_payment_method ?? []}
          isLoading={isLoading}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Top servicos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Servicos com maior receita no periodo filtrado.
            </p>
          </div>
          <button
            type="button"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={handleResetDates}
          >
            Resetar periodo
          </button>
        </CardHeader>
        <CardContent>
          {!isLoading && (!report?.top_services || report.top_services.length === 0) ? (
            <EmptyStateBlock
              title="Sem servicos destacados"
              description="Nao houve volume suficiente de servicos no periodo selecionado."
            />
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servico</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(report?.top_services ?? []).map((service, index) => (
                    <TableRow key={`${service.service ?? 'service'}-${index}`}>
                      <TableCell className="font-medium">
                        {typeof service.service === 'string' ? service.service : 'Servico'}
                      </TableCell>
                      <TableCell className="text-right">{asNumber(service.count)}</TableCell>
                      <TableCell className="text-right">
                        <CurrencyText value={asNumber(service.total_revenue)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
