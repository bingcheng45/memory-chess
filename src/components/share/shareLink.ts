import type { ShareKind } from "@/lib/share/shareCode";
import type { SharePost } from "@/lib/shareIntents";

const SITE_URL = "https://thememorychess.com";
/** The surface each kind of card is shared from, as its visits have always been tagged. */
const MEDIUM = { progress: "dashboard", result: "result" } as const satisfies Record<ShareKind, string>;

/** The card's own page, whose link preview is the card, tagged with the surface it was shared from so its visits can be counted apart. */
export function sharePageUrl(kind: ShareKind, code: string): string {
  const url = new URL(`/share/${kind}/${code}`, SITE_URL);
  url.searchParams.set("utm_source", "share");
  url.searchParams.set("utm_medium", MEDIUM[kind]);
  return url.toString();
}

/** The card drawn as a link preview: a plain path with no query, which X's card crawler reads most reliably. */
export const shareImageUrl = (kind: ShareKind, code: string) => `${SITE_URL}/api/share/${kind}/${code}`;

/** Where the share sheet is missing, the caption is copied with its link in one piece. */
export const captionWithLink = ({ text, url }: SharePost) => `${text} ${url}`;
