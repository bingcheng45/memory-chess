"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useNow } from "@/components/home/DailyResetsIn";
import { useLabData } from "@/hooks/useLabData";
import { dailySettingOf } from "@/lib/daily/schedule";
import { dailyBoardOf, readDailyOpened, utcDayOf, type DailyRound } from "@/lib/lab/daily";
import { DAY_MS } from "@/lib/lab/readiness";
import { readDailyEntry, type DailyEntry } from "@/lib/lab/entries";
import { DailyCard } from "./DailyCard";
import { DailyJoinForm } from "./DailyJoinForm";
import { DailyResetLine } from "./DailyResetLine";
import { DailyTopTen } from "./DailyTopTen";
import { useDailyRows, useDailyStanding } from "./useDailyRows";
import "./daily.css";

export function DailyBoard() {
  const t = useTranslations("daily.page");
  const format = useFormatter();
  const now = useNow();
  const lab = useLabData();
  const day = now === null ? null : utcDayOf(now);
  const yesterday = now === null ? null : utcDayOf(now - DAY_MS);
  const board = day === null || lab.storage === "loading" ? null : dailyBoardOf(lab.records, day, readDailyOpened());
  const late = yesterday === null || lab.storage === "loading" ? null : dailyBoardOf(lab.records, yesterday, null);
  const [joined, setJoined] = useState<DailyEntry | null>(null);
  const [rowsVersion, setRowsVersion] = useState(0);
  const rows = useDailyRows(day, rowsVersion);
  const standing = useDailyStanding(joined);

  useEffect(() => {
    if (day !== null) setJoined(readDailyEntry(day));
  }, [day]);

  const onJoined = (entry: DailyEntry) => {
    setJoined(entry);
    setRowsVersion((version) => version + 1);
  };

  return (
    <>
      <header className="daily-head">
        <div>
          <p className="daily-fig">{day && t("fig", { date: format.dateTime(Date.parse(`${day}T00:00:00Z`), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) })}</p>
          <h1 className="daily-title">{t("title")}</h1>
          <p className="daily-lede">{t("lede")}</p>
        </div>
        <DailyResetLine now={now} />
      </header>
      {late?.status === "played" && <LateJoin key={late.day} round={late.round} />}
      <div className="daily-grid">
        <DailyCard board={board} setting={day === null ? null : dailySettingOf(day)} joined={joined} standing={standing} onJoined={onJoined} />
        <DailyTopTen rows={rows} joined={joined} played={board?.status === "played"} />
      </div>
    </>
  );
}

/** The server still takes rows for yesterday, so a round played on yesterday's board and not joined can join it here. */
function LateJoin({ round }: { round: DailyRound }) {
  const t = useTranslations("daily.page");
  const tJoin = useTranslations("daily.join");
  const format = useFormatter();
  const [joined, setJoined] = useState<DailyEntry | "before" | null>(null);

  useEffect(() => {
    if (readDailyEntry(round.dailyDay)) setJoined("before");
  }, [round.dailyDay]);

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
