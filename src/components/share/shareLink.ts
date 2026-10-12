import { localizedUrl } from "@/lib/seo/alternates";
import type { SharePost } from "@/lib/shareIntents";

/** The home page in the player's language, tagged with the surface the card was shared from so its visits can be counted apart. */
export function shareUrl(locale: string, medium: "dashboard" | "result"): string {
  const url = new URL(localizedUrl("/", locale));
  url.searchParams.set("utm_source", "share");
  url.searchParams.set("utm_medium", medium);
  return url.toString();
}

/** Where the share sheet is missing, the caption is copied with its link in one piece. */
export const captionWithLink = ({ text, url }: SharePost) => `${text} ${url}`;
