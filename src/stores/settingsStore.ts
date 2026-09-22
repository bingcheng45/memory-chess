import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
  showCoordinates: boolean;

  // Actions
  setShowCoordinates: (show: boolean) => void;
}

// v0 shipped `difficulty` and `memorizationTime` alongside `showCoordinates`.
// The game screen now remembers its own last-used settings, so those two
// fields are dead. Bumping the version runs `migrate` on any v0 value already
// in localStorage, which drops them and keeps only `showCoordinates`.
const SETTINGS_STORE_VERSION = 1;

interface PersistedSettingsState {
  showCoordinates: boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default settings
      showCoordinates: true,

      // Actions
      setShowCoordinates: (showCoordinates) => set({ showCoordinates }),
    }),
    {
      name: 'memory-chess-settings',
      version: SETTINGS_STORE_VERSION,
      partialize: (state) => ({ showCoordinates: state.showCoordinates }),
      migrate: (persistedState): PersistedSettingsState => {
        const legacy = persistedState as Partial<PersistedSettingsState> | null | undefined;
        return { showCoordinates: legacy?.showCoordinates ?? true };
      },
    }
  )
);