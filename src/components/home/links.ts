import { DEFAULT_PRESET } from "@/lib/game/configPrefill";

/** /game starts a round on mount from these params. */
export function playHref(pieceCount: number, memorizeTime: number): string {
  return `/game?pieceCount=${pieceCount}&memorizeTime=${memorizeTime}`;
}

export const QUICK_START_HREF = playHref(DEFAULT_PRESET.pieceCount, DEFAULT_PRESET.memorizeTime);
