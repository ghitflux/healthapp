'use client';

import { ConvenioDashboardKPIs } from '@/features/convenios/dashboard-kpis';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { AppointmentsStatusChart } from '@/components/charts/appointments-status-chart';
import { TopDoctorsTable } from '@/features/convenios/top-doctors-table';
import { RecentAppointments } from '@/features/convenios/recent-appointments';
import { DashboardTemplate } from '@/components/templates/dashboard-template';

export default function ConvenioDashboardPage() {
  return (
    <DashboardTemplate
      title="Dashboard"
      description="Visão geral do seu convênio"
      kpis={<ConvenioDashboardKPIs />}
      charts={
        <>
          <RevenueChart endpoint="/v1/convenios/dashboard/" />
          <AppointmentsStatusChart endpoint="/v1/convenios/dashboard/" />
        </>
      }
      tables={
        <>
          <TopDoctorsTable />
          <RecentAppointments />
        </>
      }
    />
  );
}
