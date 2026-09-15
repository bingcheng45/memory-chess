import { LOCALES } from "@/i18n/routing";

/**
 * Guides merged into another guide, by old slug. Their URLs were indexed and
 * linked, so each answers a permanent redirect to the guide that absorbed it.
 */
export const RETIRED_LEARN_SLUGS: Readonly<Record<string, string>> = {
  "chess-board-vision-drills": "how-to-stop-blundering-in-chess",
  "working-memory-exercises-for-chess": "chess-calculation-exercises-for-beginners",
};

/** The live guide path for a retired guide's path, locale prefix or not; null otherwise. */
export function resolveRetiredLearnPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const unprefixed = (LOCALES as readonly string[]).includes(segments[0] ?? "")
    ? segments.slice(1)
    : segments;

  if (unprefixed.length !== 2 || unprefixed[0] !== "learn") return null;

  const target = RETIRED_LEARN_SLUGS[unprefixed[1]];
  return target ? `/learn/${target}` : null;
}
