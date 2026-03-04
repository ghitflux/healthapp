import { render, screen } from '@testing-library/react';
import { OwnerDashboardPageContent } from './owner-dashboard-page-content';

const useOwnerDashboardMock = jest.fn();

jest.mock('@/hooks/owner', () => ({
  useOwnerDashboard: () => useOwnerDashboardMock(),
  mergeSeriesByDate: (
    series: Record<string, Array<{ date: string; value: number }>>
  ) => {
    const byDate = new Map<string, Record<string, string | number>>();

    Object.entries(series).forEach(([key, points]) => {
      points.forEach((point) => {
        const row = byDate.get(point.date) ?? { date: point.date };
        row[key] = point.value;
        byDate.set(point.date, row);
      });
    });

    return Array.from(byDate.values());
  },
}));

function createBaseHookState() {
  return {
    period: '30d' as const,
    setPeriod: jest.fn(),
    customStart: '',
    setCustomStart: jest.fn(),
    customEnd: '',
    setCustomEnd: jest.fn(),
    resetCustomRange: jest.fn(),
    dashboardQuery: {
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    },
    financialPreviewQuery: {
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    },
    kpis: {
      totalUsers: 123,
      activeConvenios: 8,
      appointments: 77,
      revenue: 15000,
      averageTicket: 250,
      paymentSuccessRate: 96.5,
      newUsers: 18,
    },
    revenueSeries: [
      { date: '2026-03-01', value: 1000 },
      { date: '2026-03-02', value: 2000 },
    ],
    usersSeries: [
      { date: '2026-03-01', value: 10 },
      { date: '2026-03-02', value: 8 },
    ],
    appointmentsSeries: [
      { date: '2026-03-01', value: 30 },
      { date: '2026-03-02', value: 47 },
    ],
    conveniosByStatus: [
      { label: 'Ativos', value: 8, color: '#22c55e' },
      { label: 'Inativos', value: 2, color: '#6b7280' },
      { label: 'Pendentes', value: 1, color: '#f59e0b' },
    ],
    topConvenios: [{ id: '1', name: 'Convênio Alfa', revenue: 9000 }],
    financialInsights: {
      refundRate: 2.1,
      totalRevenuePlatform: 30000,
      internalCompleted: 20,
      stripeCompleted: 20,
      difference: 0,
    },
  };
}

describe('OwnerDashboardPageContent', () => {
  beforeEach(() => {
    useOwnerDashboardMock.mockReset();
  });

  it('renders KPI values when data is available', () => {
    useOwnerDashboardMock.mockReturnValue(createBaseHookState());

    render(<OwnerDashboardPageContent />);

    expect(screen.getByText('Dashboard Executivo')).toBeInTheDocument();
    expect(screen.getByText('Usuários totais')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByText('Top convênios por receita')).toBeInTheDocument();
    expect(screen.getByText('Convênio Alfa')).toBeInTheDocument();
  });

  it('shows dashboard error state when KPI query fails', () => {
    const state = createBaseHookState();
    state.dashboardQuery.isError = true;
    useOwnerDashboardMock.mockReturnValue(state);

    render(<OwnerDashboardPageContent />);

    expect(screen.getByText('Erro ao carregar indicadores')).toBeInTheDocument();
    expect(screen.getByText('Erro ao carregar gráficos')).toBeInTheDocument();
  });
});
