"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useLabData } from "@/hooks/useLabData";
import type { DailySetting } from "@/lib/daily/schedule";
import { DAILY_PLAYED_PARAM, dailyBoardOf, readDailyOpened, utcDayOf, type DailyRound } from "@/lib/lab/daily";
import { DAY_MS } from "@/lib/lab/readiness";
import { readDailyEntry, type DailyEntry } from "@/lib/lab/entries";
import { DailyCard } from "./DailyCard";
import { DailyJoinForm } from "./DailyJoinForm";
import { useDailyStanding } from "./useDailyRows";

interface DailyPlayerProps {
  readonly day: string | null;
  readonly setting: DailySetting;
  readonly joined: DailyEntry | null;
  readonly onJoined: (entry: DailyEntry) => void;
  readonly onPlayed: (played: boolean) => void;
}

/** This device's part of the page: its round on today's board, the join form, and a late join for yesterday's board. */
export function DailyPlayer({ day, setting, joined, onJoined, onPlayed }: DailyPlayerProps) {
  const lab = useLabData();
  const read = day !== null && lab.storage !== "loading";
  const board = read ? dailyBoardOf(lab.records, day, readDailyOpened()) : null;
  const late = read ? dailyBoardOf(lab.records, utcDayOf(Date.parse(`${day}T00:00:00Z`) - DAY_MS), null) : null;
  const standing = useDailyStanding(joined);
  const justPlayed = useJustPlayed();
  const played = board?.status === "played";

  useEffect(() => onPlayed(played), [played, onPlayed]);

  return (
    <>
      {late?.status === "played" && <LateJoin key={late.day} round={late.round} />}
      <DailyCard board={board} setting={setting} joined={joined} standing={standing} onJoined={onJoined} justPlayed={justPlayed} />
    </>
  );
}

/**
 * Whether the game sent the player here straight after today's round. The marker is taken off the address, so a
 * refresh or a shared link reads as an ordinary visit.
 */
function useJustPlayed(): boolean {
  const [justPlayed, setJustPlayed] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has(DAILY_PLAYED_PARAM)) return;
    setJustPlayed(true);
    params.delete(DAILY_PLAYED_PARAM);
    const query = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }, []);
  return justPlayed;
}

/** The server still takes rows for yesterday, so a round played on yesterday's board and not joined can join it here. */
function LateJoin({ round }: { round: DailyRound }) {
  const t = useTranslations("daily.page");
  const tJoin = useTranslations("daily.join");
  const format = useFormatter();
  const [joined, setJoined] = useState<DailyEntry | "before" | null>(() => (readDailyEntry(round.dailyDay) ? "before" : null));

  if (joined === "before") return null;
  const date = format.dateTime(Date.parse(`${round.dailyDay}T00:00:00Z`), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  return (
    <section className="daily-card daily-late" aria-labelledby="daily-late-title">
      <h2 id="daily-late-title" className="daily-kicker">
        {t("fig", { date })}
      </h2>
      <p className="daily-note">
        <strong>{t("score", { correct: round.correct, pieceCount: round.config.pieceCount })}</strong> {t("lateNote")}
      </p>
      {joined ? (
        <p className="daily-joined-title" role="status">
          {t("lateJoined")}
        </p>
      ) : (
        <DailyJoinForm round={round} onJoined={setJoined} title={tJoin("lateTitle")} />
      )}
    </section>
  );
}
