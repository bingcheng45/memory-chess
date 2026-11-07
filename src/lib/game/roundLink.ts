import type { RoundSource } from "@/lib/analytics/events";

export const ROUND_PARAMS = {
  pieceCount: "pieceCount",
  memorizeTime: "memorizeTime",
  from: "from",
} as const;

/**
 * Round links used to carry `source=`, which GA4 reads like `utm_source`, so every internal click replaced the
 * visitor's real traffic source. Links shared or bookmarked before the rename still carry it.
 */
export const LEGACY_SOURCE_PARAM = "source";

export const ROUND_PARAM_NAMES: readonly string[] = [...Object.values(ROUND_PARAMS), LEGACY_SOURCE_PARAM];

export const roundSourceParam = (params: URLSearchParams): string | null => params.get(ROUND_PARAMS.from) ?? params.get(LEGACY_SOURCE_PARAM);

/**
 * `?mode=blindfold` studies the position as notation. Unlike the round params it stays in the address once a round
 * starts, as `?difficulty=` does, so the form opens with Blindfold still on after the round.
 */
export const MODE_PARAM = "mode";
export const BLINDFOLD_MODE = "blindfold";

export const isBlindfoldSearch = (search: string): boolean => new URLSearchParams(search).get(MODE_PARAM) === BLINDFOLD_MODE;

export function playHref(pieceCount: number, memorizeTime: number, source: RoundSource, blindfold = false): string {
  const query = new URLSearchParams({
    [ROUND_PARAMS.pieceCount]: String(pieceCount),
    [ROUND_PARAMS.memorizeTime]: String(memorizeTime),
    [ROUND_PARAMS.from]: source,
    ...(blindfold ? { [MODE_PARAM]: BLINDFOLD_MODE } : {}),
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
    if (round && (params.get(${JSON.stringify(ROUND_PARAMS.from)}) || params.get(${JSON.stringify(LEGACY_SOURCE_PARAM)})) === ${JSON.stringify(DAILY_ENTRY)}) document.documentElement.setAttribute('data-round-entry', ${JSON.stringify(DAILY_ENTRY)});
  } catch (error) {}
})();`;
}
