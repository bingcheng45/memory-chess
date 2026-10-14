import type { RoundSource } from "@/lib/analytics/events";

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

/** The value `data-round-entry` takes on the document while a daily link's served page waits to hydrate. */
export const DAILY_ENTRY = "daily";

/**
 * Runs before the served /game page is parsed. The page is static, so its HTML holds the configuration form whatever
 * the link; for a daily link this marks the document so the form never paints before the board replaces it.
 */
export function roundEntryScript(): string {
  return `(function () {
  try {
    var params = new URLSearchParams(location.search);
    var round = params.get(${JSON.stringify(ROUND_PARAMS.pieceCount)}) || params.get(${JSON.stringify(ROUND_PARAMS.memorizeTime)});
    if (round && params.get(${JSON.stringify(ROUND_PARAMS.source)}) === ${JSON.stringify(DAILY_ENTRY)}) document.documentElement.setAttribute('data-round-entry', ${JSON.stringify(DAILY_ENTRY)});
  } catch (error) {}
})();`;
}
