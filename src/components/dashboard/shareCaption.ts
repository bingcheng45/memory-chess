import type { useTranslations } from "next-intl";
import type { ShareCard } from "@/lib/lab/dashboard";
import { localizedUrl } from "@/lib/seo/alternates";

export type DashboardTranslate = ReturnType<typeof useTranslations<"dashboard">>;

const SHARE_UTM = { utm_source: "share", utm_medium: "dashboard" } as const;

export interface ShareCaption {
  readonly text: string;
  readonly url: string;
}

/** The home page in the player's language, tagged so a visit from a shared card can be counted apart. */
export function shareUrl(locale: string): string {
  const url = new URL(localizedUrl("/", locale));
  Object.entries(SHARE_UTM).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

/** The card's figures as one list in words, as the caption and the card's alt text name them. */
export function figureList(t: DashboardTranslate, card: ShareCard, locale: string): string {
  return new Intl.ListFormat(locale, { type: "unit" }).format(card.figures.map(({ id, figure }) => t(`share.figure.${id}`, { value: figure.value })));
}

/** The brag line posted with the card: its figures as one list, then the link on its own. */
export function shareCaption(t: DashboardTranslate, card: ShareCard, locale: string): ShareCaption {
  return { text: t("share.text", { figures: figureList(t, card, locale) }), url: shareUrl(locale) };
}

/** Where the share sheet is missing, the caption is copied with its link in one piece. */
export const captionWithLink = ({ text, url }: ShareCaption) => `${text} ${url}`;
