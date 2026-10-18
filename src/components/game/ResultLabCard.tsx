"use client";

import { useMemo, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLabResults, type LabData } from "@/hooks/useLabData";
import { seconds } from "@/components/home/labFormat";
import { useWeekGoal } from "@/components/home/useWeekGoal";
import { trackEvent, type RoundSource } from "@/lib/analytics/events";
import { playHref } from "@/lib/game/roundLink";
import { INSIGHT_GUIDES } from "@/lib/lab/insights";
import type { Insight } from "@/lib/lab/insights";
import { resultCardFor, type NewBest, type ResultCard, type Setting, type VsRecent } from "@/lib/lab/resultCard";
import type { RoundRecord } from "@/lib/lab/record";
import ResultLabSlot, { RESULT_LAB_FRAME, RESULT_LAB_LINK, ResultLabEnd } from "./ResultLabSlot";
import { useSavedRound } from "./useSavedRound";

export { RESULT_LAB_WAIT_MS } from "./useSavedRound";

const SOURCE: RoundSource = "result_next";

export interface ResultLabCardProps {
  readonly roundId: string;
  /** Starts a round in place: a link to /game from /game would not restart the page. */
  readonly onPlay: (pieceCount: number, memorizeTime: number, source: RoundSource) => void;
}

type Translate = ReturnType<typeof useTranslations<"home.lab.resultCard">>;

/** Two decimals under a tenth of a second, so a small gain never prints as 0. Null when even that rounds to zero. */
function fasterTime(fasterBy: number): string | null {
  const shown = fasterBy >= 0.1 ? fasterBy.toFixed(1) : fasterBy.toFixed(2);
  return Number(shown) === 0 ? null : seconds(shown);
}

function newBestLine(t: Translate, { setting, accuracy, previousAccuracy, fasterBy }: NewBest): string {
  const values = { pieceCount: setting.pieceCount, studyTime: seconds(setting.memorizeSeconds), accuracy };
  const faster = fasterBy === null ? null : fasterTime(fasterBy);
  if (faster) return t("newBest.faster", { ...values, fasterTime: faster });
  if (previousAccuracy !== null && previousAccuracy < accuracy) return t("newBest.up", { ...values, previous: previousAccuracy });
  return t("newBest.plain", values);
}

function vsRecentLine(t: Translate, { points, rounds }: VsRecent): string {
  if (points === 0) return t("vsRecent.level", { rounds });
  return t(points > 0 ? "vsRecent.above" : "vsRecent.below", { points: Math.abs(points), rounds });
}

function linesOf(t: Translate, { newBest, vsRecent, spanChange, streak }: ResultCard): string[] {
  return [
    newBest && newBestLine(t, newBest),
    vsRecent && vsRecentLine(t, vsRecent),
    spanChange && t("span", { pieceCount: spanChange.to }),
    t("streak", { current: streak.current, graceUsed: String(streak.graceUsed), days: streak.daysThisWeek, goal: streak.goal }),
  ].filter((line): line is string => Boolean(line));
}

function whyOf(t: Translate, { ruleId, params }: Insight): string {
  const { memorizeSeconds } = params;
  return t(`next.why.${ruleId}`, memorizeSeconds === undefined ? params : { ...params, studyTime: seconds(memorizeSeconds) });
}

const isPlainClick = (event: MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

const trackNext = () => trackEvent({ name: "lab_panel_action", params: { panel: "resultCard", action: "next" } });

function GuideLink({ t, guide }: { t: Translate; guide: keyof typeof INSIGHT_GUIDES }) {
  return (
    <Link className={RESULT_LAB_LINK} href={`/learn/${INSIGHT_GUIDES[guide]}`} onClick={trackNext}>
      {t(`next.${guide}`)} <span aria-hidden="true">→</span>
    </Link>
  );
}

function PlayLink({ t, setting, onPlay }: { t: Translate; setting: Setting; onPlay: ResultLabCardProps["onPlay"] }) {
  const { pieceCount, memorizeSeconds } = setting;
  const play = (event: MouseEvent) => {
    trackNext();
    if (!isPlainClick(event)) return;
    event.preventDefault();
    onPlay(pieceCount, memorizeSeconds, SOURCE);
  };
  return (
    <Link className={RESULT_LAB_LINK} href={playHref(pieceCount, memorizeSeconds, SOURCE)} onClick={play}>
      {t("next.play", { pieceCount, studyTime: seconds(memorizeSeconds) })} <span aria-hidden="true">→</span>
    </Link>
  );
}

function NextAction({ t, insight: { action }, onPlay }: { t: Translate; insight: Insight; onPlay: ResultLabCardProps["onPlay"] }) {
  return action.kind === "guide" ? <GuideLink t={t} guide={action.guide} /> : <PlayLink t={t} setting={action} onPlay={onPlay} />;
}

function FoundCard({ round, data, onPlay }: { round: RoundRecord; data: LabData; onPlay: ResultLabCardProps["onPlay"] }) {
  const t = useTranslations("home.lab.resultCard");
  const results = useLabResults(data);
  const [goal] = useWeekGoal();
  const { records, summary, today } = data;
  const card = useMemo(
    () => resultCardFor({ round, records, results, goal, days: summary.days, today }),
    [round, records, results, goal, summary.days, today],
  );
  if (!card) return <ResultLabEnd />;

  const { next } = card;
  return (
    <section aria-labelledby="result-lab-title" className={`${RESULT_LAB_FRAME} flex flex-col gap-2`}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id="result-lab-title" className="text-base font-semibold text-[var(--lp-ink)]">
          {t("title")}
        </h3>
        <p className="text-xs text-[var(--lp-ink-2)]">{t("device")}</p>
      </header>
      <ul aria-label={t("lines")} className="space-y-1 text-sm text-[var(--lp-ink)]">
        {linesOf(t, card).map((line) => (
          <li key={line} className="flex gap-2">
            <span aria-hidden="true" className="text-[var(--lp-accent)]">
              ·
            </span>
            {line}
          </li>
        ))}
      </ul>
      {next && (
        <p className="border-t border-[var(--lp-line)] pt-3 text-sm text-[var(--lp-ink-2)]">
          <span className="font-semibold text-[var(--lp-ink)]">{t("next.label")}.</span>
          {` ${whyOf(t, next)}`} <NextAction t={t} insight={next} onPlay={onPlay} />
        </p>
      )}
    </section>
  );
}

/** The round just played, read against the record on this device, shown once the round is in the record. */
export default function ResultLabCard({ roundId, onPlay }: ResultLabCardProps) {
  const saved = useSavedRound(roundId);
  if (saved.state === "gaveUp") return <ResultLabEnd />;
  if (saved.state === "waiting") return <ResultLabSlot />;
  return <FoundCard round={saved.round} data={saved.data} onPlay={onPlay} />;
}
