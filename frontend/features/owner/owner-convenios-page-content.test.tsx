import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OwnerConveniosPageContent } from './owner-convenios-page-content';

const useOwnerConveniosListMock = jest.fn();
const useOwnerMutationsMock = jest.fn();
const useGetAdminConvenioByIdMock = jest.fn();

const exportRowsToCsvMock = jest.fn();
const printRowsAsPdfMock = jest.fn();

jest.mock('@/hooks/owner', () => ({
  useOwnerConveniosList: () => useOwnerConveniosListMock(),
  useOwnerMutations: () => useOwnerMutationsMock(),
}));

jest.mock('@api/hooks/useOwner', () => ({
  useGetAdminConvenioById: () => useGetAdminConvenioByIdMock(),
}));

jest.mock('@/lib/export-utils', () => ({
  exportRowsToCsv: (...args: unknown[]) => exportRowsToCsvMock(...args),
  printRowsAsPdf: (...args: unknown[]) => printRowsAsPdfMock(...args),
}));

function createListState() {
  return {
    page: 1,
    setPage: jest.fn(),
    pageSize: 20,
    search: '',
    status: 'all',
    ordering: 'name',
    convenios: [
      {
        id: 'convenio-1',
        name: 'Convênio Alfa',
        contact_email: 'contato@alfa.com',
        subscription_plan: 'pro',
        subscription_status: 'active',
        is_active: true,
        is_approved: false,
        approved_at: null,
        doctors_count: 12,
        created_at: '2026-03-01T10:00:00Z',
      },
    ],
    total: 1,
    totalPages: 1,
    params: {},
    queryKey: [{ url: '/api/v1/admin-panel/convenios/' }],
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    handleSearch: jest.fn(),
    handleStatus: jest.fn(),
    handleOrdering: jest.fn(),
  };
}

function createMutationState() {
  return {
    createConvenio: jest.fn(),
    deleteConvenio: jest.fn(),
    approveConvenio: jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined),
    suspendConvenio: jest.fn(),
    updateSettings: jest.fn(),
    isCreatingConvenio: false,
    isDeletingConvenio: false,
    isApprovingConvenio: false,
    isSuspendingConvenio: false,
    isUpdatingSettings: false,
  };
}

describe('OwnerConveniosPageContent', () => {
  beforeEach(() => {
    useOwnerConveniosListMock.mockReset();
    useOwnerMutationsMock.mockReset();
    useGetAdminConvenioByIdMock.mockReset();
    exportRowsToCsvMock.mockReset();
    printRowsAsPdfMock.mockReset();

    useOwnerConveniosListMock.mockReturnValue(createListState());
    useOwnerMutationsMock.mockReturnValue(createMutationState());
    useGetAdminConvenioByIdMock.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
  });

  it('renders convenios and exports csv', async () => {
    const user = userEvent.setup();

    render(<OwnerConveniosPageContent />);

    expect(screen.getByText('Convênio Alfa')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'CSV' }));

    expect(exportRowsToCsvMock).toHaveBeenCalledTimes(1);
  });

  it('runs approve flow with confirmation dialog', async () => {
    const user = userEvent.setup();
    const mutations = createMutationState();
    useOwnerMutationsMock.mockReturnValue(mutations);

    render(<OwnerConveniosPageContent />);

    await user.click(screen.getByRole('button', { name: 'Ações do convênio' }));
    await user.click(screen.getByText('Aprovar'));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(mutations.approveConvenio).toHaveBeenCalledWith('convenio-1');
    });
  });
});
