/**
 * Auth Store — Zustand com persistência.
 * Singleton pattern: store único compartilhado.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeAuthUser } from '@/lib/auth-user';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  convenio_id?: string;
  convenio?: string | null;
  phone?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) =>
        set({
          user: normalizeAuthUser(user),
          isAuthenticated: !!user,
          isLoading: false,
        }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
      },
    }),
    {
      name: 'abase-saude-auth',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AuthState> | undefined;
        const user = normalizeAuthUser(persisted?.user ?? currentState.user);

        return {
          ...currentState,
          ...persisted,
          user,
          isAuthenticated: persisted?.isAuthenticated ?? Boolean(user),
          isLoading: false,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false);
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
