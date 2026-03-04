import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OwnerUsersPageContent } from './owner-users-page-content';

const useOwnerUsersListMock = jest.fn();

jest.mock('@/hooks/owner', () => ({
  useOwnerUsersList: () => useOwnerUsersListMock(),
}));

function createListState() {
  return {
    page: 1,
    setPage: jest.fn(),
    pageSize: 20,
    search: '',
    role: 'all',
    status: 'all',
    ordering: '-date_joined',
    users: [
      {
        id: 'user-1',
        email: 'owner@healthapp.com',
        full_name: 'Owner Teste',
        role: 'owner',
        is_active: true,
        email_verified: true,
        phone_verified: false,
        convenio: null,
        convenio_name: '',
        date_joined: '2026-03-01T10:00:00Z',
      },
    ],
    total: 1,
    totalPages: 1,
    params: {},
    queryKey: [{ url: '/api/v1/admin-panel/users/' }],
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    handleSearch: jest.fn(),
    handleRole: jest.fn(),
    handleStatus: jest.fn(),
    handleOrdering: jest.fn(),
  };
}

describe('OwnerUsersPageContent', () => {
  beforeEach(() => {
    useOwnerUsersListMock.mockReset();
    useOwnerUsersListMock.mockReturnValue(createListState());
  });

  it('renders user list data', () => {
    render(<OwnerUsersPageContent />);

    expect(screen.getByText('Owner Teste')).toBeInTheDocument();
    expect(screen.getByText('owner@healthapp.com')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('opens detail drawer and shows safe action scope note', async () => {
    const user = userEvent.setup();

    render(<OwnerUsersPageContent />);

    await user.click(screen.getByText('Owner Teste'));

    expect(screen.getByText('Detalhes do Usuário')).toBeInTheDocument();
    expect(screen.getByText('Escopo administrativo atual')).toBeInTheDocument();
  });
});
