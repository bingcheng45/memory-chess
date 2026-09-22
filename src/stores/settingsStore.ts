import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { parseCountryCode, WORLD_CODE, type CountryCode } from '@/lib/leaderboard/countries';

export interface SettingsState {
  showCoordinates: boolean;
  countryCode: CountryCode;

  // Actions
  setShowCoordinates: (show: boolean) => void;
  setCountryCode: (code: CountryCode) => void;
}

// v0 shipped `difficulty` and `memorizationTime` alongside `showCoordinates`.
// The game screen now remembers its own last-used settings, so those two
// fields are dead; bumping to v1 ran `migrate` over any v0 value already in
// localStorage to drop them. v2 adds `countryCode`, which no v0 or v1 value
// carries; `merge` below is what supplies and validates it on every read.
const SETTINGS_STORE_VERSION = 2;

interface PersistedSettingsState {
  showCoordinates: boolean;
  countryCode: CountryCode;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default settings
      showCoordinates: true,
      countryCode: WORLD_CODE,

      // Actions
      setShowCoordinates: (showCoordinates) => set({ showCoordinates }),
      setCountryCode: (countryCode) => set({ countryCode }),
    }),
    {
      name: 'memory-chess-settings',
      version: SETTINGS_STORE_VERSION,
      partialize: (state) => ({
        showCoordinates: state.showCoordinates,
        countryCode: state.countryCode,
      }),
      migrate: (persistedState): PersistedSettingsState => {
        const legacy = persistedState as Partial<PersistedSettingsState> | null | undefined;
        return {
          showCoordinates: legacy?.showCoordinates ?? true,
          countryCode: parseCountryCode(legacy?.countryCode) ?? WORLD_CODE,
        };
      },
      // localStorage is user-editable and `migrate` only runs when the stored
      // version differs, so a hand-edited v2 country would reach the UI unchecked.
      merge: (persisted, current) => {
        const stored = (typeof persisted === 'object' && persisted !== null
          ? persisted
          : {}) as Partial<SettingsState>;
        return { ...current, ...stored, countryCode: parseCountryCode(stored.countryCode) ?? WORLD_CODE };
      },
    }
  )
);
