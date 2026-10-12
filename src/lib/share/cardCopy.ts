import { createTranslator } from "next-intl";
import { shareCaption, type DashboardTranslate } from "@/components/dashboard/shareCaption";
import { resultCaption, resultCardCopy, type ResultCardCopy, type ResultTranslate, type RoundShare } from "@/components/game/roundShare";
import type { CardTrend } from "@/components/share/cardCanvas";
import { SITE } from "@/components/share/cardCanvas";
import type { Figure } from "@/lib/lab/dashboard";
import type { SharedFigure, SharedProgress } from "@/lib/share/shareCode";
import en from "../../../messages/en.json";

/**
 * What a share page and its preview image print, in English: a preview is drawn for whoever opens the link, and the
 * image carries only the scripts its bundled Geist covers. The caption the player posted stays in their language.
 */
const LOCALE = "en";
const dashboard = createTranslator({ locale: LOCALE, messages: en, namespace: "dashboard" }) as unknown as DashboardTranslate;
const result = createTranslator({ locale: LOCALE, messages: en, namespace: "game.result.share" }) as unknown as ResultTranslate;
const number = new Intl.NumberFormat(LOCALE);

export interface PreviewSegment {
  readonly text: string;
  readonly big: boolean;
}

export interface PreviewFigure {
  readonly label: string;
  readonly segments: readonly PreviewSegment[];
  readonly trend?: CardTrend;
}

export interface ProgressPreview {
  readonly kicker: string;
  readonly lead: PreviewFigure;
  readonly grid: readonly PreviewFigure[];
  readonly cta: string;
  readonly site: string;
  /** The caption a player posts with the card, which the page also uses as its title. */
  readonly caption: string;
  readonly alt: string;
}

export interface ResultPreview extends ResultCardCopy {
  readonly caption: string;
}

const MARK = "\u0001";

/** A figure's number inside its unit, split so the number can be drawn large, as the in-app card does. */
function segmentsOf({ value, unit, digits }: Figure): PreviewSegment[] {
  const formatted = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  return dashboard
    .markup(`unit.${unit}`, { count: value, value: formatted, n: (chunks: string) => `${MARK}${chunks}${MARK}` })
    .split(MARK)
    .map((part, index) => ({ text: part, big: index % 2 === 1 }))
    .filter(({ text: part }) => part.trim() !== "");
}

function previewFigure({ id, figure, trend }: SharedFigure): PreviewFigure {
  const moved = trend && trend.direction !== "level" ? { direction: trend.direction, text: number.format(trend.amount) } : undefined;
  return { label: dashboard(`label.${id}`), segments: segmentsOf(figure), ...(moved && { trend: moved }) };
}

export function progressPreview(progress: SharedProgress): ProgressPreview {
  const [lead, ...grid] = progress.figures.map(previewFigure);
  const figures = new Intl.ListFormat(LOCALE, { type: "unit" }).format(
    progress.figures.map(({ id, figure }) => dashboard(`share.figure.${id}`, { value: figure.value })),
  );
  return {
    kicker: dashboard("share.card.kicker"),
    lead,
    grid,
    cta: dashboard("share.card.cta"),
    site: SITE,
    caption: shareCaption(dashboard, progress, LOCALE).text,
    alt: `Memory Chess progress card: ${figures}.`,
  };
}

export function resultPreview(share: RoundShare): ResultPreview {
  return { ...resultCardCopy(result, share, LOCALE), caption: resultCaption(result, share, LOCALE).text };
}
