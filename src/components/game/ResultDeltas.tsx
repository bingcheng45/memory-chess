"use client";

import { useMemo, useRef } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useFigureText } from "@/components/dashboard/figureText";
import RoundSavedToast from "@/components/game/RoundSavedToast";
import { TrendChip } from "@/components/dashboard/TrendChip";
import { standingOf } from "@/components/dashboard/useGameStanding";
import { useWeekGoal } from "@/components/home/useWeekGoal";
import { readDailyOpened, utcDayOf } from "@/lib/lab/daily";
import type { GameStanding } from "@/lib/lab/dashboard";
import type { RoundRecord } from "@/lib/lab/record";
import { roundRecordOf, type LabRound } from "@/lib/lab/recordRound";
import { labStore } from "@/lib/lab/storage";
import { addToSummary, type LabSummary } from "@/lib/lab/summary";
import { roundDeltasOf, verdictOf, type FigureDelta } from "@/lib/lab/roundDeltas";
import { START_RATING } from "@/lib/game/rating";
import { useGameStore, WIN_ACCURACY } from "@/lib/store/gameStore";

/** The game standing after the round and the one it started from; a review or a free skip moves neither, so both are the same. */
function useRoundStandings(roundId: string): { readonly before: GameStanding | null; readonly after: GameStanding | null } {
  const gameState = useGameStore((state) => state.gameState);
  const history = useGameStore((state) => state.history);
  return useMemo(() => {
    const after = standingOf(gameState.skillRating ?? START_RATING, gameState.streak ?? 0, history);
    const start = gameState.standingBefore;
    if (!start) return { before: after, after };
    return { before: standingOf(start.skillRating, start.streak, history.filter(({ id }) => id !== roundId)), after };
  }, [gameState, history, roundId]);
}

function DeltaRow({ delta }: { delta: FigureDelta }) {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  const figureText = useFigureText();
  const label = t(`label.${delta.id}`);
  const after = figureText.plain(delta.after);
  const verdict = verdictOf(delta);

  const said =
    delta.direction === "new" || delta.direction === "level"
      ? t(`deltas.say.${delta.direction}`, { label, after })
      : t(`deltas.say.${delta.direction}`, {
          label,
          after,
          before: figureText.plain(delta.before),
          amount: format.number(Math.abs(delta.delta), { maximumFractionDigits: delta.after.digits }),
          verdict,
        });

  return (
    <li className="lab-delta" data-figure={delta.id} data-verdict={verdict}>
      <span className="lab-sr">{said}</span>
      <div aria-hidden="true">
        <span className="lab-delta-label">{label}</span>
        <span className="lab-delta-line">
          <span className="lab-delta-value">{figureText.rich(delta.after)}</span>
          {delta.direction === "new" && <span className="lab-tag lab-tag-accent">{t("deltas.new")}</span>}
          {delta.direction === "level" && <span className="lab-delta-from">{t("deltas.level")}</span>}
          {(delta.direction === "up" || delta.direction === "down") && (
            <>
              <TrendChip trend={{ direction: delta.direction, amount: Math.abs(delta.delta) }} betterWhen={delta.betterWhen} label={said} />
              <span className="lab-delta-from">{t("deltas.from", { before: figureText.plain(delta.before) })}</span>
            </>
          )}
        </span>
      </div>
    </li>
  );
}

/** The record as the round found it: read while the round is played, so the result screen can count the round in its first frame. */
export interface RecordBefore {
  readonly records: readonly RoundRecord[];
  readonly summary: LabSummary;
}

/** Null when this device keeps no record. The summary is read after the rounds, the order useLabData reads them in. */
export async function readRecordBefore(): Promise<RecordBefore | null> {
  const store = labStore();
  if (!store || !(await store.isAvailable())) return null;
  const records = await store.listRounds();
  return { records, summary: await store.readSummary() };
}

export interface ResultDeltasProps {
  readonly before: RecordBefore;
  readonly labRound: LabRound;
}

/**
 * The dashboard's lead and summary figures after the round just played, each beside what it read before. Counted
 * from the record read during the round plus the round itself, through the same tile builders as the dashboard, so
 * the list is whole in the result screen's first frame and nothing under it moves.
 */
export default function ResultDeltas({ before, labRound }: ResultDeltasProps) {
  const t = useTranslations("dashboard.deltas");
  const [weekGoal] = useWeekGoal();
  const standings = useRoundStandings(labRound.facts.id);
  const section = useRef<HTMLElement>(null);
  const deltas = useMemo(() => {
    const round = roundRecordOf(labRound.facts, new Date(labRound.endedAt));
    return roundDeltasOf({
      dashboard: {
        records: [...before.records, round],
        summary: addToSummary(before.summary, round),
        today: round.localDay,
        weekGoal,
        entries: null,
        utcDay: utcDayOf(labRound.endedAt),
        dailyOpened: readDailyOpened(),
        chooseHref: null,
        game: standings.after,
        winAccuracy: WIN_ACCURACY,
      },
      round,
      gameBefore: standings.before,
    });
  }, [before, labRound, weekGoal, standings]);

  return (
    <section ref={section} tabIndex={-1} aria-labelledby="result-deltas-title" className="lab-card lab-deltas">
      <h3 id="result-deltas-title" className="lab-deltas-h">
        {t("title")}
      </h3>
      <ul className="lab-deltas-list">
        {deltas.map((delta) => (
          <DeltaRow key={delta.id} delta={delta} />
        ))}
      </ul>
      <Link className="lab-deltas-open" href="/dashboard">
        {t("open")} <span aria-hidden="true">→</span>
      </Link>
      <RoundSavedToast roundId={labRound.facts.id} target={section} />
    </section>
  );
}
