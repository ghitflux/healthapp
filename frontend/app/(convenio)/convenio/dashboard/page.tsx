'use client';

import { ConvenioDashboardKPIs } from '@/features/convenios/dashboard-kpis';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { AppointmentsStatusChart } from '@/components/charts/appointments-status-chart';
import { TopDoctorsTable } from '@/features/convenios/top-doctors-table';
import { RecentAppointments } from '@/features/convenios/recent-appointments';

export default function ConvenioDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu convênio</p>
      </div>

      <ConvenioDashboardKPIs />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart endpoint="/v1/convenios/dashboard/" />
        <AppointmentsStatusChart endpoint="/v1/convenios/dashboard/" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopDoctorsTable />
        <RecentAppointments />
      </div>
    </div>
  );
}
