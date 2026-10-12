"use client";

import { useMemo } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { LabData } from "@/hooks/useLabData";
import { useFigureText } from "@/components/dashboard/figureText";
import { TrendChip } from "@/components/dashboard/TrendChip";
import { standingOf } from "@/components/dashboard/useGameStanding";
import { useWeekGoal } from "@/components/home/useWeekGoal";
import { readDailyOpened, utcDayOf } from "@/lib/lab/daily";
import type { GameStanding } from "@/lib/lab/dashboard";
import type { RoundRecord } from "@/lib/lab/record";
import { roundDeltasOf, verdictOf, type FigureDelta } from "@/lib/lab/roundDeltas";
import { START_RATING, useGameStore, WIN_ACCURACY } from "@/lib/store/gameStore";
import { useSavedRound } from "./useSavedRound";

/** The game standing after the round and the one it started from; a review moves neither, so both are the same. */
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

function DeltaSection({ round, data, roundId }: { round: RoundRecord; data: LabData; roundId: string }) {
  const t = useTranslations("dashboard.deltas");
  const [weekGoal] = useWeekGoal();
  const standings = useRoundStandings(roundId);
  const { records, summary, today } = data;
  const deltas = useMemo(
    () =>
      roundDeltasOf({
        dashboard: {
          records,
          summary,
          today,
          weekGoal,
          entries: null,
          utcDay: utcDayOf(Date.now()),
          dailyOpened: readDailyOpened(),
          chooseHref: null,
          game: standings.after,
          winAccuracy: WIN_ACCURACY,
        },
        round,
        gameBefore: standings.before,
      }),
    [records, summary, today, weekGoal, standings, round],
  );

  return (
    <section aria-labelledby="result-deltas-title" className="lab-card lab-deltas">
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
    </section>
  );
}

/**
 * The dashboard's lead and summary figures after the round just played, each beside what it read before. Drawn once
 * the round is in the record, from the same tile builders as the dashboard; nothing when the round never arrives.
 */
export default function ResultDeltas({ roundId }: { roundId: string }) {
  const saved = useSavedRound(roundId);
  if (saved.state !== "found") return null;
  return <DeltaSection round={saved.round} data={saved.data} roundId={roundId} />;
}
