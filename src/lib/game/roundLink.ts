import type { RoundSource } from "@/lib/analytics/events";

/** The query a round link carries; /game reads it, starts the round and clears it. */
export const ROUND_PARAMS = {
  pieceCount: "pieceCount",
  memorizeTime: "memorizeTime",
  source: "source",
} as const;

export function playHref(pieceCount: number, memorizeTime: number, source: RoundSource): string {
  const query = new URLSearchParams({
    [ROUND_PARAMS.pieceCount]: String(pieceCount),
    [ROUND_PARAMS.memorizeTime]: String(memorizeTime),
    [ROUND_PARAMS.source]: source,
  });
  return `/game?${query}`;
}
