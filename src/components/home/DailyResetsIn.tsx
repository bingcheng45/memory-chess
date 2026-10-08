"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { msToNextUtcDay } from "@/lib/lab/daily";

const TICK_MS = 30_000;

/** The time on the client, null on the server and the first render, so no date-based text is server rendered. */
export function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

export function DailyResetsIn({ now }: { now: number }) {
  const t = useTranslations("home.lab.record.daily");
  const minutes = Math.floor(msToNextUtcDay(now) / 60_000);
  return <>{t("resetsIn", { hours: Math.floor(minutes / 60), minutes: minutes % 60 })}</>;
}
