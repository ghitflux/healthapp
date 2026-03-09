/**
 * Serviço de autenticação.
 * Strategy pattern: diferentes estratégias de redirect por role.
 * Singleton pattern: authService é instância única.
 */
import { api } from './api';

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthSession extends AuthTokens {
  user?: {
    role?: string | null;
    [key: string]: unknown;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface JWTPayload {
  user_id: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export const WEB_ALLOWED_ROLES = ['owner', 'convenio_admin', 'doctor'] as const;
export type WebAllowedRole = (typeof WEB_ALLOWED_ROLES)[number];

export function isWebAllowedRole(role: string | null | undefined): role is WebAllowedRole {
  return !!role && WEB_ALLOWED_ROLES.includes(role as WebAllowedRole);
}

/**
 * Estratégia de redirect por role (Strategy Pattern).
 */
interface RoleRedirectStrategy {
  getRedirectPath(): string;
}

class ConvenioAdminRedirect implements RoleRedirectStrategy {
  getRedirectPath(): string {
    return '/convenio/dashboard';
  }
}

class OwnerRedirect implements RoleRedirectStrategy {
  getRedirectPath(): string {
    return '/owner/dashboard';
  }
}

class DoctorRedirect implements RoleRedirectStrategy {
  getRedirectPath(): string {
    return '/access-denied?reason=doctor_web_pending&role=doctor';
  }
}

class DefaultRedirect implements RoleRedirectStrategy {
  getRedirectPath(): string {
    return '/login';
  }
}

/**
 * Factory Method para criar a estratégia de redirect correta por role.
 */
function createRedirectStrategy(role: string | null): RoleRedirectStrategy {
  switch (role) {
    case 'owner':
      return new OwnerRedirect();
    case 'convenio_admin':
      return new ConvenioAdminRedirect();
    case 'doctor':
      return new DoctorRedirect();
    default:
      return new DefaultRedirect();
  }
}

/**
 * Singleton — Serviço de autenticação.
 */
export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthSession> => {
    const response = await api.post('/v1/auth/login/', credentials);
    const session = response.data.data ?? response.data;
    localStorage.setItem('access_token', session.access);
    localStorage.setItem('refresh_token', session.refresh);
    return session;
  },

  clearTokens: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  logout: async (): Promise<void> => {
    const refresh = typeof window !== 'undefined'
      ? localStorage.getItem('refresh_token')
      : null;

    if (refresh) {
      try {
        await api.post('/v1/auth/logout/', { refresh });
      } catch {
        // Ignorar erro de logout — limpar tokens mesmo assim
      }
    }

    if (typeof window !== 'undefined') {
      authService.clearTokens();
      window.location.href = '/login';
    }
  },

  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  },

  isAuthenticated: (): boolean => {
    return !!authService.getAccessToken();
  },

  decodePayload: (): JWTPayload | null => {
    const token = authService.getAccessToken();
    if (!token) return null;
    try {
      const base64 = token.split('.')[1];
      if (!base64) return null;
      const decoded = atob(base64);
      return JSON.parse(decoded) as JWTPayload;
    } catch {
      return null;
    }
  },

  getUserRole: (): string | null => {
    const payload = authService.decodePayload();
    return payload?.role ?? null;
  },

  getUserId: (): string | null => {
    const payload = authService.decodePayload();
    return payload?.user_id ?? null;
  },

  isWebRoleAllowed: (roleOverride?: string | null): boolean => {
    const role = roleOverride ?? authService.getUserRole();
    return isWebAllowedRole(role);
  },

  isTokenExpired: (): boolean => {
    const payload = authService.decodePayload();
    if (!payload?.exp) return true;
    return payload.exp * 1000 < Date.now();
  },

  /**
   * Obtém o caminho de redirect baseado no role do usuário logado.
   * Usa Strategy Pattern para determinar o destino correto.
   */
  getRedirectPath: (roleOverride?: string | null): string => {
    const role = roleOverride ?? authService.getUserRole();
    const strategy = createRedirectStrategy(role);
    return strategy.getRedirectPath();
  },
};
