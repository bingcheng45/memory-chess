import { unprefixedPath } from "@/lib/seo/englishOnly";

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
  const segments = unprefixedPath(pathname).split("/").filter(Boolean);

  if (segments.length !== 2 || segments[0] !== "learn") return null;

  const target = RETIRED_LEARN_SLUGS[segments[1]];
  return target ? `/learn/${target}` : null;
}
