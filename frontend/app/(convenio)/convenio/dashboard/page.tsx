'use client';

import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { Button } from '@/components/ui/button';
import { ConvenioDashboardKPIs } from '@/features/convenios/dashboard-kpis';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { AppointmentsStatusChart } from '@/components/charts/appointments-status-chart';
import { TopDoctorsTable } from '@/features/convenios/top-doctors-table';
import { RecentAppointments } from '@/features/convenios/recent-appointments';
import { QuickActionsCard } from '@/features/convenios/quick-actions-card';
import { DashboardTemplate } from '@/components/templates/dashboard-template';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, RefreshIcon } from '@/lib/icons';
import { useConvenioDashboard } from '@/hooks/convenio/use-convenio-dashboard';

export default function ConvenioDashboardPage() {
  const { dashboard, isLoading, isError, refetch } = useConvenioDashboard();

  if (isError) {
    return (
      <ErrorStateBlock
        title="Erro ao carregar dashboard"
        message="Não foi possível carregar os indicadores do convênio."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <DashboardTemplate
      title="Dashboard"
      description="Visão geral da sua clínica e dos atendimentos liberados após pagamento."
      headerActions={(
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          <RefreshIcon className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      )}
      kpis={<ConvenioDashboardKPIs dashboard={dashboard} isLoading={isLoading} />}
      charts={
        <>
          <RevenueChart data={dashboard?.revenue_by_day} isLoading={isLoading} />
          <AppointmentsStatusChart
            data={dashboard?.appointments_by_status}
            isLoading={isLoading}
          />
        </>
      }
      tables={
        <>
          <TopDoctorsTable doctors={dashboard?.top_doctors} isLoading={isLoading} />
          <div className="space-y-6">
            <QuickActionsCard />
            <RecentAppointments />
          </div>
        </>
      }
      extra={
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Recebimento após confirmação de pagamento</AlertTitle>
          <AlertDescription>
            Todo médico permanece vinculado a esta clínica e os agendamentos entram na fila operacional após confirmação do pagamento no app. Indicadores podem exibir itens aguardando PIX até o webhook concluir.
          </AlertDescription>
        </Alert>
      }
    />
  );
}
