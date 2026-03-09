import { create } from 'zustand';
import type { Profile } from '@api/types/Profile';
import { storage } from '@/lib/storage';

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hydrate: () => Promise<void>;
  setAuthData: (access: string, refresh: string, user?: Profile | null) => Promise<void>;
  setUser: (user: Profile | null) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hydrate: async () => {
    try {
      const [accessToken, user] = await Promise.all([
        storage.getAccessToken(),
        storage.getUser<Profile>(),
      ]);

      set({
        user,
        isAuthenticated: Boolean(accessToken),
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
  setAuthData: async (access, refresh, user) => {
    await Promise.all([
      storage.setAccessToken(access),
      storage.setRefreshToken(refresh),
      user ? storage.setUser(user) : Promise.resolve(),
    ]);

    set({
      user: user ?? null,
      isAuthenticated: true,
      isLoading: false,
    });
  },
  setUser: async (user) => {
    if (user) {
      await storage.setUser(user);
    } else {
      await storage.removeUser();
    }

    set({
      user,
      isAuthenticated: Boolean(user) || useAuthStore.getState().isAuthenticated,
      isLoading: false,
    });
  },
  logout: async () => {
    await storage.clearAll();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
