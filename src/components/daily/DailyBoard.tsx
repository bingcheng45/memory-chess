"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useNow } from "@/components/home/DailyResetsIn";
import { dailySettingOf } from "@/lib/daily/schedule";
import type { DailyTopRender } from "@/lib/daily/topTen";
import { utcDayOf } from "@/lib/lab/daily";
import { readDailyEntry, type DailyEntry } from "@/lib/lab/entries";
import { DailyOpenCard } from "./DailyOpenCard";
import type { DailyPlayer } from "./DailyPlayer";
import { DailyResetLine } from "./DailyResetLine";
import { DailyTopTen } from "./DailyTopTen";
import { useDailyRows } from "./useDailyRows";
import "./daily.css";

/**
 * The day shown is the server's until the device's clock is read, so the server renders the same heading, card and
 * rows the first client render does.
 */
export function DailyBoard({ rendered }: { rendered: DailyTopRender }) {
  const t = useTranslations("daily.page");
  const format = useFormatter();
  const now = useNow();
  const day = now === null ? null : utcDayOf(now);
  const shownDay = day ?? rendered.today;
  const setting = dailySettingOf(shownDay);
  const [joined, setJoined] = useState<DailyEntry | null>(null);
  const [played, setPlayed] = useState(false);
  const rows = useDailyRows(day, rendered, joined?.id ?? null);
  const Player = useDailyPlayer();

  useEffect(() => {
    if (day !== null) setJoined(readDailyEntry(day));
  }, [day]);

  return (
    <>
      <header className="daily-head">
        <div>
          <p className="daily-fig">{t("fig", { date: format.dateTime(Date.parse(`${shownDay}T00:00:00Z`), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) })}</p>
          <h1 className="daily-title">{t("title")}</h1>
          <p className="daily-lede">{t("lede")}</p>
        </div>
        <DailyResetLine now={now} />
      </header>
      <div className="daily-grid">
        {Player ? <Player day={day} setting={setting} joined={joined} onJoined={setJoined} onPlayed={setPlayed} /> : <DailyOpenCard setting={setting} />}
        <DailyTopTen rows={rows} today={shownDay} joined={joined} played={played} />
      </div>
    </>
  );
}

/** The lab record, the chess rules it scores with and the join form load once the page is interactive; the open card stands in until then. */
function useDailyPlayer(): typeof DailyPlayer | null {
  const [player, setPlayer] = useState<typeof DailyPlayer | null>(null);
  useEffect(() => {
    let live = true;
    import("./DailyPlayer").then(
      (loaded) => {
        if (live) setPlayer(() => loaded.DailyPlayer);
      },
      (error: unknown) => console.error("The daily player's code failed to load:", error),
    );
    return () => {
      live = false;
    };
  }, []);
  return player;
}
