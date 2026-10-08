"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLabData, useLabResults, type LabData } from "@/hooks/useLabData";
import { seconds } from "@/components/home/labFormat";
import { useWeekGoal } from "@/components/home/useWeekGoal";
import { trackEvent, type RoundSource } from "@/lib/analytics/events";
import { playHref } from "@/lib/game/roundLink";
import { INSIGHT_GUIDES } from "@/lib/lab/insights";
import { resultCardFor, type NewBest, type NextStep, type ResultCard, type Setting, type VsRecent } from "@/lib/lab/resultCard";
import type { RoundRecord } from "@/lib/lab/record";
import ResultLabSlot, { RESULT_LAB_FRAME, ResultLabEnd } from "./ResultLabSlot";

/** How long the card waits for the round to reach the record before it gives up. */
export const RESULT_LAB_WAIT_MS = 3000;

const SOURCE: RoundSource = "result_next";
const LINK_CLASS =
  "rounded font-semibold text-peach-500 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach-500/60";

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

function whyOf(t: Translate, next: NextStep): string | null {
  if (next.kind === "again") return null;
  if (next.kind !== "insight") return t(`next.why.${next.kind}`);
  const { ruleId, params } = next.insight;
  const { memorizeSeconds } = params;
  return t(`next.why.${ruleId}`, memorizeSeconds === undefined ? params : { ...params, studyTime: seconds(memorizeSeconds) });
}

const isPlainClick = (event: MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

const trackNext = () => trackEvent({ name: "lab_panel_action", params: { panel: "resultCard", action: "next" } });

function GuideLink({ t, guide }: { t: Translate; guide: keyof typeof INSIGHT_GUIDES }) {
  return (
    <Link className={LINK_CLASS} href={`/learn/${INSIGHT_GUIDES[guide]}`} onClick={trackNext}>
      {t(`next.${guide}`)} →
    </Link>
  );
}

function PlayLink({ t, label, setting, onPlay }: { t: Translate; label: "again" | "play"; setting: Setting; onPlay: ResultLabCardProps["onPlay"] }) {
  const { pieceCount, memorizeSeconds } = setting;
  const play = (event: MouseEvent) => {
    trackNext();
    if (!isPlainClick(event)) return;
    event.preventDefault();
    onPlay(pieceCount, memorizeSeconds, SOURCE);
  };
  return (
    <Link className={LINK_CLASS} href={playHref(pieceCount, memorizeSeconds, SOURCE)} onClick={play}>
      {t(`next.${label}`, { pieceCount, studyTime: seconds(memorizeSeconds) })} →
    </Link>
  );
}

function NextAction({ t, next, onPlay }: { t: Translate; next: NextStep; onPlay: ResultLabCardProps["onPlay"] }) {
  if (next.kind !== "insight") return <PlayLink t={t} label={next.kind === "again" ? "again" : "play"} setting={next.setting} onPlay={onPlay} />;
  const { action } = next.insight;
  return action.kind === "guide" ? <GuideLink t={t} guide={action.guide} /> : <PlayLink t={t} label="play" setting={action} onPlay={onPlay} />;
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

  const why = whyOf(t, card.next);
  return (
    <section aria-labelledby="result-lab-title" className={`${RESULT_LAB_FRAME} flex flex-col gap-2`}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id="result-lab-title" className="text-base font-semibold text-text-primary">
          {t("title")}
        </h3>
        <p className="text-xs text-text-secondary">{t("device")}</p>
      </header>
      <ul aria-label={t("lines")} className="space-y-1 text-sm text-text-primary">
        {linesOf(t, card).map((line) => (
          <li key={line} className="flex gap-2">
            <span aria-hidden="true" className="text-peach-500">
              ·
            </span>
            {line}
          </li>
        ))}
      </ul>
      <p className="mt-auto border-t border-bg-light pt-3 text-sm text-text-secondary">
        <span className="font-semibold text-text-primary">{t("next.label")}.</span>
        {why && ` ${why}`} <NextAction t={t} next={card.next} onPlay={onPlay} />
      </p>
    </section>
  );
}

/**
 * The round just played, read against the record on this device. Shown once the round is in the record. When it is
 * not there in time (storage that will not open, a failed or held write) the card gives up for good, so a round that
 * lands later cannot redraw the screen, and the metrics are only derived once the round is there to read.
 */
export default function ResultLabCard({ roundId, onPlay }: ResultLabCardProps) {
  const data = useLabData();
  const [waited, setWaited] = useState(false);
  const round = data.today ? data.records.find(({ id }) => id === roundId) : undefined;
  const found = round !== undefined;

  useEffect(() => {
    if (found) return;
    const timer = setTimeout(() => setWaited(true), RESULT_LAB_WAIT_MS);
    return () => clearTimeout(timer);
  }, [found]);

  const gaveUp = data.storage === "unavailable" || waited;
  if (gaveUp) return <ResultLabEnd />;
  if (!round) return <ResultLabSlot />;
  return <FoundCard round={round} data={data} onPlay={onPlay} />;
}
