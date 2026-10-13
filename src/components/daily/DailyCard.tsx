"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCopyText } from "@/components/home/useCopyText";
import type { DailySetting } from "@/lib/daily/schedule";
import { DEFAULT_PRESET } from "@/lib/game/configPrefill";
import { playHref } from "@/lib/game/roundLink";
import { SHARE_ORDER, shareRow, type DailyBoard, type DailyRound } from "@/lib/lab/daily";
import type { DailyEntry } from "@/lib/lab/entries";
import type { Standing } from "@/lib/leaderboard/standing";
import type { SquareOutcome } from "@/lib/lab/record";
import { DailyJoinForm } from "./DailyJoinForm";

type Translate = ReturnType<typeof useTranslations<"daily.page">>;

const PLAY_BEFORE_CLOCK = playHref(DEFAULT_PRESET.pieceCount, DEFAULT_PRESET.memorizeTime, "daily");

const BOARD_CELLS = Array.from({ length: 64 }, (_, index) => (Math.floor(index / 8) + index) % 2);

interface DailyCardProps {
  readonly board: DailyBoard | null;
  readonly setting: DailySetting | null;
  readonly joined: DailyEntry | null;
  readonly standing: Standing | null;
  readonly onJoined: (entry: DailyEntry) => void;
}

export function DailyCard({ board, setting, joined, standing, onJoined }: DailyCardProps) {
  const t = useTranslations("daily.page");
  if (board?.status === "played") {
    return (
      <section className="daily-card" aria-labelledby="daily-card-title" data-state={joined ? "joined" : "played"}>
        <Result t={t} round={board.round} titleId="daily-card-title" />
        {joined ? <Joined t={t} standing={standing} /> : <DailyJoinForm round={board.round} onJoined={onJoined} />}
      </section>
    );
  }
  if (board?.status === "unfinished") {
    return (
      <section className="daily-card" aria-labelledby="daily-card-title" data-state="unfinished">
        <h2 id="daily-card-title" className="daily-card-title">{t("unfinishedTitle")}</h2>
        <p className="daily-note">{t("unfinished")}</p>
        <HiddenBoard t={t} />
      </section>
    );
  }
  return (
    <section className="daily-card" aria-labelledby="daily-card-title" data-state="open">
      <h2 id="daily-card-title" className="daily-card-title">{t("open")}</h2>
      <ul className="daily-facts">
        <li>{setting && t("pieces", { count: setting.pieceCount })}</li>
        <li>{setting && t("seconds", { count: setting.memorizeTime })}</li>
        <li>{t("oneTry")}</li>
      </ul>
      <HiddenBoard t={t} />
      <Link className="lab-btn lab-btn-primary daily-play" href={setting ? playHref(setting.pieceCount, setting.memorizeTime, "daily") : PLAY_BEFORE_CLOCK}>
        {t("play")}
      </Link>
      {board?.streak && board.streak.current > 0 && <p className="daily-note">{t("streak", { count: board.streak.current })}</p>}
    </section>
  );
}

function HiddenBoard({ t }: { t: Translate }) {
  return (
    <div className="daily-hidden" role="img" aria-label={t("hidden")}>
      {BOARD_CELLS.map((dark, index) => (
        <i key={index} data-dark={dark === 1 ? "" : undefined} />
      ))}
      <span aria-hidden="true">{t("hidden")}</span>
    </div>
  );
}

function tally(squares: string): Record<SquareOutcome, number> {
  const counts: Record<SquareOutcome, number> = { ".": 0, c: 0, w: 0, m: 0, x: 0 };
  for (const outcome of squares) counts[outcome as SquareOutcome] += 1;
  return counts;
}

/** Squares only: the grid says how each square went and never which piece stood on it. */
function Result({ t, round, titleId }: { t: Translate; round: DailyRound; titleId: string }) {
  const format = useFormatter();
  const counts = tally(round.squares);
  const seconds = format.number(round.solveMs / 1000, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const row = shareRow(round.squares);
  const text = t("shareText", { day: round.dailyDay, row, correct: round.correct, pieceCount: round.config.pieceCount });
  const { state: copy, copy: copyResult, textRef } = useCopyText(text);

  return (
    <>
      <div>
        <h2 id={titleId} className="daily-kicker">{t("result")}</h2>
        <p className="daily-score">
          <strong>{t("score", { correct: round.correct, pieceCount: round.config.pieceCount })}</strong> <span>{t("rebuild", { seconds })}</span>
        </p>
      </div>
      <div className="daily-outcome" role="img" aria-label={t("gridAria", { correct: counts.c, wrong: counts.w, missed: counts.m, extra: counts.x })}>
        {[...round.squares].map((outcome, index) => (
          <i key={index} data-outcome={outcome === "." ? undefined : outcome} />
        ))}
      </div>
      <ul className="daily-key">
        {SHARE_ORDER.filter((outcome) => counts[outcome] > 0).map((outcome) => (
          <li key={outcome} data-outcome={outcome}>
            {t(`key.${outcome}`)}
          </li>
        ))}
      </ul>
      <div className="daily-share">
        <p className="daily-note">{t("shareLabel")}</p>
        <p className="daily-share-row">{row}</p>
        <div className="daily-share-actions">
          <button type="button" className="lab-btn lab-btn-secondary lab-btn-sm" onClick={copyResult}>
            {t("copy")}
          </button>
          <span className="daily-note" role="status">
            {copy === "idle" ? "" : t(copy === "copied" ? "copied" : "copyFailed")}
          </span>
        </div>
        {copy === "failed" && (
          <pre ref={textRef} className="daily-share-text">
            {text}
          </pre>
        )}
      </div>
    </>
  );
}

function Joined({ t, standing }: { t: Translate; standing: Standing | null }) {
  return (
    <div className="daily-joined" role="status">
      <p className="daily-joined-title">{t("joined")}</p>
      <p className="daily-note">{standing && t("rank", { rank: standing.rank, total: standing.total })}</p>
    </div>
  );
}
