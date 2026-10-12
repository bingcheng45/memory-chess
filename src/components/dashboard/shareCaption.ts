import type { useTranslations } from "next-intl";
import { shareUrl } from "@/components/share/shareLink";
import type { ShareCard } from "@/lib/lab/dashboard";
import type { SharePost } from "@/lib/shareIntents";

export type DashboardTranslate = ReturnType<typeof useTranslations<"dashboard">>;

/** The card's figures as one list in words, as the caption and the card's alt text name them. */
export function figureList(t: DashboardTranslate, card: ShareCard, locale: string): string {
  return new Intl.ListFormat(locale, { type: "unit" }).format(card.figures.map(({ id, figure }) => t(`share.figure.${id}`, { value: figure.value })));
}

/** The brag line posted with the card: its figures as one list, then the link on its own. */
export function shareCaption(t: DashboardTranslate, card: ShareCard, locale: string): SharePost {
  return { text: t("share.text", { figures: figureList(t, card, locale) }), url: shareUrl(locale, "dashboard") };
}
