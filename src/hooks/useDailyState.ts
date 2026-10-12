"use client";

import { useEffect, useState } from "react";
import { dailySettingOf, type DailySetting } from "@/lib/daily/schedule";
import { DAILY_OPENED_KEY, msToNextUtcDay, readDailyOpened, utcDayOf } from "@/lib/lab/daily";

const MINUTE_MS = 60_000;

export interface TimeLeft {
  readonly hours: number;
  readonly minutes: number;
}

export type DailyState =
  | { readonly status: "ready"; readonly day: string; readonly setting: DailySetting; readonly left: TimeLeft }
  | { readonly status: "used"; readonly day: string; readonly left: TimeLeft };

const msToNextMinuteTick = (at: number) => msToNextUtcDay(at) % MINUTE_MS || MINUTE_MS;

const timeLeftOf = (at: number): TimeLeft => {
  const minutes = Math.ceil(msToNextUtcDay(at) / MINUTE_MS);
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
};

export function dailyStateAt(at: number, openedDay: string | null): DailyState {
  const day = utcDayOf(at);
  const left = timeLeftOf(at);
  return openedDay === day ? { status: "used", day, left } : { status: "ready", day, setting: dailySettingOf(day), left };
}

export function useDailyState(): DailyState | null {
  const [state, setState] = useState<DailyState | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    const read = () => setState(dailyStateAt(Date.now(), readDailyOpened()));
    const tick = () => {
      read();
      timer = window.setTimeout(tick, msToNextMinuteTick(Date.now()));
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === DAILY_OPENED_KEY || event.key === null) read();
    };
    tick();
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return state;
}
