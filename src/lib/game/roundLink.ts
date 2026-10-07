import type { RoundSource } from "@/lib/analytics/events";

/** /game starts a round on mount from these params. */
export function playHref(pieceCount: number, memorizeTime: number, source: RoundSource): string {
  return `/game?pieceCount=${pieceCount}&memorizeTime=${memorizeTime}&source=${source}`;
}
