import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { parseCountryCode, WORLD_CODE, type CountryCode } from '@/lib/leaderboard/countries';
import { playerNameProblem } from '@/lib/leaderboard/playerName';

export interface SettingsState {
  countryCode: CountryCode;
  /** The name the last leaderboard score went up under, offered again on the next one. Empty until then. */
  playerName: string;

  // Actions
  setCountryCode: (code: CountryCode) => void;
  setPlayerName: (name: string) => void;
}

// v0 shipped `difficulty` and `memorizationTime`, v1 dropped them, v2 added
// `countryCode`, and v3 drops `showCoordinates` now that coordinates are always
// shown, and v4 adds `playerName`. `migrate` runs over any older value already in localStorage.
const SETTINGS_STORE_VERSION = 4;

interface PersistedSettingsState {
  countryCode: CountryCode;
  playerName: string;
}

/** A stored name the leaderboard would refuse is dropped, so the form never opens on one it cannot send. */
function parsePlayerName(value: unknown): string {
  return typeof value === 'string' && playerNameProblem(value.trim()) === null ? value.trim() : '';
}

function parsePersisted(value: unknown): PersistedSettingsState {
  const stored = (typeof value === 'object' && value !== null ? value : {}) as Partial<PersistedSettingsState>;
  return { countryCode: parseCountryCode(stored.countryCode) ?? WORLD_CODE, playerName: parsePlayerName(stored.playerName) };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      countryCode: WORLD_CODE,
      playerName: '',

      setCountryCode: (countryCode) => set({ countryCode }),
      setPlayerName: (name) => set({ playerName: parsePlayerName(name) }),
    }),
    {
      name: 'memory-chess-settings',
      version: SETTINGS_STORE_VERSION,
      partialize: (state): PersistedSettingsState => ({ countryCode: state.countryCode, playerName: state.playerName }),
      migrate: parsePersisted,
      // localStorage is user-editable and `migrate` only runs when the stored
      // version differs, so a hand-edited current-version value would reach the UI unchecked.
      merge: (persisted, current) => ({ ...current, ...parsePersisted(persisted) }),
    }
  )
);
