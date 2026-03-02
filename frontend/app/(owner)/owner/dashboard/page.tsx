'use client';

import { OwnerDashboardKPIs } from '@/features/owner/dashboard-kpis';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { DashboardTemplate } from '@/components/templates/dashboard-template';

export default function OwnerDashboardPage() {
  return (
    <DashboardTemplate
      title="Dashboard Executivo"
      description="Visão global da plataforma HealthApp"
      kpis={<OwnerDashboardKPIs />}
      charts={
        <RevenueChart
          endpoint="/v1/admin-panel/dashboard/"
          title="Receita Global"
        />
      }
    />
  );
}
