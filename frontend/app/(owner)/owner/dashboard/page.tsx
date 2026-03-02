'use client';

import { OwnerDashboardKPIs } from '@/features/owner/dashboard-kpis';
import { RevenueChart } from '@/components/charts/revenue-chart';

export default function OwnerDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Executivo</h1>
        <p className="text-muted-foreground">Visão global da plataforma HealthApp</p>
      </div>

      <OwnerDashboardKPIs />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart
          endpoint="/v1/admin-panel/dashboard/"
          title="Receita Global"
        />
      </div>
    </div>
  );
}
