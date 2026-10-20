"use client";

import { useMemo, useSyncExternalStore } from "react";
import { GAME_STORAGE_KEY, type GameSettings } from "@/lib/game/configPrefill";
import { readerRoundOf } from "@/lib/game/readerRound";

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
  const stored = useSyncExternalStore(subscribe, readStored, serverStored);
  return useMemo(() => readerRoundOf(stored, unrated), [stored, unrated]);
}
