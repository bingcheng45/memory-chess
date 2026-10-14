import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { parseCountryCode, WORLD_CODE, type CountryCode } from '@/lib/leaderboard/countries';

export interface SettingsState {
  countryCode: CountryCode;

  // Actions
  setCountryCode: (code: CountryCode) => void;
}

// v0 shipped `difficulty` and `memorizationTime`, v1 dropped them, v2 added
// `countryCode`, and v3 drops `showCoordinates` now that coordinates are always
// shown. `migrate` runs over any older value already in localStorage.
const SETTINGS_STORE_VERSION = 3;

interface PersistedSettingsState {
  countryCode: CountryCode;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      countryCode: WORLD_CODE,

      setCountryCode: (countryCode) => set({ countryCode }),
    }),
    {
      name: 'memory-chess-settings',
      version: SETTINGS_STORE_VERSION,
      partialize: (state): PersistedSettingsState => ({ countryCode: state.countryCode }),
      migrate: (persistedState): PersistedSettingsState => {
        const legacy = persistedState as Partial<PersistedSettingsState> | null | undefined;
        return { countryCode: parseCountryCode(legacy?.countryCode) ?? WORLD_CODE };
      },
      // localStorage is user-editable and `migrate` only runs when the stored
      // version differs, so a hand-edited current-version country would reach the UI unchecked.
      merge: (persisted, current) => {
        const stored = (typeof persisted === 'object' && persisted !== null
          ? persisted
          : {}) as Partial<PersistedSettingsState>;
        return { ...current, countryCode: parseCountryCode(stored.countryCode) ?? WORLD_CODE };
      },
    }
  )
);
