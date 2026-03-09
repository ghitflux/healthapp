import { create } from 'zustand';

interface AppState {
  onboardingComplete: boolean;
  setOnboardingComplete: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  onboardingComplete: false,
  setOnboardingComplete: (value) => set({ onboardingComplete: value }),
}));
