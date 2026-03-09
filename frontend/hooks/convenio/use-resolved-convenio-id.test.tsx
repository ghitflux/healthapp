import { renderHook, waitFor } from '@testing-library/react';
import { useListConvenios } from '@api/hooks/useConvenio';
import { authService } from '@/lib/auth';
import { useAuthStore } from '@/stores/auth-store';
import { useResolvedConvenioId } from './use-resolved-convenio-id';

jest.mock('@api/hooks/useConvenio', () => ({
  useListConvenios: jest.fn(),
}));

const mockedUseListConvenios = useListConvenios as jest.MockedFunction<typeof useListConvenios>;

describe('useResolvedConvenioId', () => {
  const fallbackConvenioId = '3c0b1cf5-5ca3-416a-9a5b-6c9477437410';

  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    mockedUseListConvenios.mockReset();
    jest.spyOn(authService, 'isAuthenticated').mockReturnValue(true);
    jest.spyOn(authService, 'getUserRole').mockReturnValue('convenio_admin');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the convenio list fallback and rehydrates the auth store', async () => {
    mockedUseListConvenios.mockReturnValue({
      data: {
        status: 'success',
        data: [
          {
            id: fallbackConvenioId,
            name: 'Clinica Seed',
            contact_email: 'seed@example.com',
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
        meta: {},
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as never);

    useAuthStore.setState({
      user: {
        id: '9f4f814c-1101-4ea2-ac64-8b52aa4b7c76',
        email: 'admin@clinic.test',
        full_name: 'Admin Convenio',
        role: 'convenio_admin',
      },
      isAuthenticated: true,
      isLoading: false,
    });

    const { result } = renderHook(() => useResolvedConvenioId());

    expect(result.current.convenioId).toBe(fallbackConvenioId);

    await waitFor(() => {
      expect(useAuthStore.getState().user?.convenio_id).toBe(fallbackConvenioId);
    });
  });

  it('does not resolve from the convenio list when the auth store already has the id', () => {
    mockedUseListConvenios.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as never);

    useAuthStore.setState({
      user: {
        id: '9f4f814c-1101-4ea2-ac64-8b52aa4b7c76',
        email: 'admin@clinic.test',
        full_name: 'Admin Convenio',
        role: 'convenio_admin',
        convenio_id: fallbackConvenioId,
        convenio: fallbackConvenioId,
      },
      isAuthenticated: true,
      isLoading: false,
    });

    const { result } = renderHook(() => useResolvedConvenioId());

    expect(result.current.convenioId).toBe(fallbackConvenioId);
    expect(mockedUseListConvenios).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        query: expect.objectContaining({
          enabled: false,
        }),
      })
    );
  });
});
