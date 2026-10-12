import type { useTranslations } from "next-intl";
import { sharePageUrl } from "@/components/share/shareLink";
import type { ShareCard } from "@/lib/lab/dashboard";
import { progressCode, type SharedFigure, type SharedProgress } from "@/lib/share/shareCode";
import type { SharePost } from "@/lib/shareIntents";

export type DashboardTranslate = ReturnType<typeof useTranslations<"dashboard">>;

/** A caption stays one line in a feed: the strongest figures above zero, the card shows the rest. */
const CAPTION_FIGURES = 4;

function figureList(t: DashboardTranslate, figures: readonly SharedFigure[], locale: string): string {
  return new Intl.ListFormat(locale, { type: "unit" }).format(figures.map(({ id, figure }) => t(`share.figure.${id}`, { value: figure.value })));
}

/** The brag line posted with the card: its strongest figures as one list, then the link to the card's own page. */
export function shareCaption(t: DashboardTranslate, card: SharedProgress, locale: string): SharePost {
  const strongest = card.figures.filter(({ figure }) => figure.value > 0).slice(0, CAPTION_FIGURES);
  return { text: t("share.text", { figures: figureList(t, strongest, locale) }), url: sharePageUrl("progress", progressCode(card)) };
}

/** The card in words: every figure it prints, then the rounds played. */
export function shareAlt(t: DashboardTranslate, card: ShareCard, locale: string): string {
  const figures = figureList(t, card.figures.filter(({ id }) => id !== "rounds"), locale);
  return t("share.alt", { figures, rounds: t("share.card.rounds", { count: card.rounds }) });
}
