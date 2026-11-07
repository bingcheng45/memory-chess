"use client";

import { useMemo, useSyncExternalStore } from "react";
import { GAME_STORAGE_KEY, type GameSettings } from "@/lib/game/configPrefill";
import { isRatedReader, readerRoundOf } from "@/lib/game/readerRound";

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

function readStored(): string | null {
  try {
    return localStorage.getItem(GAME_STORAGE_KEY);
  } catch {
    return null;
  }
}

const serverStored = () => null;

export function useReaderRound(unrated?: GameSettings): GameSettings {
  return useReaderRoundState(unrated).round;
}

export function useReaderRoundState(unrated?: GameSettings): { readonly round: GameSettings; readonly isRated: boolean } {
  const stored = useSyncExternalStore(subscribe, readStored, serverStored);
  return useMemo(() => ({ round: readerRoundOf(stored, unrated), isRated: isRatedReader(stored) }), [stored, unrated]);
}
