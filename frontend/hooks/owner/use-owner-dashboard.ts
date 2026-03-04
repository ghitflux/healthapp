'use client';

import { useMemo, useState } from 'react';
import { useGetOwnerDashboard, useGetOwnerFinancialReport } from '@api/hooks/useOwner';
import type { OwnerDashboard } from '@api/types/OwnerDashboard';
import type { OwnerFinancialReport } from '@api/types/OwnerFinancialReport';
import {
  asInteger,
  asNumber,
  asDate,
  getDateWindow,
  isDateInRange,
  sumSeries,
  toSeriesPoints,
  type OwnerPeriod,
} from './utils';

const DASHBOARD_STALE_TIME = 1000 * 60 * 5;
const FINANCIAL_STALE_TIME = 1000 * 60 * 10;

function unwrapDashboardPayload(payload: unknown): OwnerDashboard | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const envelope = payload as { data?: OwnerDashboard };
  return envelope.data ?? (payload as OwnerDashboard);
}

function unwrapFinancialPayload(payload: unknown): OwnerFinancialReport | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const envelope = payload as { data?: OwnerFinancialReport };
  return envelope.data ?? (payload as OwnerFinancialReport);
}

export function useOwnerDashboard() {
  const [period, setPeriod] = useState<OwnerPeriod>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const dashboardQuery = useGetOwnerDashboard({
    query: {
      staleTime: DASHBOARD_STALE_TIME,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  });

  const financialPreviewQuery = useGetOwnerFinancialReport({
    query: {
      staleTime: FINANCIAL_STALE_TIME,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  });

  const dashboard = useMemo(
    () => unwrapDashboardPayload(dashboardQuery.data),
    [dashboardQuery.data]
  );

  const financialPreview = useMemo(
    () => unwrapFinancialPayload(financialPreviewQuery.data),
    [financialPreviewQuery.data]
  );

  const range = useMemo(
    () => getDateWindow(period, customStart, customEnd),
    [period, customStart, customEnd]
  );

  const usersSeries = useMemo(() => {
    const points = toSeriesPoints(dashboard?.users_by_day, 'count');
    return points.filter((point) => isDateInRange(asDate(point.date), range));
  }, [dashboard?.users_by_day, range]);

  const appointmentsSeries = useMemo(() => {
    const points = toSeriesPoints(dashboard?.appointments_by_day, 'count');
    return points.filter((point) => isDateInRange(asDate(point.date), range));
  }, [dashboard?.appointments_by_day, range]);

  const revenueSeries = useMemo(() => {
    const points = toSeriesPoints(dashboard?.revenue_by_day, 'total', 'revenue');
    return points.filter((point) => isDateInRange(asDate(point.date), range));
  }, [dashboard?.revenue_by_day, range]);

  const totalUsers = useMemo(() => {
    const byRole = dashboard?.total_users ?? {};
    return (
      asInteger(byRole.patients) +
      asInteger(byRole.doctors) +
      asInteger(byRole.convenio_admins) +
      asInteger(byRole.owners)
    );
  }, [dashboard?.total_users]);

  const conveniosByStatus = useMemo(() => {
    const source = dashboard?.total_convenios ?? {};
    return [
      { label: 'Ativos', value: asInteger(source.active), color: '#22c55e' },
      { label: 'Inativos', value: asInteger(source.inactive), color: '#6b7280' },
      { label: 'Pendentes', value: asInteger(source.pending_approval), color: '#f59e0b' },
    ];
  }, [dashboard?.total_convenios]);

  const topConvenios = useMemo(() => {
    if (!Array.isArray(dashboard?.top_convenios)) return [];
    return dashboard.top_convenios.map((item) => {
      const row = item as { id?: string; name?: string; revenue?: string | number };
      return {
        id: row.id ?? 'n/a',
        name: row.name ?? 'Sem nome',
        revenue: asNumber(row.revenue),
      };
    });
  }, [dashboard?.top_convenios]);

  const kpis = useMemo(() => {
    const appointments = sumSeries(appointmentsSeries);
    const revenue = sumSeries(revenueSeries);
    return {
      totalUsers,
      activeConvenios: conveniosByStatus[0]?.value ?? 0,
      appointments,
      revenue,
      averageTicket: asNumber(dashboard?.average_ticket),
      paymentSuccessRate: asNumber(dashboard?.payment_success_rate),
      newUsers: sumSeries(usersSeries),
    };
  }, [appointmentsSeries, revenueSeries, totalUsers, conveniosByStatus, dashboard?.average_ticket, dashboard?.payment_success_rate, usersSeries]);

  const financialInsights = useMemo(() => {
    const reconciliation = (financialPreview?.reconciliation ?? {}) as {
      internal_completed?: unknown;
      stripe_completed?: unknown;
      difference?: unknown;
    };

    return {
      refundRate: asNumber(financialPreview?.refund_rate),
      totalRevenuePlatform: asNumber(financialPreview?.total_revenue_platform),
      internalCompleted: asInteger(reconciliation.internal_completed),
      stripeCompleted: asInteger(reconciliation.stripe_completed),
      difference: asInteger(reconciliation.difference),
    };
  }, [financialPreview]);

  function resetCustomRange() {
    setCustomStart('');
    setCustomEnd('');
    setPeriod('30d');
  }

  return {
    period,
    setPeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    range,
    resetCustomRange,
    dashboardQuery,
    financialPreviewQuery,
    isLoading: dashboardQuery.isLoading,
    isError: dashboardQuery.isError,
    usersSeries,
    appointmentsSeries,
    revenueSeries,
    conveniosByStatus,
    topConvenios,
    kpis,
    financialInsights,
  };
}
