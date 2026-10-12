import type { useTranslations } from "next-intl";
import { SITE, type CardFrame, type CardTrend } from "@/components/share/cardCanvas";
import { sharePageUrl } from "@/components/share/shareLink";
import { resultCode } from "@/lib/share/shareCode";
import type { LabPosition, RoundState } from "@/lib/round/round";
import type { SharePost } from "@/lib/shareIntents";

export type ResultTranslate = ReturnType<typeof useTranslations<"game.result.share">>;

type ScoredRound = Extract<RoundState, { phase: "scored" }>;

/** What the game store holds once the round is scored: the new rating, the change the round made, the win streak. */
export interface Standing {
  readonly rating: number;
  readonly change: number;
  readonly winStreak: number;
}

export interface ScoredBoard {
  readonly target: LabPosition;
  readonly placed: LabPosition;
}

/** A streak of one is any round at the win mark; two in a row is the first that says something. */
const SHOWN_STREAK = 2;

interface RoundFacts {
  readonly accuracy: number;
  readonly correct: number;
  readonly total: number;
  readonly pieceCount: number;
  /** The study time the setting allowed, and the time the player took. */
  readonly memorizeSeconds: number;
  readonly studySeconds: number;
  readonly rebuildSeconds: number;
}

/**
 * A round as its share card tells it. A random round shows its scored board. The daily board shows no position,
 * since every player gets the same one that day, and a review shows no rating or streak, since it changes neither.
 */
export type RoundShare = RoundFacts &
  (
    | { readonly kind: "game"; readonly board: ScoredBoard; readonly rating: Omit<Standing, "winStreak">; readonly winStreak: number | null }
    | { readonly kind: "daily"; readonly day: string; readonly rating: Omit<Standing, "winStreak">; readonly winStreak: number | null }
    | { readonly kind: "review"; readonly board: ScoredBoard }
  );

const tenths = (ms: number) => Math.round(ms / 100) / 10;

export function roundShareOf(round: ScoredRound, { rating, change, winStreak }: Standing): RoundShare {
  const facts: RoundFacts = {
    accuracy: Math.round(round.score.accuracy),
    correct: round.score.correct,
    total: round.score.total,
    pieceCount: round.config.pieceCount,
    memorizeSeconds: round.config.studyMs / 1000,
    studySeconds: tenths(round.studyMs),
    rebuildSeconds: tenths(round.rebuildMs),
  };
  const set = round.config.board;
  if (set?.kind === "review") return { ...facts, kind: "review", board: { target: round.target, placed: round.placed } };
  const rated = { rating: { rating, change }, winStreak: winStreak >= SHOWN_STREAK ? winStreak : null };
  if (set?.kind === "daily") return { ...facts, kind: "daily", day: set.day, ...rated };
  return { ...facts, kind: "game", board: { target: round.target, placed: round.placed }, ...rated };
}

export interface ResultStat {
  readonly label: string;
  /** The stat in words, which the card's description reads. */
  readonly value: string;
  /** What the card draws instead of `value` when a figure carries a trend: the figure, and its change as an arrow. */
  readonly mark?: { readonly figure: string; readonly trend: CardTrend };
}

/** Everything the result card prints, in the player's language and number format. */
export interface ResultCardCopy extends CardFrame {
  readonly accuracyLabel: string;
  readonly accuracy: string;
  readonly pieces: string;
  readonly stats: readonly ResultStat[];
  /** The board's marks in words; null when the card draws no board. */
  readonly legend: { readonly correct: string; readonly missed: string; readonly wrong: string } | null;
  readonly alt: string;
}

/** A daily board is named by its UTC day, the day it is everyone's board. */
const dayText = (day: string, locale: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const percentText = (accuracy: number, locale: string) => new Intl.NumberFormat(locale, { style: "percent" }).format(accuracy / 100);
const secondsText = (seconds: number, locale: string) => new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(seconds);

function kickerOf(t: ResultTranslate, share: RoundShare, locale: string): string {
  return t("kicker", { kind: share.kind, date: share.kind === "daily" ? dayText(share.day, locale) : "" });
}

function statsOf(t: ResultTranslate, share: RoundShare, locale: string): ResultStat[] {
  const number = new Intl.NumberFormat(locale);
  const signed = new Intl.NumberFormat(locale, { signDisplay: "exceptZero" });
  const stats: ResultStat[] = [
    { label: t("setting"), value: t("settingValue", { pieceCount: share.pieceCount, seconds: number.format(share.memorizeSeconds) }) },
    { label: t("study"), value: t("seconds", { seconds: secondsText(share.studySeconds, locale) }) },
    { label: t("rebuild"), value: t("seconds", { seconds: secondsText(share.rebuildSeconds, locale) }) },
  ];
  if (share.kind === "review") return stats;
  const { rating: score, change } = share.rating;
  const direction = change > 0 ? "up" : "down";
  const mark = change === 0 ? undefined : { figure: number.format(score), trend: { direction, text: number.format(Math.abs(change)) } } as const;
  const rating: ResultStat = { label: t("rating"), value: t("ratingValue", { rating: number.format(score), change: signed.format(change) }), ...(mark && { mark }) };
  const streak = share.winStreak === null ? [] : [{ label: t("winStreak"), value: t("winStreakValue", { count: share.winStreak }) }];
  return [...stats, rating, ...streak];
}

export function resultCardCopy(t: ResultTranslate, share: RoundShare, locale: string): ResultCardCopy {
  const kicker = kickerOf(t, share, locale);
  const accuracy = percentText(share.accuracy, locale);
  const pieces = t("pieces", { correct: share.correct, total: share.total });
  const stats = statsOf(t, share, locale);
  const details = new Intl.ListFormat(locale, { type: "unit" }).format([kicker, `${t("accuracy")} ${accuracy}`, pieces, ...stats.map(({ label, value }) => `${label} ${value}`)]);
  return {
    kicker,
    accuracyLabel: t("accuracy"),
    accuracy,
    pieces,
    stats,
    legend: share.kind === "daily" ? null : { correct: t("legend.correct"), missed: t("legend.missed"), wrong: t("legend.wrong") },
    cta: t("cta"),
    site: SITE,
    alt: t("alt", { details }),
  };
}

/** One sentence with the score and the board it was on, then the link to the card's own page. */
export function resultCaption(t: ResultTranslate, share: RoundShare, locale: string): SharePost {
  const text = t("text", {
    kind: share.kind,
    correct: share.correct,
    total: share.total,
    accuracy: percentText(share.accuracy, locale),
    date: share.kind === "daily" ? dayText(share.day, locale) : "",
  });
  return { text, url: sharePageUrl("result", resultCode(share)) };
}
