"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useNow } from "@/components/home/DailyResetsIn";
import { useLabData } from "@/hooks/useLabData";
import { dailySettingOf } from "@/lib/daily/schedule";
import { dailyBoardOf, readDailyOpened, utcDayOf } from "@/lib/lab/daily";
import { readDailyEntry, type DailyEntry } from "@/lib/lab/entries";
import { DailyCard } from "./DailyCard";
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
  const board = day === null || lab.storage === "loading" ? null : dailyBoardOf(lab.records, day, readDailyOpened());
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
      <div className="daily-grid">
        <DailyCard board={board} setting={day === null ? null : dailySettingOf(day)} joined={joined} standing={standing} onJoined={onJoined} />
        <DailyTopTen rows={rows} joined={joined} played={board?.status === "played"} />
      </div>
    </>
  );
}
