import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './login-form';

const pushMock = jest.fn();
const setUserMock = jest.fn();
const loginMock = jest.fn();
const apiGetMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: jest.fn(),
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  authService: {
    login: (...args: unknown[]) => loginMock(...args),
    getUserRole: jest.fn(() => 'convenio_admin'),
    isWebRoleAllowed: jest.fn(() => true),
    clearTokens: jest.fn(),
    getRedirectPath: jest.fn(() => '/convenio/dashboard'),
  },
}));

jest.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => apiGetMock(...args),
  },
}));

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: { setUser: typeof setUserMock }) => unknown) =>
    selector({
      setUser: setUserMock,
    }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    pushMock.mockReset();
    setUserMock.mockReset();
    loginMock.mockReset();
    apiGetMock.mockReset();
  });

  it('populates auth store from login response when profile fetch fails', async () => {
    loginMock.mockResolvedValue({
      access: 'access-token',
      refresh: 'refresh-token',
      user: {
        id: '0f5f4392-12d6-448c-8a93-7611dba30ebf',
        email: 'admin.seed3@healthapp.com.br',
        full_name: 'Admin Seed 3',
        role: 'convenio_admin',
        convenio: '3c0b1cf5-5ca3-416a-9a5b-6c9477437410',
      },
    });
    apiGetMock.mockRejectedValue(new Error('profile unavailable'));

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText('E-mail'), 'admin.seed3@healthapp.com.br');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'Admin@2026!');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(setUserMock).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'convenio_admin',
          convenio: '3c0b1cf5-5ca3-416a-9a5b-6c9477437410',
        })
      );
    });

    expect(pushMock).toHaveBeenCalledWith('/convenio/dashboard');
  });
});
