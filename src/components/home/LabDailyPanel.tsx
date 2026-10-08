"use client";

import { Fragment, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics/events";
import { playHref } from "@/lib/game/roundLink";
import { DAILY_SETTING, dailyBoardOf, readDailyOpened, SHARE_CELLS, shareGrid, utcDayOf, type DailyRound } from "@/lib/lab/daily";
import type { RoundRecord, SquareOutcome } from "@/lib/lab/record";
import type { StreakValue } from "@/lib/lab/streak";
import { DailyResetsIn, useNow } from "./DailyResetsIn";
import { figureOf, PanelHead, useTags } from "./LabRecordPanels";

const DAILY_HREF = playHref(DAILY_SETTING.pieceCount, DAILY_SETTING.memorizeTime, "daily");
const KEY = ["c", "w", "m", "x"] as const;

type Translate = ReturnType<typeof useTranslations<"home.lab.record.daily">>;
type CopyState = "idle" | "copied" | "failed";

function StreakLine({ t, streak }: { t: Translate; streak: StreakValue | null }) {
  if (!streak || streak.current === 0) return null;
  return <p className="lab-note">{t("streak", { current: streak.current, forgiven: streak.forgivenDays.length, longest: streak.longest })}</p>;
}

function counts(squares: string) {
  const tally: Record<SquareOutcome, number> = { ".": 0, c: 0, w: 0, m: 0, x: 0 };
  for (const outcome of squares) tally[outcome as SquareOutcome] += 1;
  return { correct: tally.c, wrong: tally.w, missed: tally.m, extra: tally.x };
}

function ShareGrid({ t, round, day }: { t: Translate; round: DailyRound; day: string }) {
  const gridRef = useRef<HTMLPreElement>(null);
  const [copy, setCopy] = useState<CopyState>("idle");
  const grid = shareGrid(round.squares);

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(t("share", { day, correct: round.correct, pieceCount: round.config.pieceCount, accuracy: round.accuracy, grid }));
      setCopy("copied");
    } catch {
      if (gridRef.current) window.getSelection()?.selectAllChildren(gridRef.current);
      setCopy("failed");
    }
  };

  return (
    <div className="lab-daily-share">
      <pre ref={gridRef} className="lab-daily-grid" role="img" aria-label={t("gridAria", counts(round.squares))}>
        {grid}
      </pre>
      <p className="lab-note lab-daily-key">
        {KEY.map((outcome) => (
          <span key={outcome}>
            <span aria-hidden="true">{SHARE_CELLS[outcome]}</span> {t(`key.${outcome}`)}
          </span>
        ))}
      </p>
      <button type="button" className="lab-btn lab-btn-secondary" onClick={copyResult}>
        {t("copy")}
      </button>
      <p className="lab-note lab-daily-copied" role="status">
        {copy === "idle" ? "" : t(copy === "copied" ? "copied" : "copyFailed")}
      </p>
    </div>
  );
}

interface DailyPanelProps {
  readonly records: readonly RoundRecord[];
  /** False on the server and while the record loads, so the panel then shows only what is the same for everyone. */
  readonly ready: boolean;
}

/** Today's shared board: open with a link to play it, unfinished once opened without a result, or played with its share grid. */
export function DailyPanel({ records, ready }: DailyPanelProps) {
  const t = useTranslations("home.lab.record.daily");
  const tags = useTags();
  const now = useNow();
  // Read again on each tick, which also picks up the board being opened in another tab.
  const board = ready && now !== null ? dailyBoardOf(records, utcDayOf(now), readDailyOpened()) : null;
  const played = board?.status === "played" ? board : null;

  return (
    <div className="lab-panel lab-p-daily">
      <PanelHead fig={t("fig", { number: figureOf("daily") })} tag={played ? tags.mine : null} />
      <h3>{t("title")}</h3>
      <p className="lab-panel-desc">{t("desc")}</p>
      <Fragment key={board?.status ?? "waiting"}>
        {played ? (
          <div className="lab-daily-body">
            <div>
              <p className="lab-daily-status">{t("played", { correct: played.round.correct, pieceCount: played.round.config.pieceCount, accuracy: played.round.accuracy })}</p>
              <p className="lab-note">{t("done")}</p>
              <StreakLine t={t} streak={played.streak} />
            </div>
            <ShareGrid t={t} round={played.round} day={played.day} />
          </div>
        ) : (
          <>
            <p className="lab-daily-status">{board && t(board.status === "unfinished" ? "unfinished" : "open")}</p>
            <StreakLine t={t} streak={board?.streak ?? null} />
            {board?.status !== "unfinished" && (
              <Link
                className="lab-btn lab-btn-secondary lab-daily-play"
                href={DAILY_HREF}
                onClick={() => trackEvent({ name: "lab_panel_action", params: { panel: "daily", action: "play" } })}
              >
                {t("play")} →
              </Link>
            )}
          </>
        )}
      </Fragment>
      <p className="lab-note lab-daily-reset" data-clock="">
        <DailyResetsIn now={now} />
      </p>
    </div>
  );
}
