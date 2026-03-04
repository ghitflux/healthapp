import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OwnerAuditLogsPageContent } from './owner-audit-logs-page-content';

const useOwnerAuditLogsListMock = jest.fn();
const exportRowsToCsvMock = jest.fn();

jest.mock('@/hooks/owner', () => ({
  useOwnerAuditLogsList: () => useOwnerAuditLogsListMock(),
}));

jest.mock('@/lib/export-utils', () => ({
  exportRowsToCsv: (...args: unknown[]) => exportRowsToCsvMock(...args),
  printRowsAsPdf: jest.fn(),
}));

function createListState() {
  return {
    page: 1,
    setPage: jest.fn(),
    pageSize: 20,
    search: '',
    action: '',
    modelName: '',
    user: '',
    dateFrom: '',
    dateTo: '',
    ordering: '-timestamp',
    logs: [
      {
        id: 1,
        model_name: 'convenio',
        object_pk: '1',
        object_repr: 'Convênio Alfa',
        action: '1',
        action_label: 'update',
        actor: 'user-1',
        actor_email: 'owner@healthapp.com',
        changes: { name: ['Antigo', 'Novo'] },
        timestamp: '2026-03-01T10:00:00Z',
        remote_addr: '127.0.0.1',
      },
    ],
    total: 1,
    totalPages: 1,
    params: {},
    queryKey: [{ url: '/api/v1/admin-panel/audit-logs/' }],
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    handleSearch: jest.fn(),
    handleAction: jest.fn(),
    handleModel: jest.fn(),
    handleUser: jest.fn(),
    handleDateFrom: jest.fn(),
    handleDateTo: jest.fn(),
    handleOrdering: jest.fn(),
  };
}

describe('OwnerAuditLogsPageContent', () => {
  beforeEach(() => {
    useOwnerAuditLogsListMock.mockReset();
    exportRowsToCsvMock.mockReset();
    useOwnerAuditLogsListMock.mockReturnValue(createListState());
  });

  it('renders filtered logs list and exports csv', async () => {
    const user = userEvent.setup();

    render(<OwnerAuditLogsPageContent />);

    expect(screen.getByText('owner@healthapp.com')).toBeInTheDocument();
    expect(screen.getByText('convenio')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'CSV' }));

    expect(exportRowsToCsvMock).toHaveBeenCalledTimes(1);
  });
});
